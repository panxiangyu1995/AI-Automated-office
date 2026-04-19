//! Enterprise Knowledge Tools - Query and Submit Draft executors

use std::collections::HashMap;
use std::sync::Arc;

use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolErrorCode, ToolExecutor, ToolExecutionError};
use crate::agent::tools::registry::ToolRegistry;

pub use crate::agent::tools::enterprise_helpers::{
    create_knowledge_query_descriptor, create_knowledge_submit_draft_descriptor,
};

// --- Knowledge Query Executor ---

pub struct KnowledgeQueryExecutor;

#[async_trait::async_trait]
impl ToolExecutor for KnowledgeQueryExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let query = map
            .get("query")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: query".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let top_k = map
            .get("top_k")
            .and_then(|v| v.as_u64())
            .unwrap_or(10) as usize;

        let department = map.get("department").and_then(|v| v.as_str());

        Ok(serde_json::json!({
            "query": query,
            "results": [],
            "total": 0,
            "top_k": top_k,
            "filters": {
                "department": department,
                "tenant_id": context.tenant_id,
            },
            "message": "Knowledge query would integrate with RAG service here",
        }))
    }
}

// --- Knowledge Submit Draft Executor ---

pub struct KnowledgeSubmitDraftExecutor;

#[async_trait::async_trait]
impl ToolExecutor for KnowledgeSubmitDraftExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

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

        let title = map
            .get("title")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Missing required parameter: title".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            })?;

        let category = map.get("category").and_then(|v| v.as_str());

        let draft_id = format!("draft_{}", uuid::Uuid::new_v4());

        Ok(serde_json::json!({
            "draft_id": draft_id,
            "title": title,
            "content_length": content.len(),
            "category": category,
            "status": "pending_review",
            "author_id": context.user_id,
            "tenant_id": context.tenant_id,
            "created_at": chrono::Utc::now().timestamp_millis(),
            "message": "Draft submission would create entry in knowledge base",
        }))
    }
}

/// Register knowledge tools with the registry and executor map.
pub fn register(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let descriptor = create_knowledge_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(KnowledgeQueryExecutor));

    let descriptor = create_knowledge_submit_draft_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(KnowledgeSubmitDraftExecutor));
}
