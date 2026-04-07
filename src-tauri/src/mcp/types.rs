//! MCP types and data structures.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// MCP transport type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum MCPTransportType {
    /// Standard input/output (local process)
    Stdio,
    /// HTTP/REST API
    Http,
    /// WebSocket connection
    WebSocket,
}

/// MCP service configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPServiceConfig {
    /// Unique service identifier
    pub id: String,
    /// Service name
    pub name: String,
    /// Service description
    pub description: String,
    /// Transport type
    pub transport: MCPTransportType,
    /// Command for STDIO transport
    pub command: Option<String>,
    /// Arguments for the command
    pub args: Vec<String>,
    /// Environment variables
    pub env: HashMap<String, String>,
    /// HTTP URL for HTTP transport
    pub url: Option<String>,
    /// WebSocket URL for WebSocket transport
    pub ws_url: Option<String>,
    /// Auto-start on application launch
    pub auto_start: bool,
    /// Maximum concurrent tool calls
    pub max_concurrent: usize,
    /// Request timeout in seconds
    pub timeout_secs: u64,
}

/// MCP service runtime status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum MCPServiceStatus {
    /// Service is running and healthy
    Running,
    /// Service is stopped
    Stopped,
    /// Service encountered an error
    Error,
    /// Service is starting up
    Starting,
    /// Service is being restarted
    Restarting,
}

/// MCP service information (runtime state)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPServiceInfo {
    /// Service ID
    pub id: String,
    /// Service name
    pub name: String,
    /// Current status
    pub status: MCPServiceStatus,
    /// Process ID (for STDIO transport)
    pub pid: Option<u32>,
    /// Last error message
    pub last_error: Option<String>,
    /// Number of tools available
    pub tool_count: usize,
    /// Start timestamp
    pub started_at: Option<String>,
    /// Uptime in seconds
    pub uptime_secs: u64,
}

/// MCP tool definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPTool {
    /// Tool name
    pub name: String,
    /// Tool description
    pub description: String,
    /// Input schema
    pub input_schema: serde_json::Value,
    /// Whether tool is experimental
    pub experimental: bool,
}

/// MCP tool call request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPToolCall {
    /// Tool name to call
    pub tool: String,
    /// Tool arguments
    pub arguments: HashMap<String, serde_json::Value>,
}

/// MCP tool call result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPToolResult {
    /// Whether the call was successful
    pub success: bool,
    /// Result content (typically JSON)
    pub content: Option<serde_json::Value>,
    /// Error message if failed
    pub error: Option<String>,
    /// Whether the tool wants to send additional messages
    pub is_error: bool,
}

/// MCP protocol message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MCPMessage {
    /// Initialize request
    Initialize { version: String, capabilities: serde_json::Value },
    /// Initialize response
    InitializeResponse { version: String, capabilities: serde_json::Value },
    /// Tool list request
    ListTools,
    /// Tool list response
    ListToolsResponse { tools: Vec<MCPTool> },
    /// Tool call request
    CallTool { name: String, arguments: HashMap<String, serde_json::Value> },
    /// Tool call response
    CallToolResponse(MCPToolResult),
    /// Resource list request
    ListResources,
    /// Resource list response
    ListResourcesResponse { resources: Vec<MCPResource> },
    /// Resource read request
    ReadResource { uri: String },
    /// Resource read response
    ReadResourceResponse { contents: Vec<MCPResourceContent> },
    /// Notification
    Notification { method: String, params: serde_json::Value },
}

/// MCP resource definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPResource {
    /// Resource URI
    pub uri: String,
    /// Resource name
    pub name: String,
    /// Resource description
    pub description: Option<String>,
    /// MIME type
    pub mime_type: Option<String>,
}

/// MCP resource content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPResourceContent {
    /// Content type
    pub mime_type: String,
    /// Content data (text or base64)
    pub data: String,
}

impl Default for MCPServiceStatus {
    fn default() -> Self {
        MCPServiceStatus::Stopped
    }
}

impl MCPServiceStatus {
    pub fn is_running(&self) -> bool {
        matches!(self, MCPServiceStatus::Running)
    }
}