//! Lifecycle Hook Types Module
//!
//! Defines the core types for the Agent Lifecycle Hook system.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Hook event types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HookEventType {
    /// Before a tool is executed
    PreToolCall,
    /// After a tool completes (success or failure)
    PostToolCall,
    /// When an error occurs
    Error,
    /// When a message is received
    MessageReceived,
    /// When agent execution starts
    SessionStart,
    /// When agent execution ends
    SessionEnd,
    /// When a task starts
    TaskStart,
    /// When a task completes
    TaskEnd,
}

impl HookEventType {
    /// Get all available event types
    pub fn all() -> Vec<Self> {
        vec![
            HookEventType::PreToolCall,
            HookEventType::PostToolCall,
            HookEventType::Error,
            HookEventType::MessageReceived,
            HookEventType::SessionStart,
            HookEventType::SessionEnd,
            HookEventType::TaskStart,
            HookEventType::TaskEnd,
        ]
    }

    /// Get the name of this event type
    pub fn name(&self) -> &'static str {
        match self {
            HookEventType::PreToolCall => "pre_tool_call",
            HookEventType::PostToolCall => "post_tool_call",
            HookEventType::Error => "error",
            HookEventType::MessageReceived => "message_received",
            HookEventType::SessionStart => "session_start",
            HookEventType::SessionEnd => "session_end",
            HookEventType::TaskStart => "task_start",
            HookEventType::TaskEnd => "task_end",
        }
    }
}

impl std::fmt::Display for HookEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name())
    }
}

/// Context passed to hooks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HookContext {
    /// Agent ID
    pub agent_id: String,
    /// Agent type
    pub agent_type: String,
    /// Session ID
    pub session_id: String,
    /// User ID
    pub user_id: String,
    /// Tenant ID
    pub tenant_id: String,
    /// Tool name (if applicable)
    pub tool_name: Option<String>,
    /// Tool input (if applicable)
    pub tool_input: Option<serde_json::Value>,
    /// Tool result (if applicable)
    pub tool_result: Option<serde_json::Value>,
    /// Error message (if applicable)
    pub error: Option<String>,
    /// Message content (if applicable)
    pub message_content: Option<String>,
    /// Timestamp
    pub timestamp: i64,
    /// Additional metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

impl HookContext {
    /// Create a new context
    pub fn new(
        agent_id: &str,
        agent_type: &str,
        session_id: &str,
        user_id: &str,
        tenant_id: &str,
    ) -> Self {
        Self {
            agent_id: agent_id.to_string(),
            agent_type: agent_type.to_string(),
            session_id: session_id.to_string(),
            user_id: user_id.to_string(),
            tenant_id: tenant_id.to_string(),
            tool_name: None,
            tool_input: None,
            tool_result: None,
            error: None,
            message_content: None,
            timestamp: chrono::Utc::now().timestamp(),
            metadata: HashMap::new(),
        }
    }

    /// Set tool information
    pub fn with_tool(mut self, name: &str, input: serde_json::Value) -> Self {
        self.tool_name = Some(name.to_string());
        self.tool_input = Some(input);
        self
    }

    /// Set tool result
    pub fn with_result(mut self, result: serde_json::Value) -> Self {
        self.tool_result = Some(result);
        self
    }

    /// Set error
    pub fn with_error(mut self, error: &str) -> Self {
        self.error = Some(error.to_string());
        self
    }

    /// Set message content
    pub fn with_message(mut self, content: &str) -> Self {
        self.message_content = Some(content.to_string());
        self
    }

    /// Add metadata
    pub fn with_metadata(mut self, key: &str, value: serde_json::Value) -> Self {
        self.metadata.insert(key.to_string(), value);
        self
    }
}

/// Hook configuration for filtering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HookConfig {
    /// Hook name
    pub name: String,
    /// Enabled flag
    pub enabled: bool,
    /// Priority (lower = higher priority)
    pub priority: i32,
    /// Tool name patterns to filter (empty = all)
    pub tool_patterns: Vec<String>,
    /// Agent types to filter (empty = all)
    pub agent_types: Vec<String>,
    /// Event types to respond to
    pub event_types: Vec<HookEventType>,
    /// Timeout for hook execution (milliseconds)
    pub timeout_ms: Option<u64>,
}

impl Default for HookConfig {
    fn default() -> Self {
        Self {
            name: String::new(),
            enabled: true,
            priority: 100,
            tool_patterns: Vec::new(),
            agent_types: Vec::new(),
            event_types: Vec::new(),
            timeout_ms: Some(5000),
        }
    }
}

impl HookConfig {
    /// Create a new config with a name
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            ..Default::default()
        }
    }

    /// Set event types
    pub fn with_events(mut self, events: Vec<HookEventType>) -> Self {
        self.event_types = events;
        self
    }

    /// Set priority
    pub fn with_priority(mut self, priority: i32) -> Self {
        self.priority = priority;
        self
    }

    /// Set tool patterns
    pub fn with_tool_patterns(mut self, patterns: Vec<String>) -> Self {
        self.tool_patterns = patterns;
        self
    }
}

/// Result of a hook execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HookResult {
    /// Whether the hook executed successfully
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
    /// Whether to continue with main execution
    pub continue_execution: bool,
    /// Modified context (if hook modified it)
    pub modified_context: Option<HookContext>,
    /// Custom data returned by hook
    pub data: Option<serde_json::Value>,
}

impl HookResult {
    /// Create a success result
    pub fn success() -> Self {
        Self {
            success: true,
            error: None,
            continue_execution: true,
            modified_context: None,
            data: None,
        }
    }

    /// Create an error result
    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            error: Some(message.to_string()),
            continue_execution: true,
            modified_context: None,
            data: None,
        }
    }

    /// Create a result that stops execution
    pub fn stop(message: &str) -> Self {
        Self {
            success: false,
            error: Some(message.to_string()),
            continue_execution: false,
            modified_context: None,
            data: None,
        }
    }

    /// Create a result with custom data
    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data);
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hook_context_creation() {
        let ctx = HookContext::new("agent1", "general-purpose", "session1", "user1", "tenant1");
        assert_eq!(ctx.agent_id, "agent1");
        assert_eq!(ctx.agent_type, "general-purpose");
    }

    #[test]
    fn test_hook_result() {
        let result = HookResult::success();
        assert!(result.success);
        assert!(result.continue_execution);

        let error_result = HookResult::error("Something went wrong");
        assert!(!error_result.success);
        assert!(error_result.continue_execution);

        let stop_result = HookResult::stop("Critical error");
        assert!(!stop_result.success);
        assert!(!stop_result.continue_execution);
    }
}
