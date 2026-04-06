//! Sessions spawn tool implementation.

use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::sessions_list::{MockSessionStore, SessionInfo, SessionStatus};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Parameters for sessions spawn
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsSpawnParams {
    /// Task description for the sub-agent
    pub task: String,

    /// Optional model override
    #[serde(default)]
    pub model: Option<String>,

    /// Optional allowed tools for the sub-agent
    #[serde(default)]
    pub tools: Option<Vec<String>>,

    /// TTL in seconds (auto-terminate after this time)
    #[serde(default)]
    pub ttl_seconds: Option<i64>,

    /// Parent session ID (current session by default)
    #[serde(default)]
    pub parent_session_id: Option<String>,

    /// Agent ID to spawn (default: current)
    #[serde(default)]
    pub agent_id: Option<String>,

    /// Priority (higher = more resources)
    #[serde(default)]
    pub priority: Option<i32>,
}

/// Spawn result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsSpawnResponse {
    pub session_id: String,
    pub task_id: String,
    pub status: String,
    pub agent_id: String,
    pub ttl_seconds: Option<i64>,
    pub created_at: i64,
    pub estimated_start_time: i64,
    pub duration_ms: u64,
}

/// Sessions spawn executor
pub struct SessionsSpawnExecutor {
    store: Arc<MockSessionStore>,
}

impl SessionsSpawnExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockSessionStore::new()),
        }
    }
}

impl Default for SessionsSpawnExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for SessionsSpawnExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let spawn_params: SessionsSpawnParams = match serde_json::from_value(params) {
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

        // Validate task
        if spawn_params.task.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "task cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate TTL
        if let Some(ttl) = spawn_params.ttl_seconds {
            if ttl <= 0 {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: "ttl_seconds must be positive".to_string(),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
            if ttl > 3600 {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: "ttl_seconds cannot exceed 3600 (1 hour)".to_string(),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        }

        // Generate IDs
        let session_id = format!("session-{}", uuid::Uuid::new_v4());
        let task_id = format!("task-{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp();
        let agent_id = spawn_params.agent_id.unwrap_or_else(|| "sub-agent".to_string());

        // Create session entry
        let new_session = SessionInfo {
            id: session_id.clone(),
            title: spawn_params.task.chars().take(50).collect(),
            status: SessionStatus::Pending,
            created_at: now,
            updated_at: now,
            parent_id: spawn_params.parent_session_id.or(Some(context.session_id.clone())),
            agent_id: Some(agent_id.clone()),
            model: spawn_params.model.clone(),
            message_count: 0,
            is_subagent: true,
        };

        let response = SessionsSpawnResponse {
            session_id,
            task_id,
            status: "spawned".to_string(),
            agent_id,
            ttl_seconds: spawn_params.ttl_seconds,
            created_at: now,
            estimated_start_time: now + 1, // Immediate start
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
            permissions: vec!["sessions:admin".to_string()],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_sessions_spawn_success() {
        let executor = SessionsSpawnExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "task": "Search for Rust programming information",
            "ttl_seconds": 600
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsSpawnResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(!response.session_id.is_empty());
        assert!(!response.task_id.is_empty());
        assert_eq!(response.status, "spawned");
        assert_eq!(response.ttl_seconds, Some(600));
    }

    #[tokio::test]
    async fn test_sessions_spawn_empty_task() {
        let executor = SessionsSpawnExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "task": ""
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_spawn_invalid_ttl() {
        let executor = SessionsSpawnExecutor::new();
        let context = create_test_context();

        // TTL too large
        let params = serde_json::json!({
            "task": "Test task",
            "ttl_seconds": 7200
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Negative TTL
        let params = serde_json::json!({
            "task": "Test task",
            "ttl_seconds": -1
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sessions_spawn_with_tools() {
        let executor = SessionsSpawnExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "task": "Search web for information",
            "tools": ["web_search", "web_fetch"]
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsSpawnResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(!response.session_id.is_empty());
    }

    #[tokio::test]
    async fn test_sessions_spawn_no_ttl() {
        let executor = SessionsSpawnExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "task": "Simple task without TTL"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionsSpawnResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.ttl_seconds.is_none());
    }
}
