# Design: MCP模块-Transport层策略模式重构

## 优化前架构

```
┌────────────────────────────────────────┐
│           MCPClient                     │
│  ┌──────────────────────────────────┐ │
│  │ start_stdio() - 同步实现         │ │
│  │ start_http() - mock              │ │
│  │ start_websocket() - mock         │ │
│  │ call_tool_stdio() - mock        │ │
│  │ call_tool_http() - 简单实现      │ │
│  │ call_tool_websocket() - mock    │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**问题：**
1. 所有transport逻辑耦合在一个结构体
2. mock实现与真实实现混在一起
3. 难以独立测试
4. 难以扩展新transport类型

## 优化后架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCPClient (简化后)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  transport: Box<dyn Transport>                           │   │
│  │  call_tool() → transport.call()                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Transport Trait                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ + start() -> Result                                      │   │
│  │ + stop() -> Result                                       │   │
│  │ + call(request) -> Result                                │   │
│  │ + transport_type() -> MCPTransportType                   │   │
│  │ + is_connected() -> bool                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────┴────────┐ ┌──────┴───────┐ ┌────────┴────────┐
│   StdioTransport │ │ HttpTransport │ │WebSocketTransport│
│  ┌─────────────┐ │ ┌───────────┐  │  ┌────────────┐  │
│  │ Command     │ │ │ reqwest   │  │  │ tungstenite │  │
│  │ BufReader   │ │ │ Client    │  │  │ WebSocket  │  │
│  │ stdin/stdout│ │ │ HTTP/JSON │  │  │ Stream/Sink│  │
│  └─────────────┘ │ └───────────┘  │  └────────────┘  │
└──────────────────┘ └───────────────┘ └─────────────────┘
```

## 详细设计

### 1. Transport Trait 定义

```rust
// src-tauri/src/mcp/transport.rs

use super::types::{MCPRequest, MCPResponse, MCPTransportType};

/// Transport trait - 抽象传输层接口
/// 
/// 遵循Rust异步编程最佳实践：
/// - 使用async trait（需要async-trait或nightly）
/// - 不跨.await持有锁
/// - 错误处理使用Result类型
pub trait Transport: Send + Sync {
    /// 启动传输层
    async fn start(&self) -> Result<(), TransportError>;
    
    /// 停止传输层
    async fn stop(&self) -> Result<(), TransportError>;
    
    /// 发送请求并等待响应
    async fn call(&self, request: MCPRequest) -> Result<MCPResponse, TransportError>;
    
    /// 获取传输类型
    fn transport_type(&self) -> MCPTransportType;
    
    /// 检查连接状态
    fn is_connected(&self) -> bool;
}

/// Transport错误类型
#[derive(Debug, Clone)]
pub enum TransportError {
    NotConnected,
    ConnectionFailed(String),
    RequestFailed(String),
    Timeout,
    InvalidResponse(String),
}
```

### 2. StdioTransport 实现

