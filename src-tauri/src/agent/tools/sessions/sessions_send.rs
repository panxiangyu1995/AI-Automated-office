//! Sessions send tool implementation.

use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::sessions_list::MockSessionStore;
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Parameters for sessions send
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsSendParams {
    /// Target session ID
    pub session_id: String,

    /// Message content to send
    pub message: String,

    /// Optional sender ID for A2A
    #[serde(default)]
    pub sender_id: Option<String>,

    /// Wait for response (default: false)
    #[serde(default)]
    pub wait_for_response: bool,

    /// Timeout in seconds
    #[serde(default)]
    pub timeout_seconds: Option<u64>,
}

/// Send result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsSendResponse {
    pub success: bool,
    pub message_id: String,
    pub delivered: bool,
    pub session_id: String,
    pub response: Option<String>,
    pub duration_ms: u64,
}

/// Sessions send executor
pub struct SessionsSendExecutor {
    store: Arc<MockSessionStore>,
}

impl SessionsSendExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockSessionStore::new()),
        }
    }
}

impl Default for SessionsSendExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for SessionsSendExecutor {
    async fn execute(
        &self,
        params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let send_params: SessionsSendParams = match serde_json::from_value(params) {
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
        if send_params.session_id.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "session_id cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate message
        if send_params.message.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "message cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Check if session exists
        let session = self.store.get(&send_params.session_id);
        if session.is_none() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::NotFound,
                message: format!("Session not found: {}", send_params.session_id),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        // Simulate sending message
        let message_id = format!("msg-{}", uuid::Uuid::new_v4());
        let delivered = true;

        // In real implementation, this would send to actual session
        let response = if send_params.wait_for_response {
            Some("Message received, processing...".to_string())
        } else {
            None
        };

        let send_response = SessionsSendResponse {
            success: true,
            message_id,
            delivered,
            session_id: send_params.session_id,
            response,
            duration_ms: start.elapsed().as_millis() as u64,
        };

        Ok(serde_json::to_value(send_response).map_err(|e| ToolExecutionError {
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
            session_id: "parent-session".to_string(),
            user_id: "test-user".to_string(),
            tenant_id: "test-tenant".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["sessions:write".to_string()],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_sessions_send_success() {
        let executor = SessionsSendExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": "Hello, how are you?"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsSendResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.success);
        assert!(response.delivered);
        assert!(!response.message_id.is_empty());
        assert_eq!(response.session_id, "session-1");
    }

    #[tokio::test]
    async fn test_sessions_send_with_response() {
        let executor = SessionsSendExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": "What is the status?",
            "wait_for_response": true
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsSendResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.success);
        assert!(response.response.is_some());
    }

    #[tokio::test]
    async fn test_sessions_send_empty_session_id() {
        let executor = SessionsSendExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "",
            "message": "Test message"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_send_empty_message() {
        let executor = SessionsSendExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": ""
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_send_session_not_found() {
        let executor = SessionsSendExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "non-existent-session",
            "message": "Test message"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_send_with_sender_id() {
        let executor = SessionsSendExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": "Message from agent",
            "sender_id": "agent-001"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsSendResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.success);
    }
}
