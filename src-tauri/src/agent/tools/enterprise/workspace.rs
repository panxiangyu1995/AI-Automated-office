//! Enterprise Workspace Tool - Stage change executor

use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolErrorCode, ToolExecutor, ToolExecutionError};
use crate::agent::tools::registry::ToolRegistry;

pub use crate::agent::tools::enterprise_helpers::create_workspace_stage_change_descriptor;

// --- Workspace Stage Change Executor ---

pub struct WorkspaceStageChangeExecutor;

#[async_trait::async_trait]
impl ToolExecutor for WorkspaceStageChangeExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let action = map
            .get("action")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: action".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        match action {
            "stage" => {
                let page_id = map.get("page_id").and_then(|v| v.as_str());
                let editor_id = map.get("editor_id").and_then(|v| v.as_str());
                let changes = map.get("changes").cloned();
                let change_id = format!("change_{}", uuid::Uuid::new_v4());

                Ok(serde_json::json!({
                    "action": "staged",
                    "change_id": change_id,
                    "page_id": page_id,
                    "editor_id": editor_id,
                    "changes": changes,
                    "author": context.user_id,
                    "tenant_id": context.tenant_id,
                    "timestamp": chrono::Utc::now().timestamp_millis(),
                    "status": "staged",
                    "message": "Change staged successfully",
                }))
            }
            "query" => Ok(serde_json::json!({
                "action": "query",
                "changes": [],
                "total": 0,
                "session_id": context.session_id,
                "tenant_id": context.tenant_id,
                "message": "Staged changes query would return session changes",
            })),
            "discard" => {
                let change_id = map.get("change_id").and_then(|v| v.as_str());
                Ok(serde_json::json!({
                    "action": "discarded",
                    "change_id": change_id,
                    "session_id": context.session_id,
                    "tenant_id": context.tenant_id,
                    "timestamp": chrono::Utc::now().timestamp_millis(),
                    "status": "discarded",
                    "message": "Change discarded successfully",
                }))
            }
            _ => Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Unknown action: {}. Valid actions: stage, query, discard", action),
                details: None,
                recoverable: true,
                retryable: false,
            }),
        }
    }
}

/// Register workspace tool with the registry and executor map.
pub fn register(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_workspace_stage_change_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(WorkspaceStageChangeExecutor));
}
