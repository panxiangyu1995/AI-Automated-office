//! Enterprise Delegation Tool - Sub-agent delegation executor

use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;

use crate::agent::tools::enterprise_types::get_or_init_delegation_config;
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolErrorCode, ToolExecutor, ToolExecutionError};
use crate::agent::tools::registry::ToolRegistry;

pub use crate::agent::tools::enterprise_helpers::create_agent_delegate_descriptor;

// --- Agent Delegate Executor ---

pub struct AgentDelegateExecutor;

#[async_trait::async_trait]
impl ToolExecutor for AgentDelegateExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let agent_config = map
            .get("agent_config")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: agent_config".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let task_spec = map
            .get("task_spec")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: task_spec".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let parent_session_id = map.get("parent_session_id").and_then(|v| v.as_str());
        let ttl_seconds = map.get("ttl_seconds").and_then(|v| v.as_i64());
        let max_depth = map.get("max_depth").and_then(|v| v.as_u64()).unwrap_or(3);

        let config = get_or_init_delegation_config();

        if max_depth > config.max_depth as u64 {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!(
                    "Max delegation depth {} exceeds limit {}",
                    max_depth, config.max_depth
                ),
                details: Some(serde_json::json!({
                    "requested": max_depth,
                    "limit": config.max_depth,
                })),
                recoverable: true,
                retryable: false,
            });
        }

        let task_id = format!("task_{}", uuid::Uuid::new_v4());
        let session_id = format!("subagent_{}", uuid::Uuid::new_v4());

        Ok(serde_json::json!({
            "task_id": task_id,
            "session_id": session_id,
            "agent_config": agent_config,
            "task_spec": task_spec,
            "parent_session_id": parent_session_id,
            "ttl_seconds": ttl_seconds.unwrap_or(config.default_ttl_seconds),
            "max_depth": max_depth,
            "status": "delegated",
            "tenant_id": context.tenant_id,
            "delegated_by": context.user_id,
            "created_at": chrono::Utc::now().timestamp_millis(),
        }))
    }
}

/// Register delegation tool with the registry and executor map.
pub fn register(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_agent_delegate_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(AgentDelegateExecutor));
}
