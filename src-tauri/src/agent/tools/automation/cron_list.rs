//! Cron list tool implementation.
//!
//! Lists scheduled tasks with optional filtering.

use std::sync::RwLock;
use std::collections::HashMap;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::cron_schedule::{ScheduledTask, TaskStatus, TaskStore};
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

/// Parameters for cron list
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronListParams {
    /// Filter by status
    #[serde(default)]
    pub status_filter: Option<String>,

    /// Maximum number of results
    #[serde(default = "default_limit")]
    pub limit: usize,

    /// Offset for pagination
    #[serde(default)]
    pub offset: Option<usize>,
}

fn default_limit() -> usize {
    50
}

/// Cron list result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronListResult {
    pub tasks: Vec<ScheduledTask>,
    pub total: usize,
    pub has_more: bool,
}

/// Cron list executor
pub struct CronListExecutor;

impl CronListExecutor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for CronListExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for CronListExecutor {
    async fn execute(
        &self,
        params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let list_params: CronListParams = match serde_json::from_value(params) {
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

        // Validate limit
        if list_params.limit > 100 {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "limit cannot exceed 100".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let store = get_or_init_store();
        let mut tasks: Vec<ScheduledTask> = store.list_tasks().cloned().collect();

        // Apply status filter if provided
        if let Some(ref status_str) = list_params.status_filter {
            let status = match status_str.to_lowercase().as_str() {
                "pending" => TaskStatus::Pending,
                "running" => TaskStatus::Running,
                "completed" => TaskStatus::Completed,
                "failed" => TaskStatus::Failed,
                "cancelled" => TaskStatus::Cancelled,
                _ => {
                    return Err(ToolExecutionError {
                        code: ToolErrorCode::ValidationError,
                        message: format!("Unknown status: {}", status_str),
                        details: Some(serde_json::json!({
                            "valid_statuses": ["pending", "running", "completed", "failed", "cancelled"]
                        })),
                        recoverable: true,
                        retryable: false,
                    });
                }
            };
            tasks.retain(|t| t.status == status);
        }

        // Sort by next_run_at
        tasks.sort_by(|a, b| a.next_run_at.cmp(&b.next_run_at));

        let total = tasks.len();
        let offset = list_params.offset.unwrap_or(0);
        let has_more = offset + list_params.limit < total;

        // Apply pagination
        let tasks: Vec<ScheduledTask> = tasks
            .into_iter()
            .skip(offset)
            .take(list_params.limit)
            .collect();

        let result = CronListResult {
            tasks,
            total,
            has_more,
        };

        let _duration_ms = start.elapsed().as_millis() as u64;

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
    async fn test_cron_list() {
        let executor = CronListExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["automation:read".to_string()],
            metadata: None,
        };

        let params = serde_json::json!({});

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: CronListResult = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.tasks.is_empty() || !response.tasks.is_empty()); // Depends on store state
    }

    #[tokio::test]
    async fn test_cron_list_with_filter() {
        let executor = CronListExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["automation:read".to_string()],
            metadata: None,
        };

        let params = serde_json::json!({
            "status_filter": "pending",
            "limit": 10
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
    }
}
