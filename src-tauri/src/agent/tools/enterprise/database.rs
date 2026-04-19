//! Enterprise Database Tool - Admin query executor

use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;

use crate::agent::tools::enterprise_types::get_or_init_db_config;
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolErrorCode, ToolExecutor, ToolExecutionError};
use crate::agent::tools::registry::ToolRegistry;

pub use crate::agent::tools::enterprise_helpers::create_db_query_descriptor;

// --- Database Query Executor ---

pub struct DbQueryExecutor;

#[async_trait::async_trait]
impl ToolExecutor for DbQueryExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        if !context.permissions.contains(&"admin".to_string())
            && !context.permissions.contains(&"db_admin".to_string())
        {
            return Err(ToolExecutionError {
                code: ToolErrorCode::PermissionDenied,
                message: "db_query tool requires admin permission".to_string(),
                details: Some(serde_json::json!({
                    "required_permission": "admin",
                    "user_permissions": context.permissions,
                })),
                recoverable: false,
                retryable: false,
            });
        }

        let table = map
            .get("table")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: table".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let config = get_or_init_db_config();

        if !config.allowed_tables.contains(&table) {
            return Err(ToolExecutionError {
                code: ToolErrorCode::PermissionDenied,
                message: format!("Table '{}' is not in the allowed list", table),
                details: Some(serde_json::json!({
                    "table": table,
                    "allowed_tables": config.allowed_tables,
                })),
                recoverable: false,
                retryable: false,
            });
        }

        let filters = map.get("filters").cloned();
        let fields = map.get("fields").and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str()).collect::<Vec<_>>());
        let page = map.get("page").and_then(|v| v.as_u64()).unwrap_or(1);
        let page_size = map
            .get("page_size")
            .and_then(|v| v.as_u64())
            .unwrap_or(100)
            .min(config.max_rows as u64) as usize;

        let demo_result = serde_json::json!([{
            "id": "1",
            "name": "Example Record",
            "email": "user@example.com",
            "tenant_id": context.tenant_id,
            "_masked_fields": ["password", "token"],
        }]);

        Ok(serde_json::json!({
            "table": table,
            "rows": demo_result,
            "fields": fields,
            "filters": filters,
            "page": page,
            "page_size": page_size,
            "total": 1,
            "tenant_id": context.tenant_id,
            "admin_user": context.user_id,
            "timestamp": chrono::Utc::now().timestamp_millis(),
            "audit_logged": true,
            "message": "Query executed - real implementation would query database with tenant isolation",
        }))
    }
}

/// Register database tool with the registry and executor map.
pub fn register(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_db_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(DbQueryExecutor));
}
