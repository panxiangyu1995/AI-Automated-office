//! Sessions history tool implementation.

use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::sessions_list::{MockSessionStore, SessionStatus};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

fn default_limit() -> usize {
    20
}

/// Parameters for sessions history
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsHistoryParams {
    /// Session ID to get history for
    pub session_id: String,

    /// Maximum number of messages to return
    #[serde(default = "default_limit")]
    pub limit: usize,

    /// Offset for pagination
    #[serde(default)]
    pub offset: Option<usize>,
}

/// Message in session history
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
    pub tool_calls: Option<Vec<ToolCall>>,
    pub tool_result: Option<Value>,
}

/// Tool call in message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: Value,
}

/// Sessions history response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsHistoryResponse {
    pub session_id: String,
    pub messages: Vec<SessionMessage>,
    pub total: usize,
    pub has_more: bool,
    pub duration_ms: u64,
}

/// Sessions history executor
pub struct SessionsHistoryExecutor {
    store: Arc<MockSessionStore>,
}

impl SessionsHistoryExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockSessionStore::new()),
        }
    }
}

impl Default for SessionsHistoryExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for SessionsHistoryExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let history_params: SessionsHistoryParams = match serde_json::from_value(params) {
            Ok(p) => p,
            Err(e) => {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: format!("Invalid parameters: {}", e),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        };

        // Validate session_id
        if history_params.session_id.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "session_id cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Check if session exists
        if self.store.get(&history_params.session_id).is_none() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::NotFound,
                message: format!("Session not found: {}", history_params.session_id),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        // Generate mock messages for demo
        let now = chrono::Utc::now().timestamp();
        let messages: Vec<SessionMessage> = vec![
            SessionMessage {
                id: "msg-1".to_string(),
                role: "user".to_string(),
                content: "Hello, can you help me with a task?".to_string(),
                timestamp: now - 300,
                tool_calls: None,
                tool_result: None,
            },
            SessionMessage {
                id: "msg-2".to_string(),
                role: "assistant".to_string(),
                content: "Of course! I'd be happy to help. What would you like to do?".to_string(),
                timestamp: now - 280,
                tool_calls: None,
                tool_result: None,
            },
            SessionMessage {
                id: "msg-3".to_string(),
                role: "user".to_string(),
                content: "Please search for information about Rust programming.".to_string(),
                timestamp: now - 200,
                tool_calls: None,
                tool_result: None,
            },
            SessionMessage {
                id: "msg-4".to_string(),
                role: "assistant".to_string(),
                content: "I'll search for that information for you.".to_string(),
                timestamp: now - 180,
                tool_calls: Some(vec![ToolCall {
                    id: "call-1".to_string(),
                    name: "web_search".to_string(),
                    arguments: serde_json::json!({
                        "query": "Rust programming language"
                    }),
                }]),
                tool_result: Some(serde_json::json!({
                    "results": ["Rust is a systems programming language..."]
                })),
            },
        ];

        let offset = history_params.offset.unwrap_or(0);
        let total = messages.len();
        let has_more = offset + history_params.limit < total;

        let response = SessionsHistoryResponse {
            session_id: history_params.session_id,
            messages,
            total,
            has_more,
            duration_ms: start.elapsed().as_millis() as u64,
        };

        Ok(serde_json::to_value(response).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::InternalError,
            message: format!("Failed to serialize response: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_context() -> ToolExecutionContext {
        ToolExecutionContext {
            session_id: "test-session".to_string(),
            user_id: "test-user".to_string(),
            tenant_id: "test-tenant".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["sessions:read".to_string()],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_sessions_history_success() {
        let executor = SessionsHistoryExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "limit": 10
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsHistoryResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.session_id, "session-1");
        assert!(!response.messages.is_empty());
        assert!(response.total > 0);
    }

    #[tokio::test]
    async fn test_sessions_history_with_offset() {
        let executor = SessionsHistoryExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "limit": 2,
            "offset": 0
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsHistoryResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.messages.len(), 2);
    }

    #[tokio::test]
    async fn test_sessions_history_empty_session_id() {
        let executor = SessionsHistoryExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "",
            "limit": 10
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_history_limit_validation() {
        let executor = SessionsHistoryExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "limit": 0
        });

        // Limit 0 should still work (returns empty or all available)
        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }
}
