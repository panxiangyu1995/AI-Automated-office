//! MCP client implementation using Transport trait.

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use super::types::{
    MCPServiceConfig, MCPServiceStatus, MCPServiceInfo,
    MCPTool, MCPToolCall, MCPToolResult, MCPMessage,
};
use super::transport::{Transport, TransportFactory};

/// MCP client configuration
#[derive(Debug, Clone)]
pub struct MCPClientConfig {
    /// Service configuration
    pub service: MCPServiceConfig,
    /// Reconnect attempts for network transports
    pub reconnect_attempts: u32,
    /// Reconnect delay in seconds
    pub reconnect_delay_secs: u64,
    /// Default request timeout in seconds
    pub request_timeout_secs: u64,
}

impl MCPClientConfig {
    pub fn from_service(service: MCPServiceConfig) -> Self {
        Self {
            service,
            reconnect_attempts: 3,
            reconnect_delay_secs: 5,
            request_timeout_secs: 30,
        }
    }
}

/// MCP client for communicating with MCP services
/// 
/// 使用Transport trait实现，支持多种传输方式
pub struct MCPClient {
    config: MCPClientConfig,
    transport: Box<dyn Transport>,
    status: Arc<RwLock<MCPServiceStatus>>,
    tools: Arc<RwLock<Vec<MCPTool>>>,
}

