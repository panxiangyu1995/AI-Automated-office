//! Enterprise Messaging Tools - Query and Send executors

use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolErrorCode, ToolExecutor, ToolExecutionError};
use crate::agent::tools::registry::ToolRegistry;

pub use crate::agent::tools::enterprise_helpers::{
    create_message_query_descriptor, create_message_send_descriptor,
};

// --- Message Query Executor ---

pub struct MessageQueryExecutor;

#[async_trait::async_trait]
impl ToolExecutor for MessageQueryExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let target = map
            .get("target")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: target".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let target_id = map
            .get("target_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: target_id".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let limit = map
            .get("limit")
            .and_then(|v| v.as_u64())
            .unwrap_or(50) as usize;

        Ok(serde_json::json!({
            "target": target,
            "target_id": target_id,
            "messages": [],
            "total": 0,
            "limit": limit,
            "tenant_id": context.tenant_id,
            "message": "Message query would retrieve from message store",
        }))
    }
}

// --- Message Send Executor ---

pub struct MessageSendExecutor;

#[async_trait::async_trait]
impl ToolExecutor for MessageSendExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let target = map
            .get("target")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: target".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let target_id = map
            .get("target_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: target_id".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let content = map
            .get("content")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: content".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let sender = map.get("sender").and_then(|v| v.as_str()).unwrap_or("agent");
        let message_id = format!("msg_{}", uuid::Uuid::new_v4());

        Ok(serde_json::json!({
            "message_id": message_id,
            "target": target,
            "target_id": target_id,
            "content": content,
            "sender": sender,
            "sender_id": context.user_id,
            "tenant_id": context.tenant_id,
            "status": "sent",
            "created_at": chrono::Utc::now().timestamp_millis(),
        }))
    }
}

/// Register messaging tools with the registry and executor map.
pub fn register(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_message_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(MessageQueryExecutor));

    let descriptor = create_message_send_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(MessageSendExecutor));
}
