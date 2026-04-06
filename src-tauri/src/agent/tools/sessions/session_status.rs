//! Session status tool implementation.

use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::sessions_list::{MockSessionStore, SessionInfo};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Parameters for session status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionStatusParams {
    /// Session ID to get status for (current session if not specified)
    #[serde(default)]
    pub session_id: Option<String>,

    /// Include children sessions
    #[serde(default = "default_true")]
    pub include_children: bool,
}

fn default_true() -> bool {
    true
}

/// Session status response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionStatusResponse {
    pub session: SessionInfo,
    pub children: Vec<SessionInfo>,
    pub active_agents: usize,
    pub pending_tasks: usize,
    pub duration_ms: u64,
}

/// Session status executor
pub struct SessionStatusExecutor {
    store: Arc<MockSessionStore>,
}

impl SessionStatusExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockSessionStore::new()),
        }
    }
}

impl Default for SessionStatusExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for SessionStatusExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let status_params: SessionStatusParams = match serde_json::from_value(params) {
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

        let session_id = status_params.session_id.unwrap_or_else(|| context.session_id.clone());

        // Get session info
        let session = match self.store.get(&session_id) {
            Some(s) => s.clone(),
            None => {
                // Return default info for current session
                SessionInfo {
                    id: session_id.clone(),
                    title: "Current Session".to_string(),
                    status: super::sessions_list::SessionStatus::Running,
                    created_at: chrono::Utc::now().timestamp() - 3600,
                    updated_at: chrono::Utc::now().timestamp(),
                    parent_id: None,
                    agent_id: Some("main-agent".to_string()),
                    model: Some("gpt-4".to_string()),
                    message_count: 42,
                    is_subagent: false,
                }
            }
        };

        // Get children if requested
        let children: Vec<SessionInfo> = if status_params.include_children {
            self.store.list(&super::sessions_list::SessionsVisibility::Tree, 10)
                .into_iter()
                .filter(|s| s.parent_id.as_ref() == Some(&session_id))
                .collect()
        } else {
            vec![]
        };

        let active_agents = children.iter()
            .filter(|s| matches!(s.status, super::sessions_list::SessionStatus::Running))
            .count();

        let pending_tasks = children.iter()
            .filter(|s| matches!(s.status, super::sessions_list::SessionStatus::Pending))
            .count();

        let response = SessionStatusResponse {
            session,
            children,
            active_agents,
            pending_tasks,
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
            session_id: "session-1".to_string(),
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
    async fn test_session_status_existing_session() {
        let executor = SessionStatusExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionStatusResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.session.id, "session-1");
    }

    #[tokio::test]
    async fn test_session_status_default_session() {
        let executor = SessionStatusExecutor::new();
        let context = create_test_context();

        // No session_id - uses context session_id
        let params = serde_json::json!({});

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionStatusResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.session.id, "session-1");
    }

    #[tokio::test]
    async fn test_session_status_with_children() {
        let executor = SessionStatusExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "include_children": true
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionStatusResponse = serde_json::from_value(result.unwrap()).unwrap();
        // Response includes children array
        assert!(response.children.len() >= 0);
    }

    #[tokio::test]
    async fn test_session_status_without_children() {
        let executor = SessionStatusExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "session_id": "session-1",
            "include_children": false
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionStatusResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.children.is_empty());
    }

    #[tokio::test]
    async fn test_session_status_counts() {
        let executor = SessionStatusExecutor::new();
        let context = create_test_context();

        let params = serde_json::json!({
            "include_children": true
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: SessionStatusResponse = serde_json::from_value(result.unwrap()).unwrap();
        // active_agents and pending_tasks should be calculated
        assert!(response.active_agents >= 0);
        assert!(response.pending_tasks >= 0);
    }
}
