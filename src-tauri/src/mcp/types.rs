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

/// Tool approval policy
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ApprovalPolicy {
    /// Automatically approve tool calls without confirmation
    AutoApprove,
    /// Require manual user confirmation before execution
    Manual,
    /// Deny all calls to this tool
    Denied,
}

impl Default for ApprovalPolicy {
    fn default() -> Self {
        ApprovalPolicy::Manual
    }
}

/// Per-tool approval configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerToolApprovalConfig {
    /// Unique identifier for this config
    pub id: String,
    /// Service ID this config applies to
    pub service_id: String,
    /// Tool name or pattern (supports regex)
    pub tool_pattern: String,
    /// Whether this is a regex pattern
    pub is_regex: bool,
    /// The approval policy for matching tools
    pub policy: ApprovalPolicy,
    /// Optional description explaining why this policy is set
    pub description: Option<String>,
    /// Whether this config is enabled
    pub enabled: bool,
    /// Created timestamp
    pub created_at: String,
    /// Updated timestamp
    pub updated_at: String,
    /// Created by user
    pub created_by: String,
}

impl PerToolApprovalConfig {
    /// Check if a tool name matches this configuration's pattern
    pub fn matches(&self, tool_name: &str) -> bool {
        if !self.enabled {
            return false;
        }

        if self.is_regex {
            // Use regex matching
            if let Ok(re) = regex::Regex::new(&self.tool_pattern) {
                re.is_match(tool_name)
            } else {
                // Invalid regex, fall back to exact match
                self.tool_pattern == tool_name
            }
        } else {
            // Exact match or wildcard
            self.tool_pattern == "*" || self.tool_pattern == tool_name
        }
    }
}

/// Result of checking auto-approve
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoApproveResult {
    /// Whether the tool call should be auto-approved
    pub approved: bool,
    /// The policy that was applied
    pub policy: ApprovalPolicy,
    /// Config ID that matched (if any)
    pub matched_config_id: Option<String>,
    /// Reason for the decision
    pub reason: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exact_match() {
        let config = PerToolApprovalConfig {
            id: "test-1".to_string(),
            service_id: "svc-1".to_string(),
            tool_pattern: "fs.read".to_string(),
            is_regex: false,
            policy: ApprovalPolicy::AutoApprove,
            description: None,
            enabled: true,
            created_at: "2026-04-09T00:00:00Z".to_string(),
            updated_at: "2026-04-09T00:00:00Z".to_string(),
            created_by: "admin".to_string(),
        };

        assert!(config.matches("fs.read"));
        assert!(!config.matches("fs.write"));
    }

    #[test]
    fn test_wildcard_match() {
        let config = PerToolApprovalConfig {
            id: "test-2".to_string(),
            service_id: "svc-1".to_string(),
            tool_pattern: "*".to_string(),
            is_regex: false,
            policy: ApprovalPolicy::Manual,
            description: None,
            enabled: true,
            created_at: "2026-04-09T00:00:00Z".to_string(),
            updated_at: "2026-04-09T00:00:00Z".to_string(),
            created_by: "admin".to_string(),
        };

        assert!(config.matches("fs.read"));
        assert!(config.matches("fs.write"));
        assert!(config.matches("anything"));
    }

    #[test]
    fn test_regex_match() {
        let config = PerToolApprovalConfig {
            id: "test-3".to_string(),
            service_id: "svc-1".to_string(),
            tool_pattern: r"fs\..*".to_string(),
            is_regex: true,
            policy: ApprovalPolicy::AutoApprove,
            description: None,
            enabled: true,
            created_at: "2026-04-09T00:00:00Z".to_string(),
            updated_at: "2026-04-09T00:00:00Z".to_string(),
            created_by: "admin".to_string(),
        };

        assert!(config.matches("fs.read"));
        assert!(config.matches("fs.write"));
        assert!(!config.matches("db.query"));
    }

    #[test]
    fn test_disabled_config() {
        let config = PerToolApprovalConfig {
            id: "test-4".to_string(),
            service_id: "svc-1".to_string(),
            tool_pattern: "*".to_string(),
            is_regex: false,
            policy: ApprovalPolicy::AutoApprove,
            description: None,
            enabled: false,
            created_at: "2026-04-09T00:00:00Z".to_string(),
            updated_at: "2026-04-09T00:00:00Z".to_string(),
            created_by: "admin".to_string(),
        };

        assert!(!config.matches("fs.read"));
    }
}