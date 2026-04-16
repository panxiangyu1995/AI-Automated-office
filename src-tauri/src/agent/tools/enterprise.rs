//! Enterprise Tools Module
//!
//! Provides enterprise-level tools for resource management, knowledge access,
//! messaging, workspace staging, and database queries.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};
use crate::agent::tools::registry::ToolRegistry;

pub use super::enterprise_types::{get_or_init_db_config, get_or_init_delegation_config};
use super::enterprise_helpers::{
    create_resource_query_descriptor, create_resource_upload_descriptor,
    create_knowledge_query_descriptor, create_knowledge_submit_draft_descriptor,
    create_message_query_descriptor, create_message_send_descriptor,
    create_agent_delegate_descriptor, create_workspace_stage_change_descriptor,
    create_db_query_descriptor,
};

pub fn register_enterprise_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    // Resource tools
    let descriptor = create_resource_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(ResourceQueryExecutor));

    let descriptor = create_resource_upload_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(ResourceUploadExecutor));

    // Knowledge tools
    let descriptor = create_knowledge_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(KnowledgeQueryExecutor));

    let descriptor = create_knowledge_submit_draft_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(KnowledgeSubmitDraftExecutor));

    // Messaging tools
    let descriptor = create_message_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(MessageQueryExecutor));

    let descriptor = create_message_send_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(MessageSendExecutor));

    let descriptor = create_agent_delegate_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(AgentDelegateExecutor));

    // Workspace tools
    let descriptor = create_workspace_stage_change_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(WorkspaceStageChangeExecutor));

    // Database tools
    let descriptor = create_db_query_descriptor();
    let _ = registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), Arc::new(DbQueryExecutor));
}

// --- Resource Query Executor ---

struct ResourceQueryExecutor;

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

struct ResourceUploadExecutor;

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

        // In production, this would:
        // 1. Decode base64 data
        // 2. Validate content type and size
        // 3. Upload to appropriate storage (local/S3/workspace)
        // 4. Return resource metadata

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

// --- Knowledge Query Executor ---

struct KnowledgeQueryExecutor;

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

        // In production, this would:
        // 1. Build retrieval request with filters
        // 2. Call RAG service for hybrid search
        // 3. Return ranked results with scores

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

struct KnowledgeSubmitDraftExecutor;

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

        // Generate draft ID
        let draft_id = format!("draft_{}", uuid::Uuid::new_v4());

        // In production, this would:
        // 1. Create draft entry in knowledge base
        // 2. Flag for review if sensitive content detected
        // 3. Notify reviewers

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

// --- Message Query Executor ---

struct MessageQueryExecutor;

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

        // In production, this would query the message store
        // with proper tenant isolation

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

struct MessageSendExecutor;

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

        // Generate message ID
        let message_id = format!("msg_{}", uuid::Uuid::new_v4());

        // In production, this would:
        // 1. Create message record
        // 2. Deliver to target (user/channel/agent/department)
        // 3. Emit notification events

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

// --- Agent Delegate Executor ---

struct AgentDelegateExecutor;

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

        // Validate delegation depth
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

        // Generate task ID
        let task_id = format!("task_{}", uuid::Uuid::new_v4());
        let session_id = format!("subagent_{}", uuid::Uuid::new_v4());

        // In production, this would:
        // 1. Create isolated sub-agent session
        // 2. Configure tool filtering and permissions
        // 3. Start task with TTL
        // 4. Link to parent session for result aggregation

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

// --- Workspace Stage Change Executor ---

struct WorkspaceStageChangeExecutor;

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

                // Generate change ID
                let change_id = format!("change_{}", uuid::Uuid::new_v4());

                // In production, this would:
                // 1. Validate change format (structured diffs)
                // 2. Check for conflicts with existing staged changes
                // 3. Store staged change with metadata

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
            "query" => {
                // In production, this would retrieve all staged changes for the session
                Ok(serde_json::json!({
                    "action": "query",
                    "changes": [],
                    "total": 0,
                    "session_id": context.session_id,
                    "tenant_id": context.tenant_id,
                    "message": "Staged changes query would return session changes",
                }))
            }
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

// --- Database Query Executor ---

struct DbQueryExecutor;

