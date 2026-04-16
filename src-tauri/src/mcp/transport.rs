//! MCP Transport层实现 - 策略模式
//! 
//! 提供STDIO、HTTP、WebSocket三种传输方式的抽象实现

use std::process::Stdio;
use std::sync::Arc;

use async_trait::async_trait;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;
use tokio::time::{timeout, Duration};
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, WebSocketStream, MaybeTlsStream};
use tungstenite::Message;

use super::types::{
    MCPTransportType, MCPServiceConfig, MCPMessage,
};

/// WebSocket流类型别名
type WsStream = WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>;

/// Transport trait - 抽象传输层接口
/// 
/// 遵循Rust异步编程最佳实践：
/// - 使用async-trait
/// - 不跨.await持有锁
/// - 错误处理使用Result类型
#[async_trait]
pub trait Transport: Send + Sync {
    /// 启动传输层
    async fn start(&self) -> Result<(), TransportError>;
    
    /// 停止传输层
    async fn stop(&self) -> Result<(), TransportError>;
    
    /// 发送请求并等待响应
    async fn call(&self, request: &MCPMessage) -> Result<MCPMessage, TransportError>;
    
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

impl std::fmt::Display for TransportError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TransportError::NotConnected => write!(f, "Transport not connected"),
            TransportError::ConnectionFailed(msg) => write!(f, "Connection failed: {}", msg),
            TransportError::RequestFailed(msg) => write!(f, "Request failed: {}", msg),
            TransportError::Timeout => write!(f, "Request timeout"),
            TransportError::InvalidResponse(msg) => write!(f, "Invalid response: {}", msg),
        }
    }
}

impl std::error::Error for TransportError {}

/// STDIO传输实现
pub struct StdioTransport {
    config: MCPServiceConfig,
    process: Arc<RwLock<Option<Child>>>,
    writer: Arc<RwLock<Option<tokio::process::ChildStdin>>>,
    reader: Arc<RwLock<Option<tokio::process::ChildStdout>>>,
    connected: Arc<std::sync::atomic::AtomicBool>,
}

impl StdioTransport {
    pub fn new(config: MCPServiceConfig) -> Self {
        Self {
            config,
            process: Arc::new(RwLock::new(None)),
            writer: Arc::new(RwLock::new(None)),
            reader: Arc::new(RwLock::new(None)),
            connected: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }
}

#[async_trait]
impl Transport for StdioTransport {
    async fn start(&self) -> Result<(), TransportError> {
        let command = self.config.command.as_ref()
            .ok_or_else(|| TransportError::ConnectionFailed("STDIO requires command".into()))?;

        let mut cmd = Command::new(command);
        cmd.args(&self.config.args);
        cmd.envs(&self.config.env);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd.spawn()
            .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;

        let stdin = child.stdin.take()
            .ok_or_else(|| TransportError::ConnectionFailed("Cannot capture stdin".into()))?;
        let stdout = child.stdout.take()
            .ok_or_else(|| TransportError::ConnectionFailed("Cannot capture stdout".into()))?;

        *self.process.write().await = Some(child);
        *self.writer.write().await = Some(stdin);
        *self.reader.write().await = Some(stdout);
        
        self.connected.store(true, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }

    async fn stop(&self) -> Result<(), TransportError> {
        if let Some(mut child) = self.process.write().await.take() {
            child.kill().await
                .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;
        }
        self.connected.store(false, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }

    async fn call(&self, request: &MCPMessage) -> Result<MCPMessage, TransportError> {
        if !self.is_connected() {
            return Err(TransportError::NotConnected);
        }

        let timeout_duration = Duration::from_secs(self.config.timeout_secs);

        // 序列化请求
        let json = serde_json::to_string(request)
            .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;
        
        // 发送请求
        let mut writer_guard = self.writer.write().await;
        if let Some(ref mut stdin) = *writer_guard {
            stdin.write_all(json.as_bytes()).await
                .map_err(|e| TransportError::RequestFailed(e.to_string()))?;
            stdin.write_all(b"\n").await
                .map_err(|e| TransportError::RequestFailed(e.to_string()))?;
        }
        drop(writer_guard);

        // 读取响应
        let mut reader_guard = self.reader.write().await;
        if let Some(ref mut stdout) = *reader_guard {
            let mut buf_reader = BufReader::new(stdout);
            let mut line = String::new();

            let read_result = timeout(timeout_duration, buf_reader.read_line(&mut line)).await;
            
            match read_result {
                Ok(Ok(_)) => {
                    serde_json::from_str::<MCPMessage>(&line)
                        .map_err(|e| TransportError::InvalidResponse(e.to_string()))
                }
                Ok(Err(e)) => Err(TransportError::RequestFailed(e.to_string())),
                Err(_) => Err(TransportError::Timeout),
            }
        } else {
            Err(TransportError::NotConnected)
        }
    }

    fn transport_type(&self) -> MCPTransportType {
        MCPTransportType::Stdio
    }

    fn is_connected(&self) -> bool {
        self.connected.load(std::sync::atomic::Ordering::SeqCst)
    }
}

/// HTTP传输实现
pub struct HttpTransport {
    config: MCPServiceConfig,
    client: reqwest::Client,
    connected: Arc<std::sync::atomic::AtomicBool>,
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
            connected: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }
}

#[async_trait]
impl Transport for HttpTransport {
    async fn start(&self) -> Result<(), TransportError> {
        let url = self.config.url.as_ref()
            .ok_or_else(|| TransportError::ConnectionFailed("HTTP requires URL".into()))?;

        // 健康检查
        match self.client.get(url).send().await {
            Ok(resp) if resp.status().is_success() || resp.status().as_u16() == 404 => {
                self.connected.store(true, std::sync::atomic::Ordering::SeqCst);
                Ok(())
            }
            Ok(resp) => Err(TransportError::ConnectionFailed(
                format!("Health check failed: {}", resp.status())
            )),
            Err(e) => Err(TransportError::ConnectionFailed(e.to_string())),
        }
    }

