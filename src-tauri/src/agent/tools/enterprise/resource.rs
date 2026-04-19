//! Enterprise Resource Tools - Query and Upload executors

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolErrorCode, ToolExecutor, ToolExecutionError};
use crate::agent::tools::registry::ToolRegistry;

pub use crate::agent::tools::enterprise_helpers::{
    create_resource_query_descriptor, create_resource_upload_descriptor,
};

// --- Resource Query Executor ---

pub struct ResourceQueryExecutor;

#[async_trait::async_trait]
impl ToolExecutor for ResourceQueryExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let resource_type = map
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("local");

        match resource_type {
            "local" => {
                let path = map.get("path").and_then(|v| v.as_str());
                Ok(serde_json::json!({
                    "type": "local",
                    "path": path,
                    "message": "Local resource query - path resolution would happen here",
                    "tenant_id": context.tenant_id,
                }))
            }
            "cloud" => {
                let bucket = map.get("bucket").and_then(|v| v.as_str());
                let key = map.get("key").and_then(|v| v.as_str());
                Ok(serde_json::json!({
                    "type": "cloud",
                    "bucket": bucket,
                    "key": key,
                    "message": "Cloud resource query - S3/compatible storage access would happen here",
                    "tenant_id": context.tenant_id,
                }))
            }
            "workspace" => {
                let page_id = map.get("page_id").and_then(|v| v.as_str());
                Ok(serde_json::json!({
                    "type": "workspace",
                    "page_id": page_id,
                    "message": "Workspace resource query - workspace resource lookup would happen here",
                    "tenant_id": context.tenant_id,
                }))
            }
            _ => Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Unknown resource type: {}", resource_type),
                details: None,
                recoverable: true,
                retryable: false,
            }),
        }
    }
}

// --- Resource Upload Executor ---

pub struct ResourceUploadExecutor;

#[async_trait::async_trait]
impl ToolExecutor for ResourceUploadExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let destination = map
            .get("destination")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: destination".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let resource_type = map
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("local");

        Ok(serde_json::json!({
            "result": "upload_queued",
            "destination": destination,
            "type": resource_type,
            "message": "Resource upload would happen here",
            "tenant_id": context.tenant_id,
            "user_id": context.user_id,
            "timestamp": SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_millis() as i64)
                .unwrap_or(0),
        }))
    }
}

/// Register resource tools with the registry and executor map.
pub fn register(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_resource_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(ResourceQueryExecutor));

    let descriptor = create_resource_upload_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(ResourceUploadExecutor));
}
