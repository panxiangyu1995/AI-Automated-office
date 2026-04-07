# Design: MCP服务集成

## 技术架构

### 1. MCP 协议概述

MCP (Model Context Protocol) 是一种标准化协议，用于：
- 工具发现和调用
- 资源访问
- 提示模板

### 2. 组件结构

```
MCP Server (Remote/Local)
         ↓ JSON-RPC
MCP Client
         ↓
MCP Handler (请求处理)
         ↓
MCP Bridge (工具转换)
         ↓
System Tool Registry
         ↓
Agent Runtime
```

### 3. MCP 客户端

```rust
pub struct McpClient {
    endpoint: Endpoint,
    transport: Box<dyn McpTransport>,
    capabilities: McpCapabilities,
}

impl McpClient {
    pub async fn connect(endpoint: &str) -> Result<Self, McpError> {
        // 1. 建立连接
        let transport = TcpTransport::connect(endpoint).await?;
        
        // 2. 握手
        let capabilities = self.handshake().await?;
        
        Ok(Self { transport, capabilities })
    }
    
    pub async fn list_tools(&self) -> Result<Vec<McpTool>, McpError> {
        // JSON-RPC: tools/list
        self.send_request("tools/list", json!({})).await
    }
    
    pub async fn call_tool(
        &self,
        tool_name: &str,
        arguments: Value,
    ) -> Result<Value, McpError> {
        // JSON-RPC: tools/call
        self.send_request("tools/call", json!({
            "name": tool_name,
            "arguments": arguments
        })).await
    }
}
```

### 4. MCP 工具桥接

```rust
pub struct McpToolBridge {
    client: Arc<McpClient>,
    tool_registry: Arc<ToolRegistry>,
}

impl McpToolBridge {
    pub async fn register_mcp_tools(&self) -> Result<(), McpError> {
        let tools = self.client.list_tools().await?;
        
        for mcp_tool in tools {
            let descriptor = self.convert_to_descriptor(&mcp_tool);
            self.tool_registry.register(descriptor).await?;
        }
        
        Ok(())
    }
    
    fn convert_to_descriptor(&self, mcp_tool: &McpTool) -> ToolDescriptor {
        ToolDescriptor {
            name: format!("mcp_{}", mcp_tool.name),
            description: mcp_tool.description.clone(),
            input_schema: mcp_tool.input_schema.clone(),
            handler: Arc::new(McpToolHandler {
                client: Arc::clone(&self.client),
                tool_name: mcp_tool.name.clone(),
            }),
        }
    }
}
```

### 5. MCP 配置存储

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    pub id: String,
    pub name: String,
    pub endpoint: String,
    pub auth_token: Option<String>,
    pub enabled: bool,
    pub health_check_interval_secs: u64,
}

pub struct McpConfigStore {
    config_path: PathBuf,
}

impl McpConfigStore {
    pub async fn load_configs(&self) -> Result<Vec<McpServerConfig>, McpError> {
        let path = self.config_path.join("mcp_servers.json");
        if !path.exists() {
            return Ok(Vec::new());
        }
        let content = tokio::fs::read_to_string(&path).await?;
        serde_json::from_str(&content).map_err(|e| McpError::Config(e.to_string()))
    }
    
    pub async fn save_configs(&self, configs: &[McpServerConfig]) -> Result<(), McpError> {
        let content = serde_json::to_string_pretty(configs)?;
        tokio::fs::write(&self.config_path, content).await?;
        Ok(())
    }
}
```

## API 设计

### Tauri 命令

```rust
#[tauri::command]
pub async fn mcp_list_servers() -> Result<Vec<McpServerConfig>, String>;

#[tauri::command]
pub async fn mcp_add_server(config: McpServerConfig) -> Result<(), String>;

#[tauri::command]
pub async fn mcp_remove_server(server_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn mcp_connect_server(server_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn mcp_disconnect_server(server_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn mcp_health_check(server_id: String) -> Result<HealthStatus, String>;

#[tauri::command]
pub async fn mcp_list_tools(server_id: String) -> Result<Vec<ToolDescriptor>, String>;

#[tauri::command]
pub async fn mcp_call_tool(
    server_id: String,
    tool_name: String,
    arguments: Value,
) -> Result<Value, String>;
```

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| MCP_001 | 连接失败 | 提示检查网络和地址 |
| MCP_002 | 认证失败 | 提示检查 token |
| MCP_003 | 服务不可用 | 健康检查失败提示 |
| MCP_004 | 工具调用超时 | 返回超时错误 |
| MCP_005 | 工具不存在 | 返回错误提示 |