    async fn stop(&self) -> Result<(), TransportError> {
        self.connected.store(false, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }

    async fn call(&self, request: &MCPMessage) -> Result<MCPMessage, TransportError> {
        if !self.is_connected() {
            return Err(TransportError::NotConnected);
        }

        let url = self.config.url.as_ref()
            .ok_or_else(|| TransportError::ConnectionFailed("HTTP requires URL".into()))?;

        let timeout_duration = Duration::from_secs(self.config.timeout_secs);

        let result = timeout(timeout_duration, async {
            self.client.post(url)
                .json(request)
                .send()
                .await
                .map_err(|e| TransportError::RequestFailed(e.to_string()))?
                .json::<MCPMessage>()
                .await
                .map_err(|e| TransportError::InvalidResponse(e.to_string()))
        }).await;

        match result {
            Ok(r) => r,
            Err(_) => Err(TransportError::Timeout),
        }
    }

    fn transport_type(&self) -> MCPTransportType {
        MCPTransportType::Http
    }

    fn is_connected(&self) -> bool {
        self.connected.load(std::sync::atomic::Ordering::SeqCst)
    }
}

/// WebSocket传输实现
pub struct WebSocketTransport {
    config: MCPServiceConfig,
    sink: Arc<RwLock<Option<futures_util::stream::SplitSink<WsStream, Message>>>>,
    stream: Arc<RwLock<Option<futures_util::stream::SplitStream<WsStream>>>>,
    connected: Arc<std::sync::atomic::AtomicBool>,
}

impl WebSocketTransport {
    pub fn new(config: MCPServiceConfig) -> Self {
        Self {
            config,
            sink: Arc::new(RwLock::new(None)),
            stream: Arc::new(RwLock::new(None)),
            connected: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }
}

#[async_trait]
impl Transport for WebSocketTransport {
    async fn start(&self) -> Result<(), TransportError> {
        let url = self.config.ws_url.as_ref()
            .ok_or_else(|| TransportError::ConnectionFailed("WebSocket requires URL".into()))?;

        let (ws_stream, _) = connect_async(url)
            .await
            .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;

        let (sink, stream) = ws_stream.split();
        
        *self.sink.write().await = Some(sink);
        *self.stream.write().await = Some(stream);
        self.connected.store(true, std::sync::atomic::Ordering::SeqCst);
        
        Ok(())
    }

