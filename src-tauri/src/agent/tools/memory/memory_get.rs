//! Memory get tool implementation.
//!
//! Retrieves a specific memory entry by its ID.

use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::memory_search::{MemorySource, MockMemoryStore};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Parameters for memory get
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryGetParams {
    /// Memory entry ID
    pub id: String,

    /// Include metadata in result (default: true)
    #[serde(default = "default_true")]
    pub include_metadata: bool,

    /// Tenant ID for multi-tenant isolation
    #[serde(default)]
    pub tenant_id: Option<String>,
}

fn default_true() -> bool {
    true
}

/// Memory entry response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryGetResponse {
    /// Memory entry ID
    pub id: String,

    /// Memory content text
    pub content: String,

    /// Memory source type
    pub source: MemorySource,

    /// Optional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,

    /// Creation timestamp
    pub created_at: i64,

    /// Update timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<i64>,

    /// Whether the entry was found
    pub found: bool,
}

/// Memory get executor
pub struct MemoryGetExecutor {
    store: Arc<MockMemoryStore>,
}

impl MemoryGetExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockMemoryStore::new()),
        }
    }

    /// Get a memory entry by ID
    pub fn get(&self, id: &str) -> Option<MemoryGetResponse> {
        self.store.get_by_id(id).map(|entry| MemoryGetResponse {
            id: entry.id.clone(),
            content: entry.content.clone(),
            source: entry.source.clone(),
            metadata: Some(entry.metadata.clone()),
            created_at: entry.created_at,
            updated_at: entry.updated_at,
            found: true,
        })
    }
}

impl Default for MemoryGetExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for MemoryGetExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        // Parse parameters
        let get_params: MemoryGetParams = match serde_json::from_value(params) {
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

        // Validate ID
        if get_params.id.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Memory ID cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Get the entry
        let response = self.get(&get_params.id);

        match response {
            Some(mut entry) => {
                // Filter metadata if requested
                if !get_params.include_metadata {
                    entry.metadata = None;
                }

                Ok(serde_json::to_value(entry).map_err(|e| {
                    ToolExecutionError {
                        code: ToolErrorCode::InternalError,
                        message: format!("Failed to serialize response: {}", e),
                        details: None,
                        recoverable: false,
                        retryable: false,
                    }
                })?)
            }
            None => Err(ToolExecutionError {
                code: ToolErrorCode::NotFound,
                message: format!("Memory entry not found: {}", get_params.id),
                details: Some(serde_json::json!({
                    "id": get_params.id,
                    "tenant_id": get_params.tenant_id.or(Some(context.tenant_id.clone())),
                })),
                recoverable: false,
                retryable: false,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_memory_get_executor() {
        let executor = MemoryGetExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test-session".to_string(),
            user_id: "test-user".to_string(),
            tenant_id: "test-tenant".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["memory:read".to_string()],
            metadata: None,
        };

        // First, get an ID from search
        let search_params = serde_json::json!({
            "query": "user preferences",
            "max_results": 1
        });
        let search_executor = super::super::memory_search::MemorySearchExecutor::new();
        let search_result = search_executor
            .execute(search_params, &context)
            .await
            .unwrap();
        let search_response: super::memory_search::MemorySearchResponse =
            serde_json::from_value(search_result).unwrap();

        if !search_response.results.is_empty() {
            let first_id = &search_response.results[0].id;

            // Get by ID
            let get_params = serde_json::json!({
                "id": first_id
            });
            let result = executor.execute(get_params, &context).await;
            assert!(result.is_ok());
            let response: MemoryGetResponse = serde_json::from_value(result.unwrap()).unwrap();
            assert_eq!(response.id, *first_id);
            assert!(response.found);
        }

        // Empty ID
        let get_params = serde_json::json!({
            "id": ""
        });
        let result = executor.execute(get_params, &context).await;
        assert!(result.is_err());

        // Not found
        let get_params = serde_json::json!({
            "id": "non-existent-id"
        });
        let result = executor.execute(get_params, &context).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err.code, ToolErrorCode::NotFound));
    }
}
