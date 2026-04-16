//! Cron cancel tool implementation.
//!
//! Cancels scheduled tasks.


use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::cron_schedule::{TaskStore, TaskStatus};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

static TASK_STORE: std::sync::RwLock<Option<TaskStore>> = std::sync::RwLock::new(None);

fn get_or_init_store() -> TaskStore {
    let store = TASK_STORE.read().unwrap();
    if let Some(ref s) = *store {
        return s.clone();
    }
    drop(store);
    let mut write = TASK_STORE.write().unwrap();
    if write.is_none() {
        *write = Some(TaskStore::new());
    }
    write.clone().unwrap()
}

fn update_store(store: TaskStore) {
    let mut write = TASK_STORE.write().unwrap();
    *write = Some(store);
}

/// Parameters for cron cancel
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronCancelParams {
    /// Task ID to cancel
    pub task_id: String,

    /// Also delete the task record
    #[serde(default)]
    pub delete: bool,
}

/// Cron cancel result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronCancelResult {
    pub task_id: String,
    pub success: bool,
    pub cancelled: bool,
    pub deleted: bool,
    pub message: String,
}

/// Cron cancel executor
pub struct CronCancelExecutor;

impl CronCancelExecutor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for CronCancelExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for CronCancelExecutor {
    async fn execute(
        &self,
        params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let cancel_params: CronCancelParams = match serde_json::from_value(params) {
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

        // Validate task_id
        if cancel_params.task_id.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "task_id cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let mut store = get_or_init_store();

        // Check if task exists
        let task = store.get_task(&cancel_params.task_id);
        if task.is_none() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::NotFound,
                message: format!("Task not found: {}", cancel_params.task_id),
                details: None,
                recoverable: false,
                retryable: false,
            });
        }

        let mut cancelled = false;
        let mut deleted = false;

        if cancel_params.delete {
            // Delete the task entirely
            store.remove_task(&cancel_params.task_id);
            deleted = true;
        } else {
            // Just disable/cancel the task
            if let Some(existing_task) = store.get_task(&cancel_params.task_id).cloned() {
                let mut updated_task = existing_task;
                updated_task.status = TaskStatus::Cancelled;
                updated_task.enabled = false;
                store.add_task(updated_task);
                cancelled = true;
            }
        }

        update_store(store);

        let result = CronCancelResult {
            task_id: cancel_params.task_id,
            success: true,
            cancelled,
            deleted,
            message: if deleted {
                "Task deleted successfully".to_string()
            } else if cancelled {
                "Task cancelled successfully".to_string()
            } else {
                "No action taken".to_string()
            },
        };

        Ok(serde_json::to_value(result).map_err(|e| ToolExecutionError {
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

    #[tokio::test]
    async fn test_cron_cancel_not_found() {
        let executor = CronCancelExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["automation:write".to_string()],
            metadata: None,
        };

        let params = serde_json::json!({
            "task_id": "non_existent_task"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        let err = result.unwrap_err();
        assert!(matches!(err.code, ToolErrorCode::NotFound));
    }

    #[tokio::test]
    async fn test_cron_cancel_validation() {
        let executor = CronCancelExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["automation:write".to_string()],
            metadata: None,
        };

        // Empty task_id
        let params = serde_json::json!({
            "task_id": ""
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }
}