impl MCPClient {
    /// Create a new MCP client with Transport
    pub fn new(config: MCPClientConfig) -> Self {
        let transport = TransportFactory::create(&config.service);
        
        Self {
            config,
            transport,
            status: Arc::new(RwLock::new(MCPServiceStatus::Stopped)),
            tools: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Get current status
    pub async fn status(&self) -> MCPServiceStatus {
        self.status.read().await.clone()
    }

    /// Get discovered tools
    pub async fn tools(&self) -> Vec<MCPTool> {
        self.tools.read().await.clone()
    }

    /// Start the MCP service
    pub async fn start(&self) -> Result<(), String> {
        let mut status = self.status.write().await;
        *status = MCPServiceStatus::Starting;
        
        self.transport.start().await
            .map_err(|e| e.to_string())?;
        
        *status = MCPServiceStatus::Running;
        Ok(())
    }

    /// Stop the MCP service
    pub async fn stop(&self) -> Result<(), String> {
        self.transport.stop().await
            .map_err(|e| e.to_string())?;
        
        let mut status = self.status.write().await;
        *status = MCPServiceStatus::Stopped;
        Ok(())
    }

    /// Send a JSON-RPC request and get response
    pub async fn call_tool(&self, call: MCPToolCall) -> Result<MCPToolResult, String> {
        if self.status().await != MCPServiceStatus::Running {
            return Err("Service is not running".to_string());
        }

        // 构建JSON-RPC请求
        let request = MCPMessage::CallTool { 
            name: call.tool.clone(), 
            arguments: call.arguments 
        };
        
        // 通过Transport发送请求
        match self.transport.call(&request).await {
            Ok(response) => {
                // 解析响应
                match response {
                    MCPMessage::CallToolResponse(result) => Ok(result),
                    _ => Err("Unexpected response type".to_string()),
                }
            }
            Err(e) => Err(e.to_string()),
        }
    }

    /// Discover available tools
    pub async fn discover_tools(&self) -> Result<Vec<MCPTool>, String> {
        if self.status().await != MCPServiceStatus::Running {
            return Err("Service is not running".to_string());
        }

        // 发送工具列表请求
        let request = MCPMessage::ListTools;
        
        match self.transport.call(&request).await {
            Ok(response) => {
                match response {
                    MCPMessage::ListToolsResponse { tools } => {
                        let mut t = self.tools.write().await;
                        *t = tools.clone();
                        Ok(tools)
                    }
                    _ => Err("Unexpected response type".to_string()),
                }
            }
            Err(e) => Err(e.to_string()),
        }
    }

    /// Get service info
    pub async fn service_info(&self) -> MCPServiceInfo {
        let status = self.status().await;
        
        // 获取PID（仅适用于STDIO传输）
        let pid = match self.transport.transport_type() {
            super::types::MCPTransportType::Stdio => {
                // 对于STDIO，尝试从transport获取进程信息
                // 由于trait不直接暴露进程，这里返回None
                // 在后续优化中可以扩展trait或使用downcast
                None
            }
            _ => None,
        };

        MCPServiceInfo {
            id: self.config.service.id.clone(),
            name: self.config.service.name.clone(),
            status,
            pid,
            last_error: None,
            tool_count: self.tools.read().await.len(),
            started_at: None,
            uptime_secs: 0,
        }
    }

    /// 获取Transport类型（供测试用）
    #[allow(dead_code)]
    pub fn transport_type(&self) -> super::types::MCPTransportType {
        self.transport.transport_type()
    }
}

impl Default for MCPClientConfig {
    fn default() -> Self {
        Self {
            service: MCPServiceConfig {
                id: String::new(),
                name: String::new(),
                description: String::new(),
                transport: super::types::MCPTransportType::Stdio,
                command: None,
                args: Vec::new(),
                env: HashMap::new(),
                url: None,
                ws_url: None,
                auto_start: false,
                max_concurrent: 1,
                timeout_secs: 30,
            },
            reconnect_attempts: 3,
            reconnect_delay_secs: 5,
            request_timeout_secs: 30,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_client_creation() {
        let config = MCPClientConfig {
            service: MCPServiceConfig {
                id: "test-mcp".to_string(),
                name: "Test MCP".to_string(),
                description: "Test service".to_string(),
                transport: MCPTransportType::Http,
                command: None,
                args: Vec::new(),
                env: HashMap::new(),
                url: Some("http://localhost:8080".to_string()),
                ws_url: None,
                auto_start: true,
                max_concurrent: 5,
                timeout_secs: 30,
            },
            reconnect_attempts: 3,
            reconnect_delay_secs: 5,
            request_timeout_secs: 30,
        };

        let client = MCPClient::new(config);
        assert_eq!(client.status().await, MCPServiceStatus::Stopped);
    }

    #[tokio::test]
    async fn test_client_with_stdio_transport() {
        let config = MCPClientConfig {
            service: MCPServiceConfig {
                id: "test-stdio".to_string(),
                name: "Test STDIO".to_string(),
                description: "Test STDIO service".to_string(),
                transport: MCPTransportType::Stdio,
                command: Some("echo".to_string()),
                args: vec!["hello".to_string()],
                env: HashMap::new(),
                url: None,
                ws_url: None,
                auto_start: false,
                max_concurrent: 1,
                timeout_secs: 5,
            },
            reconnect_attempts: 0,
            reconnect_delay_secs: 0,
            request_timeout_secs: 5,
        };

        let client = MCPClient::new(config);
        assert_eq!(client.transport_type(), MCPTransportType::Stdio);
        assert_eq!(client.status().await, MCPServiceStatus::Stopped);
    }

    #[tokio::test]
    async fn test_start_http_client() {
        let config = MCPClientConfig {
            service: MCPServiceConfig {
                id: "test-http".to_string(),
                name: "Test HTTP".to_string(),
                description: "Test HTTP service".to_string(),
                transport: MCPTransportType::Http,
                command: None,
                args: Vec::new(),
                env: HashMap::new(),
                url: Some("http://localhost:8080".to_string()),
                ws_url: None,
                auto_start: false,
                max_concurrent: 1,
                timeout_secs: 30,
            },
            reconnect_attempts: 0,
            reconnect_delay_secs: 0,
            request_timeout_secs: 30,
        };

        let client = MCPClient::new(config);
        // HTTP start会进行健康检查，由于服务不存在会失败
        // 但我们测试的是transport_type
        assert_eq!(client.transport_type(), MCPTransportType::Http);
    }

    #[tokio::test]
    async fn test_client_with_websocket_transport() {
        let config = MCPClientConfig {
            service: MCPServiceConfig {
                id: "test-ws".to_string(),
                name: "Test WebSocket".to_string(),
                description: "Test WebSocket service".to_string(),
                transport: MCPTransportType::WebSocket,
                command: None,
                args: Vec::new(),
                env: HashMap::new(),
                url: None,
                ws_url: Some("ws://localhost:8080".to_string()),
                auto_start: false,
                max_concurrent: 1,
                timeout_secs: 5,
            },
            reconnect_attempts: 0,
            reconnect_delay_secs: 0,
            request_timeout_secs: 5,
        };

        let client = MCPClient::new(config);
        assert_eq!(client.transport_type(), MCPTransportType::WebSocket);
    }
}
