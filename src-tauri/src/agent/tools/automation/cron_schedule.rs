//! Cron schedule tool implementation.
//!
//! Schedules tasks to run at specified intervals.

use std::sync::RwLock;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Task status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// Scheduled task
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTask {
    pub id: String,
    pub cron_expression: String,
    pub task: String,
    pub description: Option<String>,
    pub agent_config: Option<Value>,
    pub status: TaskStatus,
    pub enabled: bool,
    pub created_at: i64,
    pub next_run_at: i64,
    pub last_run_at: Option<i64>,
    pub run_count: usize,
}

/// Global task store
static TASK_STORE: RwLock<Option<TaskStore>> = RwLock::new(None);

#[derive(Default, Clone)]
pub struct TaskStore {
    tasks: HashMap<String, ScheduledTask>,
}

impl TaskStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_task(&mut self, task: ScheduledTask) {
        self.tasks.insert(task.id.clone(), task);
    }

    pub fn get_task(&self, id: &str) -> Option<&ScheduledTask> {
        self.tasks.get(id)
    }

    pub fn list_tasks(&self) -> Vec<&ScheduledTask> {
        self.tasks.values().collect()
    }

    pub fn remove_task(&mut self, id: &str) -> Option<ScheduledTask> {
        self.tasks.remove(id)
    }
}

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

/// Parameters for cron schedule
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronScheduleParams {
    /// Cron expression (e.g., "0 0 * * *" for daily at midnight)
    pub cron_expression: String,

    /// Task description
    pub task: String,

    /// Optional agent configuration
    #[serde(default)]
    pub agent_config: Option<Value>,

    /// Enable task immediately
    #[serde(default = "default_true")]
    pub enabled: bool,

    /// Optional description
    #[serde(default)]
    pub description: Option<String>,

    /// Tenant ID for isolation
    #[serde(default)]
    pub tenant_id: Option<String>,
}

fn default_true() -> bool {
    true
}

/// Cron schedule result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronScheduleResult {
    pub task_id: String,
    pub cron_expression: String,
    pub next_run_at: i64,
    pub status: String,
    pub created_at: i64,
}

/// Cron schedule executor
pub struct CronScheduleExecutor;

impl CronScheduleExecutor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for CronScheduleExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for CronScheduleExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let _start = Instant::now();

        let schedule_params: CronScheduleParams = match serde_json::from_value(params) {
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

        // Validate cron expression (basic validation)
        if schedule_params.cron_expression.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "cron_expression cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate task description
        if schedule_params.task.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "task cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Generate task ID
        let task_id = format!("task_{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp();

        // Calculate next run time (simplified - real impl would parse cron)
        let next_run_at = now + 3600; // Next hour as placeholder

        let task = ScheduledTask {
            id: task_id.clone(),
            cron_expression: schedule_params.cron_expression.clone(),
            task: schedule_params.task.clone(),
            description: schedule_params.description.clone(),
            agent_config: schedule_params.agent_config.clone(),
            status: if schedule_params.enabled {
                TaskStatus::Pending
            } else {
                TaskStatus::Cancelled
            },
            enabled: schedule_params.enabled,
            created_at: now,
            next_run_at,
            last_run_at: None,
            run_count: 0,
        };

        let mut store = get_or_init_store();
        store.add_task(task.clone());
        update_store(store);

        let result = CronScheduleResult {
            task_id,
            cron_expression: schedule_params.cron_expression,
            next_run_at,
            status: if schedule_params.enabled {
                "pending".to_string()
            } else {
                "disabled".to_string()
            },
            created_at: now,
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
    async fn test_cron_schedule() {
        let executor = CronScheduleExecutor::new();
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
            "cron_expression": "0 0 * * *",
            "task": "Daily backup task",
            "description": "Run daily backup"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: CronScheduleResult = serde_json::from_value(result.unwrap()).unwrap();
        assert!(!response.task_id.is_empty());
        assert_eq!(response.status, "pending");
    }

    #[tokio::test]
    async fn test_cron_schedule_validation() {
        let executor = CronScheduleExecutor::new();
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

        // Empty cron expression
        let params = serde_json::json!({
            "cron_expression": "",
            "task": "Test task"
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Empty task
        let params = serde_json::json!({
            "cron_expression": "0 0 * * *",
            "task": ""
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }
}