```rust
pub struct StdioTransport {
    config: MCPServiceConfig,
    process: Arc<RwLock<Option<Child>>>,
    writer: Arc<RwLock<Option<ChildStdin>>>,
    reader: Arc<RwLock<Option<ChildStdout>>>,
    connected: Arc<AtomicBool>,
}

impl StdioTransport {
    pub fn new(config: MCPServiceConfig) -> Self {
        Self {
            config,
            process: Arc::new(RwLock::new(None)),
            writer: Arc::new(RwLock::new(None)),
            reader: Arc::new(RwLock::new(None)),
            connected: Arc::new(AtomicBool::new(false)),
        }
    }
}

#[async_trait]
impl Transport for StdioTransport {
    async fn start(&self) -> Result<(), TransportError> {
        let command = self.config.command.as_ref()
            .ok_or(TransportError::ConnectionFailed("STDIO requires command".into()))?;

        let mut cmd = Command::new(command);
        cmd.args(&self.config.args);
        cmd.envs(&self.config.env);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let child = cmd.spawn()
            .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;

        // 分离stdin/stdout
        let stdin = child.stdin.take()
            .ok_or(TransportError::ConnectionFailed("Cannot capture stdin".into()))?;
        let stdout = child.stdout.take()
            .ok_or(TransportError::ConnectionFailed("Cannot capture stdout".into()))?;

        *self.process.write().await = Some(child);
        *self.writer.write().await = Some(stdin);
        *self.reader.write().await = Some(stdout);
        
        self.connected.store(true, Ordering::SeqCst);
        Ok(())
    }

    async fn stop(&self) -> Result<(), TransportError> {
        if let Some(mut child) = self.process.write().await.take() {
            child.kill().await
                .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;
        }
        self.connected.store(false, Ordering::SeqCst);
        Ok(())
    }

    async fn call(&self, request: MCPRequest) -> Result<MCPResponse, TransportError> {
        if !self.is_connected() {
            return Err(TransportError::NotConnected);
        }

        // 序列化请求
        let json = serde_json::to_string(&request)
            .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;
        
        // 发送请求
        let mut writer = self.writer.write().await;
        if let Some(ref mut stdin) = *writer {
            stdin.write_all(json.as_bytes()).await
                .map_err(|e| TransportError::RequestFailed(e.to_string()))?;
            stdin.write_all(b"\n").await
                .map_err(|e| TransportError::RequestFailed(e.to_string()))?;
        }

        // 读取响应
        let mut reader = self.reader.write().await;
        let mut buf_reader = BufReader::new(reader.as_mut().ok_or(TransportError::NotConnected)?);
        let mut line = String::new();
        buf_reader.read_line(&mut line).await
            .map_err(|e| TransportError::RequestFailed(e.to_string()))?;

        serde_json::from_str(&line)
            .map_err(|e| TransportError::InvalidResponse(e.to_string()))
    }

    fn transport_type(&self) -> MCPTransportType {
        MCPTransportType::Stdio
    }

    fn is_connected(&self) -> bool {
        self.connected.load(Ordering::SeqCst)
    }
}
```

### 3. HttpTransport 实现

```rust
pub struct HttpTransport {
    config: MCPServiceConfig,
    client: reqwest::Client,
    connected: Arc<AtomicBool>,
}

impl HttpTransport {
    pub fn new(config: MCPServiceConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            config,
            client,
            connected: Arc::new(AtomicBool::new(false)),
        }
    }
}

#[async_trait]
impl Transport for HttpTransport {
    async fn start(&self) -> Result<(), TransportError> {
        let url = self.config.url.as_ref()
            .ok_or(TransportError::ConnectionFailed("HTTP requires URL".into()))?;

        // 健康检查
        match self.client.get(url).send().await {
            Ok(resp) if resp.status().is_success() => {
                self.connected.store(true, Ordering::SeqCst);
                Ok(())
            }
            Ok(resp) => Err(TransportError::ConnectionFailed(
                format!("Health check failed: {}", resp.status())
            )),
            Err(e) => Err(TransportError::ConnectionFailed(e.to_string())),
        }
    }

    async fn stop(&self) -> Result<(), TransportError> {
        self.connected.store(false, Ordering::SeqCst);
        Ok(())
    }

    async fn call(&self, request: MCPRequest) -> Result<MCPResponse, TransportError> {
        if !self.is_connected() {
            return Err(TransportError::NotConnected);
        }

        let url = self.config.url.as_ref()
            .ok_or(TransportError::ConnectionFailed("HTTP requires URL".into()))?;

        self.client.post(url)
            .json(&request)
            .send()
            .await
            .map_err(|e| TransportError::RequestFailed(e.to_string()))?
            .json::<MCPResponse>()
            .await
            .map_err(|e| TransportError::InvalidResponse(e.to_string()))
    }

    fn transport_type(&self) -> MCPTransportType {
        MCPTransportType::Http
    }

    fn is_connected(&self) -> bool {
        self.connected.load(Ordering::SeqCst)
    }
}
```

### 4. WebSocketTransport 实现

