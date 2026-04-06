//! Sessions yield tool implementation.

use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::sessions_list::MockSessionStore;
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Parameters for sessions yield
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsYieldParams {
    /// Target session ID to yield to
    pub session_id: String,

    /// Message to pass to the target session
    pub message: String,

    /// Wait for result from the yielded session
    #[serde(default)]
    pub wait_for_result: bool,

    /// Timeout in seconds
    #[serde(default)]
    pub timeout_seconds: Option<i64>,

    /// Optional priority hint
    #[serde(default)]
    pub priority: Option<i32>,
}

/// Yield result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsYieldResponse {
    pub success: bool,
    pub yield_id: String,
    pub target_session_id: String,
    pub message_delivered: bool,
    pub result: Option<YieldResult>,
    pub waited_seconds: Option<f64>,
    pub duration_ms: u64,
}

/// Yield result from target session
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YieldResult {
    pub session_id: String,
    pub message_id: String,
    pub content: String,
    pub timestamp: i64,
}

/// Sessions yield executor
pub struct SessionsYieldExecutor {
    store: Arc<MockSessionStore>,
}

impl SessionsYieldExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockSessionStore::new()),
        }
    }
}

impl Default for SessionsYieldExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for SessionsYieldExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let yield_params: SessionsYieldParams = match serde_json::from_value(params) {
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
        if yield_params.session_id.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "session_id cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate message
        if yield_params.message.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "message cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Check if session exists
        if self.store.get(&yield_params.session_id).is_none() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::NotFound,
                message: format!("Target session not found: {}", yield_params.session_id),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        let yield_id = format!("yield-{}", uuid::Uuid::new_v4());

        // Simulate yield
        let result = if yield_params.wait_for_result {
            Some(YieldResult {
                session_id: yield_params.session_id.clone(),
                message_id: format!("msg-{}", uuid::Uuid::new_v4()),
                content: "Task completed successfully".to_string(),
                timestamp: chrono::Utc::now().timestamp(),
            })
        } else {
            None
        };

        let waited_seconds = if yield_params.wait_for_result {
            Some(start.elapsed().as_secs_f64())
        } else {
            None
        };

        let response = SessionsYieldResponse {
            success: true,
            yield_id,
            target_session_id: yield_params.session_id,
            message_delivered: true,
            result,
            waited_seconds,
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
            session_id: "parent-session".to_string(),
            user_id: "test-user".to_string(),
            tenant_id: "test-tenant".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["sessions:admin".to_string()],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_sessions_yield_success() {
        let executor = SessionsYieldExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": "Please process this task"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsYieldResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.success);
        assert!(!response.yield_id.is_empty());
        assert_eq!(response.target_session_id, "session-1");
        assert!(response.message_delivered);
    }

    #[tokio::test]
    async fn test_sessions_yield_with_wait() {
        let executor = SessionsYieldExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": "Process and return result",
            "wait_for_result": true
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsYieldResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.success);
        assert!(response.result.is_some());
        assert!(response.waited_seconds.is_some());
    }

    #[tokio::test]
    async fn test_sessions_yield_without_wait() {
        let executor = SessionsYieldExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": "Background task",
            "wait_for_result": false
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsYieldResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.success);
        assert!(response.result.is_none());
        assert!(response.waited_seconds.is_none());
    }

    #[tokio::test]
    async fn test_sessions_yield_empty_session_id() {
        let executor = SessionsYieldExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "",
            "message": "Test message"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_yield_empty_message() {
        let executor = SessionsYieldExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "message": ""
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_yield_session_not_found() {
        let executor = SessionsYieldExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "non-existent-session",
            "message": "Test message"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }
}