    async fn stop(&self) -> Result<(), TransportError> {
        if let Some(mut sink) = self.sink.write().await.take() {
            let _ = sink.close().await;
        }
        self.stream.write().await.take();
        self.connected.store(false, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }

    async fn call(&self, request: &MCPMessage) -> Result<MCPMessage, TransportError> {
        if !self.is_connected() {
            return Err(TransportError::NotConnected);
        }

        let json = serde_json::to_string(request)
            .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;

        let msg = Message::Text(json);
        let timeout_duration = Duration::from_secs(self.config.timeout_secs);
        
        // 发送请求
        {
            let mut sink_guard = self.sink.write().await;
            if let Some(ref mut s) = *sink_guard {
                s.send(msg).await
                    .map_err(|e| TransportError::RequestFailed(e.to_string()))?;
            }
        }

        // 读取响应
        let mut stream_guard = self.stream.write().await;
        if let Some(ref mut st) = *stream_guard {
            let msg_result = timeout(timeout_duration, st.next()).await;
            
            match msg_result {
                Ok(Some(Ok(msg))) => {
                    if let Message::Text(text) = msg {
                        serde_json::from_str(&text)
                            .map_err(|e| TransportError::InvalidResponse(e.to_string()))
                    } else {
                        Err(TransportError::InvalidResponse("Expected text message".into()))
                    }
                }
                Ok(Some(Err(e))) => Err(TransportError::RequestFailed(e.to_string())),
                Ok(None) => Err(TransportError::RequestFailed("Connection closed".into())),
                Err(_) => Err(TransportError::Timeout),
            }
        } else {
            Err(TransportError::NotConnected)
        }
    }

    fn transport_type(&self) -> MCPTransportType {
        MCPTransportType::WebSocket
    }

    fn is_connected(&self) -> bool {
        self.connected.load(std::sync::atomic::Ordering::SeqCst)
    }
}

/// Transport工厂 - 根据配置创建对应的Transport实现
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transport_error_display() {
        let err = TransportError::NotConnected;
        assert_eq!(err.to_string(), "Transport not connected");

        let err = TransportError::ConnectionFailed("test".into());
        assert_eq!(err.to_string(), "Connection failed: test");
    }

    #[tokio::test]
    async fn test_stdio_transport_creation() {
        let config = MCPServiceConfig {
            id: "test".into(),
            name: "Test".into(),
            description: "Test transport".into(),
            transport: MCPTransportType::Stdio,
            command: Some("echo".into()),
            args: vec!["hello".into()],
            env: HashMap::new(),
            url: None,
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 5,
        };

        let transport = StdioTransport::new(config);
        assert_eq!(transport.transport_type(), MCPTransportType::Stdio);
        assert!(!transport.is_connected());
    }

    #[tokio::test]
    async fn test_http_transport_creation() {
        let config = MCPServiceConfig {
            id: "test".into(),
            name: "Test".into(),
            description: "Test transport".into(),
            transport: MCPTransportType::Http,
            command: None,
            args: vec![],
            env: HashMap::new(),
            url: Some("http://localhost:8080".into()),
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 5,
        };

        let transport = HttpTransport::new(config);
        assert_eq!(transport.transport_type(), MCPTransportType::Http);
        assert!(!transport.is_connected());
    }

    #[tokio::test]
    async fn test_websocket_transport_creation() {
        let config = MCPServiceConfig {
            id: "test".into(),
            name: "Test".into(),
            description: "Test transport".into(),
            transport: MCPTransportType::WebSocket,
            command: None,
            args: vec![],
            env: HashMap::new(),
            url: None,
            ws_url: Some("ws://localhost:8080".into()),
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 5,
        };

        let transport = WebSocketTransport::new(config);
        assert_eq!(transport.transport_type(), MCPTransportType::WebSocket);
        assert!(!transport.is_connected());
    }

    #[test]
    fn test_transport_factory() {
        let stdio_config = MCPServiceConfig {
            id: "test".into(),
            name: "Test".into(),
            description: "Test".into(),
            transport: MCPTransportType::Stdio,
            command: Some("echo".into()),
            args: vec![],
            env: HashMap::new(),
            url: None,
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 5,
        };

        let transport = TransportFactory::create(&stdio_config);
        assert_eq!(transport.transport_type(), MCPTransportType::Stdio);

        let http_config = MCPServiceConfig {
            id: "test".into(),
            name: "Test".into(),
            description: "Test".into(),
            transport: MCPTransportType::Http,
            command: None,
            args: vec![],
            env: HashMap::new(),
            url: Some("http://localhost:8080".into()),
            ws_url: None,
            auto_start: false,
            max_concurrent: 1,
            timeout_secs: 5,
        };

        let transport = TransportFactory::create(&http_config);
        assert_eq!(transport.transport_type(), MCPTransportType::Http);
    }
}
