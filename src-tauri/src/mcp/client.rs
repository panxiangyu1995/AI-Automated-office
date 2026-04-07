//! MCP client implementation for various transport types.

use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;

use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::{mpsc, RwLock};
use tokio::time::{timeout, Duration};

use super::types::{
    MCPTransportType, MCPServiceConfig, MCPServiceStatus, MCPServiceInfo,
    MCPTool, MCPToolCall, MCPToolResult, MCPMessage,
};

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
pub struct MCPClient {
    config: MCPClientConfig,
    status: Arc<RwLock<MCPServiceStatus>>,
    process: Arc<RwLock<Option<Child>>>,
    tools: Arc<RwLock<Vec<MCPTool>>>,
}

impl MCPClient {
    /// Create a new MCP client
    pub fn new(config: MCPClientConfig) -> Self {
        Self {
            config,
            status: Arc::new(RwLock::new(MCPServiceStatus::Stopped)),
            process: Arc::new(RwLock::new(None)),
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

        match self.config.service.transport {
            MCPTransportType::Stdio => self.start_stdio().await,
            MCPTransportType::Http => self.start_http().await,
            MCPTransportType::WebSocket => self.start_websocket().await,
        }
    }

    /// Start STDIO transport
    async fn start_stdio(&self) -> Result<(), String> {
        let command = self.config.service.command.as_ref()
            .ok_or("STDIO transport requires command")?;

        let mut cmd = Command::new(command);
        cmd.args(&self.config.service.args);
        cmd.envs(&self.config.service.env);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        match cmd.spawn() {
            Ok(child) => {
                let mut p = self.process.write().await;
                *p = Some(child);
                let mut status = self.status.write().await;
                *status = MCPServiceStatus::Running;
                Ok(())
            }
            Err(e) => {
                let mut status = self.status.write().await;
                *status = MCPServiceStatus::Error;
                Err(format!("Failed to start process: {}", e))
            }
        }
    }

    /// Start HTTP transport (mock implementation)
    async fn start_http(&self) -> Result<(), String> {
        let _url = self.config.service.url.as_ref()
            .ok_or("HTTP transport requires URL")?;
        
        let mut status = self.status.write().await;
        *status = MCPServiceStatus::Running;
        Ok(())
    }

    /// Start WebSocket transport (mock implementation)
    async fn start_websocket(&self) -> Result<(), String> {
        let _ws_url = self.config.service.ws_url.as_ref()
            .ok_or("WebSocket transport requires URL")?;
        
        let mut status = self.status.write().await;
        *status = MCPServiceStatus::Running;
        Ok(())
    }

    /// Stop the MCP service
    pub async fn stop(&self) -> Result<(), String> {
        let mut status = self.status.write().await;
        
        if let MCPTransportType::Stdio = self.config.service.transport {
            let mut process = self.process.write().await;
            if let Some(mut child) = process.take() {
                let _ = child.kill().await;
            }
        }

        *status = MCPServiceStatus::Stopped;
        Ok(())
    }

    /// Send a JSON-RPC request and get response
    pub async fn call_tool(&self, call: MCPToolCall) -> Result<MCPToolResult, String> {
        if self.status().await != MCPServiceStatus::Running {
            return Err("Service is not running".to_string());
        }

        let timeout_duration = Duration::from_secs(self.config.request_timeout_secs);
        
        match self.config.service.transport {
            MCPTransportType::Stdio => {
                self.call_tool_stdio(call, timeout_duration).await
            }
            MCPTransportType::Http => {
                self.call_tool_http(call).await
            }
            MCPTransportType::WebSocket => {
                self.call_tool_websocket(call).await
            }
        }
    }

    /// Call tool via STDIO
    async fn call_tool_stdio(&self, call: MCPToolCall, timeout_duration: Duration) -> Result<MCPToolResult, String> {
        // Mock implementation - in production, this would send JSON-RPC over stdin
        // and read response from stdout
        
        let result = MCPToolResult {
            success: true,
            content: Some(serde_json::json!({
                "tool": call.tool,
                "result": "Mock result",
                "args": call.arguments
            })),
            error: None,
            is_error: false,
        };

        Ok(result)
    }

    /// Call tool via HTTP
    async fn call_tool_http(&self, call: MCPToolCall) -> Result<MCPToolResult, String> {
        let url = self.config.service.url.as_ref()
            .ok_or("HTTP transport requires URL")?;

        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/tools/{}", url, call.tool))
            .json(&call.arguments)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let result: MCPToolResult = response
            .json()
            .await
            .map_err(|e| e.to_string())?;

        Ok(result)
    }

    /// Call tool via WebSocket
    async fn call_tool_websocket(&self, call: MCPToolCall) -> Result<MCPToolResult, String> {
        // Mock implementation
        let result = MCPToolResult {
            success: true,
            content: Some(serde_json::json!({
                "tool": call.tool,
                "result": "Mock result via WebSocket"
            })),
            error: None,
            is_error: false,
        };

        Ok(result)
    }

    /// Discover available tools
    pub async fn discover_tools(&self) -> Result<Vec<MCPTool>, String> {
        if self.status().await != MCPServiceStatus::Running {
            return Err("Service is not running".to_string());
        }

        // Mock tool discovery - in production, this would send JSON-RPC
        let tools = vec![
            MCPTool {
                name: "filesystem_read".to_string(),
                description: "Read file contents".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" }
                    }
                }),
                experimental: false,
            },
            MCPTool {
                name: "filesystem_write".to_string(),
                description: "Write file contents".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" },
                        "content": { "type": "string" }
                    }
                }),
                experimental: false,
            },
        ];

        let mut t = self.tools.write().await;
        *t = tools.clone();

        Ok(tools)
    }

    /// Get service info
    pub async fn service_info(&self) -> MCPServiceInfo {
        let status = self.status().await;
        let pid = if let MCPTransportType::Stdio = self.config.service.transport {
            let process = self.process.read().await;
            process.as_ref().and_then(|p| p.id())
        } else {
            None
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
}

impl Default for MCPClientConfig {
    fn default() -> Self {
        Self {
            service: MCPServiceConfig {
                id: String::new(),
                name: String::new(),
                description: String::new(),
                transport: MCPTransportType::Stdio,
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
        client.start().await.unwrap();
        assert_eq!(client.status().await, MCPServiceStatus::Running);
    }
}