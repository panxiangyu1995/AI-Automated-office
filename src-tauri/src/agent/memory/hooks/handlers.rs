//! Built-in hook handlers for memory events.

use async_trait::async_trait;

use super::registry::HookHandler;
use super::super::types::{HookEvent, MemoryItem, MemoryLayer, MemoryCategory, MemorySource};
use super::super::config::MemoryError;

/// Handler for SessionStart events
pub struct SessionStartHandler {
    session_memory_limit: usize,
}

impl SessionStartHandler {
    pub fn new(session_memory_limit: usize) -> Self {
        Self { session_memory_limit }
    }
}

#[async_trait]
impl HookHandler for SessionStartHandler {
    async fn handle(&self, event: &HookEvent) -> Result<Vec<MemoryItem>, MemoryError> {
        match event {
            HookEvent::SessionStart { session_key, user_id } => {
                let item = MemoryItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    layer: MemoryLayer::Personal,
                    tenant_id: "default".to_string(),
                    user_id: Some(user_id.clone()),
                    session_key: Some(session_key.clone()),
                    key: format!("session/{}", session_key),
                    value: format!("Session started at {}", chrono::Utc::now()),
                    category: MemoryCategory::Context,
                    confidence: 1.0,
                    source: MemorySource::SystemImport,
                    metadata: serde_json::json!({
                        "event_type": "session_start",
                        "session_key": session_key,
                    }),
                    ..Default::default()
                };
                Ok(vec![item])
            }
            _ => Ok(Vec::new()),
        }
    }

    fn name(&self) -> &str {
        "session_start_handler"
    }

    fn priority(&self) -> u8 {
        100
    }
}

/// Handler for UserPromptSubmit events
pub struct UserPromptHandler {
    min_prompt_length: usize,
}

impl UserPromptHandler {
    pub fn new(min_prompt_length: usize) -> Self {
        Self { min_prompt_length }
    }
}

#[async_trait]
impl HookHandler for UserPromptHandler {
    async fn handle(&self, event: &HookEvent) -> Result<Vec<MemoryItem>, MemoryError> {
        match event {
            HookEvent::UserPromptSubmit { session_key, prompt } => {
                if prompt.len() < self.min_prompt_length {
                    return Ok(Vec::new());
                }

                // Extract potential facts and preferences from the prompt
                let mut items = Vec::new();

                // Create a memory item for the prompt
                let item = MemoryItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    layer: MemoryLayer::Personal,
                    tenant_id: "default".to_string(),
                    user_id: None,
                    session_key: Some(session_key.clone()),
                    key: format!("prompt/{}", chrono::Utc::now().timestamp()),
                    value: prompt.clone(),
                    category: MemoryCategory::Context,
                    confidence: 0.8,
                    source: MemorySource::UserInput,
                    metadata: serde_json::json!({
                        "event_type": "user_prompt",
                        "session_key": session_key,
                        "length": prompt.len(),
                    }),
                    ..Default::default()
                };
                items.push(item);

                Ok(items)
            }
            _ => Ok(Vec::new()),
        }
    }

    fn name(&self) -> &str {
        "user_prompt_handler"
    }

    fn priority(&self) -> u8 {
        90
    }
}

/// Handler for PostToolUse events
pub struct ToolResultHandler {
    capture_tool_results: bool,
}

impl ToolResultHandler {
    pub fn new(capture_tool_results: bool) -> Self {
        Self { capture_tool_results }
    }
}

#[async_trait]
impl HookHandler for ToolResultHandler {
    async fn handle(&self, event: &HookEvent) -> Result<Vec<MemoryItem>, MemoryError> {
        match event {
            HookEvent::PostToolUse { session_key, tool_name, result } => {
                if !self.capture_tool_results {
                    return Ok(Vec::new());
                }

                let item = MemoryItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    layer: MemoryLayer::Personal,
                    tenant_id: "default".to_string(),
                    user_id: None,
                    session_key: Some(session_key.clone()),
                    key: format!("tool_result/{}", tool_name),
                    value: result.clone(),
                    category: MemoryCategory::Observation,
                    confidence: 0.9,
                    source: MemorySource::ToolResult,
                    metadata: serde_json::json!({
                        "event_type": "tool_result",
                        "tool_name": tool_name,
                        "session_key": session_key,
                    }),
                    ..Default::default()
                };
                Ok(vec![item])
            }
            _ => Ok(Vec::new()),
        }
    }

    fn name(&self) -> &str {
        "tool_result_handler"
    }

    fn priority(&self) -> u8 {
        80
    }
}

/// Handler for SessionEnd events
pub struct SessionEndHandler;

impl SessionEndHandler {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl HookHandler for SessionEndHandler {
    async fn handle(&self, event: &HookEvent) -> Result<Vec<MemoryItem>, MemoryError> {
        match event {
            HookEvent::SessionEnd { session_key } => {
                let item = MemoryItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    layer: MemoryLayer::Personal,
                    tenant_id: "default".to_string(),
                    user_id: None,
                    session_key: Some(session_key.clone()),
                    key: format!("session/{}/ended", session_key),
                    value: format!("Session ended at {}", chrono::Utc::now()),
                    category: MemoryCategory::Context,
                    confidence: 1.0,
                    source: MemorySource::SystemImport,
                    metadata: serde_json::json!({
                        "event_type": "session_end",
                        "session_key": session_key,
                    }),
                    ..Default::default()
                };
                Ok(vec![item])
            }
            HookEvent::Stop { session_key, reason } => {
                let item = MemoryItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    layer: MemoryLayer::Personal,
                    tenant_id: "default".to_string(),
                    user_id: None,
                    session_key: Some(session_key.clone()),
                    key: format!("session/{}/stopped", session_key),
                    value: format!("Session stopped: {}", reason),
                    category: MemoryCategory::Context,
                    confidence: 1.0,
                    source: MemorySource::SystemImport,
                    metadata: serde_json::json!({
                        "event_type": "session_stop",
                        "session_key": session_key,
                        "reason": reason,
                    }),
                    ..Default::default()
                };
                Ok(vec![item])
            }
            _ => Ok(Vec::new()),
        }
    }

    fn name(&self) -> &str {
        "session_end_handler"
    }

    fn priority(&self) -> u8 {
        50
    }
}

impl Default for SessionEndHandler {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_session_start_handler() {
        let handler = SessionStartHandler::new(100);

        let event = HookEvent::SessionStart {
            session_key: "session-123".to_string(),
            user_id: "user-456".to_string(),
        };

        let items = handler.handle(&event).await.unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].key, "session/session-123");
        assert_eq!(items[0].category, MemoryCategory::Context);
    }

    #[tokio::test]
    async fn test_user_prompt_handler_skips_short() {
        let handler = UserPromptHandler::new(100);

        let event = HookEvent::UserPromptSubmit {
            session_key: "session-123".to_string(),
            prompt: "Hi".to_string(), // Too short
        };

        let items = handler.handle(&event).await.unwrap();
        assert_eq!(items.len(), 0);
    }

    #[tokio::test]
    async fn test_tool_result_handler() {
        let handler = ToolResultHandler::new(true);

        let event = HookEvent::PostToolUse {
            session_key: "session-123".to_string(),
            tool_name: "filesystem_read".to_string(),
            result: "File content here".to_string(),
        };

        let items = handler.handle(&event).await.unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].source, MemorySource::ToolResult);
    }
}