```rust
pub struct WebSocketTransport {
    config: MCPServiceConfig,
    sink: Arc<RwLock<Option<WebSocketSink>>>,
    stream: Arc<RwLock<Option<WebSocketStream>>>,
    connected: Arc<AtomicBool>,
}

#[async_trait]
impl Transport for WebSocketTransport {
    async fn start(&self) -> Result<(), TransportError> {
        let url = self.config.ws_url.as_ref()
            .ok_or(TransportError::ConnectionFailed("WebSocket requires URL".into()))?;

        let (stream, _) = tokio_tungstenite::connect_async(url)
            .await
            .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;

        let (sink, stream) = stream.split();
        
        *self.sink.write().await = Some(sink);
        *self.stream.write().await = Some(stream);
        self.connected.store(true, Ordering::SeqCst);
        
        Ok(())
    }

    async fn stop(&self) -> Result<(), TransportError> {
        if let Some(sink) = self.sink.write().await.take() {
            sink.close().await;
        }
        self.stream.write().await.take();
        self.connected.store(false, Ordering::SeqCst);
        Ok(())
    }

    async fn call(&self, request: MCPRequest) -> Result<MCPResponse, TransportError> {
        if !self.is_connected() {
            return Err(TransportError::NotConnected);
        }

        let json = serde_json::to_string(&request)
            .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;

        let msg = Message::Text(json);
        
        // 发送请求
        let sink = self.sink.read().await;
        if let Some(ref mut s) = *sink {
            s.send(msg).await
                .map_err(|e| TransportError::RequestFailed(e.to_string()))?;
        }

        // 读取响应
        let stream = self.stream.read().await;
        if let Some(ref mut st) = *stream {
            let msg = st.next().await
                .ok_or(TransportError::RequestFailed("No response".into()))??;
            
            if let Message::Text(text) = msg {
                serde_json::from_str(&text)
                    .map_err(|e| TransportError::InvalidResponse(e.to_string()))
            } else {
                Err(TransportError::InvalidResponse("Expected text message".into()))
            }
        } else {
            Err(TransportError::NotConnected)
        }
    }

    fn transport_type(&self) -> MCPTransportType {
        MCPTransportType::WebSocket
    }

    fn is_connected(&self) -> bool {
        self.connected.load(Ordering::SeqCst)
    }
}
```

### 5. TransportFactory

```rust
pub struct TransportFactory;

impl TransportFactory {
    pub fn create(config: &MCPServiceConfig) -> Box<dyn Transport> {
        match config.transport {
            MCPTransportType::Stdio => Box::new(StdioTransport::new(config.clone())),
            MCPTransportType::Http => Box::new(HttpTransport::new(config.clone())),
            MCPTransportType::WebSocket => Box::new(WebSocketTransport::new(config.clone())),
        }
    }
}
```

### 6. MCPClient 重构

```rust
pub struct MCPClient {
    config: MCPClientConfig,
    transport: Box<dyn Transport>,
    status: Arc<RwLock<MCPServiceStatus>>,
    tools: Arc<RwLock<Vec<MCPTool>>>,
}

impl MCPClient {
    pub fn new(config: MCPClientConfig) -> Self {
        let transport = TransportFactory::create(&config.service);
        
        Self {
            config,
            transport,
            status: Arc::new(RwLock::new(MCPServiceStatus::Stopped)),
            tools: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn start(&self) -> Result<(), String> {
        let mut status = self.status.write().await;
        *status = MCPServiceStatus::Starting;
        
        self.transport.start().await
            .map_err(|e| e.to_string())?;
        
        *status = MCPServiceStatus::Running;
        Ok(())
    }

    pub async fn stop(&self) -> Result<(), String> {
        self.transport.stop().await
            .map_err(|e| e.to_string())?;
        
        let mut status = self.status.write().await;
        *status = MCPServiceStatus::Stopped;
        Ok(())
    }

    pub async fn call_tool(&self, call: MCPToolCall) -> Result<MCPToolResult, String> {
        if self.status().await != MCPServiceStatus::Running {
            return Err("Service is not running".to_string());
        }

        let request = MCPRequest::CallTool(call);
        let response = self.transport.call(request).await
            .map_err(|e| e.to_string())?;

        match response {
            MCPResponse::CallToolResult(result) => Ok(result),
            _ => Err("Unexpected response type".to_string()),
        }
    }
}
```

## 实现要点

1. **使用async-trait**: 需要添加`async-trait` crate
2. **添加tokio-tungstenite**: WebSocket支持
3. **保持向后兼容**: MCPClient接口不变
4. **测试策略**: 为每个Transport实现写单元测试
5. **错误处理**: 使用自定义TransportError枚举

## 依赖变更

```toml
# Cargo.toml 添加
async-trait = "0.1"
tokio-tungstenite = "0.21"
futures-util = "0.3"
```