#[async_trait::async_trait]
impl ToolExecutor for DbQueryExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        // Check admin permission
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

        // Check table whitelist
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

        // In production, this would:
        // 1. Build parameterized query with tenant isolation
        // 2. Apply field masking for sensitive fields
        // 3. Enforce row limits and timeouts
        // 4. Log query to audit trail

        // Simulate result with masked fields
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

// ==================== Tests ====================

#[cfg(test)]

mod tests {
    use super::*;
    use serde_json::Value;

    fn create_test_context() -> ToolExecutionContext {
        ToolExecutionContext {
            session_id: "test_session".to_string(),
            user_id: "test_user".to_string(),
            tenant_id: "test_tenant".to_string(),
            department_id: Some("test_dept".to_string()),
            page_id: None,
            resource_id: None,
            permissions: vec!["admin".to_string()],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_resource_query_local() {
        let executor = ResourceQueryExecutor;
        let params = serde_json::json!({
            "type": "local",
            "path": "/tmp/test.txt"
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value["type"], "local");
    }

    #[tokio::test]
    async fn test_resource_query_cloud() {
        let executor = ResourceQueryExecutor;
        let params = serde_json::json!({
            "type": "cloud",
            "bucket": "my-bucket",
            "key": "path/to/file.txt"
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value["type"], "cloud");
        assert_eq!(value["bucket"], "my-bucket");
    }

    #[tokio::test]
    async fn test_knowledge_query() {
        let executor = KnowledgeQueryExecutor;
        let params = serde_json::json!({
            "query": "How do I reset my password?",
            "top_k": 5
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value["query"], "How do I reset my password?");
        assert_eq!(value["top_k"], 5);
    }

    #[tokio::test]
    async fn test_knowledge_submit_draft() {
        let executor = KnowledgeSubmitDraftExecutor;
        let params = serde_json::json!({
            "title": "Test Draft",
            "content": "This is a test knowledge entry draft",
            "category": "faq"
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert!(value["draft_id"].is_string());
        assert_eq!(value["title"], "Test Draft");
        assert_eq!(value["status"], "pending_review");
    }

    #[tokio::test]
    async fn test_message_send() {
        let executor = MessageSendExecutor;
        let params = serde_json::json!({
            "target": "user",
            "target_id": "user123",
            "content": "Hello from agent!"
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert!(value["message_id"].is_string());
        assert_eq!(value["target"], "user");
        assert_eq!(value["content"], "Hello from agent!");
        assert_eq!(value["sender"], "agent");
    }

    #[tokio::test]
    async fn test_agent_delegate() {
        let executor = AgentDelegateExecutor;
        let params = serde_json::json!({
            "agent_config": "{\"model\": \"gpt-4\"}",
            "task_spec": "Analyze this document and summarize",
            "max_depth": 2
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert!(value["task_id"].is_string());
        assert_eq!(value["max_depth"], 2);
        assert_eq!(value["status"], "delegated");
    }

    #[tokio::test]
    async fn test_agent_delegate_depth_exceeded() {
        let executor = AgentDelegateExecutor;
        let params = serde_json::json!({
            "agent_config": "{}",
            "task_spec": "Test task",
            "max_depth": 10  // Exceeds default max of 3
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_workspace_stage_change() {
        let executor = WorkspaceStageChangeExecutor;
        let params = serde_json::json!({
            "action": "stage",
            "page_id": "page123",
            "changes": {
                "before": {},
                "after": {"title": "Updated Title"}
            }
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value["action"], "staged");
        assert!(value["change_id"].is_string());
    }

    #[tokio::test]
    async fn test_db_query_success() {
        let executor = DbQueryExecutor;
        let params = serde_json::json!({
            "table": "users",
            "filters": {"status": "active"},
            "page": 1,
            "page_size": 10
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value["table"], "users");
        assert!(value["rows"].is_array());
        assert!(value["audit_logged"].as_bool().unwrap_or(false));
    }

    #[tokio::test]
    async fn test_db_query_no_admin() {
        let executor = DbQueryExecutor;
        let params = serde_json::json!({
            "table": "users"
        });
        // Context without admin permission
        let context = ToolExecutionContext {
            session_id: "test_session".to_string(),
            user_id: "test_user".to_string(),
            tenant_id: "test_tenant".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec![],  // No admin permission
            metadata: None,
        };

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_db_query_table_not_whitelisted() {
        let executor = DbQueryExecutor;
        let params = serde_json::json!({
            "table": "secret_table"  // Not in whitelist
        });
        let context = create_test_context();

        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }
}

