//! Memory search tool implementation.
//!
//! Provides semantic search over memory entries using vector embeddings.

use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Instant;

use crate::agent::tools::descriptor::ToolCapabilities;
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Memory source types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MemorySource {
    /// Personal memory entries
    Memory,
    /// Session history entries
    Sessions,
    /// Knowledge base entries
    Knowledge,
}

impl Default for MemorySource {
    fn default() -> Self {
        Self::Memory
    }
}

/// Date range filter for memory search
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DateRange {
    pub from: i64,
    pub to: i64,
}

/// Parameters for memory search
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySearchParams {
    /// Natural language query string
    pub query: String,

    /// Maximum number of results to return (default: 5)
    #[serde(default = "default_max_results")]
    pub max_results: usize,

    /// Minimum similarity score threshold (0.0-1.0)
    #[serde(default)]
    pub min_score: Option<f32>,

    /// Filter by memory sources
    #[serde(default)]
    pub sources: Option<Vec<MemorySource>>,

    /// Filter by date range
    #[serde(default)]
    pub date_range: Option<DateRange>,

    /// Include metadata in results
    #[serde(default = "default_true")]
    pub include_metadata: bool,

    /// Tenant ID for multi-tenant isolation
    #[serde(default)]
    pub tenant_id: Option<String>,
}

fn default_max_results() -> usize {
    5
}

fn default_true() -> bool {
    true
}

/// Single memory search result entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySearchResult {
    /// Memory entry ID (Note: Qdrant requires UUID format)
    pub id: String,

    /// Memory content text
    pub content: String,

    /// Memory source type
    pub source: MemorySource,

    /// Similarity score (0.0-1.0)
    pub score: f32,

    /// Optional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,

    /// Creation timestamp
    pub created_at: i64,

    /// Update timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<i64>,
}

/// Memory search response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySearchResponse {
    /// Original query string
    pub query: String,

    /// Search results
    pub results: Vec<MemorySearchResult>,

    /// Total number of results
    pub total: usize,

    /// Search duration in milliseconds
    pub duration_ms: u64,

    /// Query embedding dimension (for debugging)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embedding_dimension: Option<usize>,
}

/// Mock embedding generator for development/testing
/// In production, this would call an actual embedding API
fn generate_mock_embedding(query: &str) -> Vec<f32> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    // Simple hash-based pseudo-embedding for development
    let mut hasher = DefaultHasher::new();
    query.hash(&mut hasher);
    let hash = hasher.finish();

    // Generate a 384-dimensional pseudo-embedding based on hash
    let mut embedding = Vec::with_capacity(384);
    let base = (hash % 1000) as f32 / 1000.0;
    for i in 0..384 {
        let value = ((hash >> (i % 64)) & 0xFF) as f32 / 255.0;
        let modulated = (value + base + (i as f32 * 0.001)) % 1.0;
        embedding.push(modulated);
    }
    embedding
}

/// Calculate cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let magnitude_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let magnitude_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if magnitude_a == 0.0 || magnitude_b == 0.0 {
        return 0.0;
    }

    dot_product / (magnitude_a * magnitude_b)
}

/// Mock memory store for development
/// In production, this would integrate with Qdrant or sqlite-vec
#[derive(Default)]
pub struct MockMemoryStore {
    entries: Vec<MemoryEntry>,
}

#[derive(Debug, Clone)]
pub struct MemoryEntry {
    pub id: String,
    pub content: String,
    pub source: MemorySource,
    pub embedding: Vec<f32>,
    pub metadata: Value,
    pub created_at: i64,
    pub updated_at: Option<i64>,
}

impl MockMemoryStore {
    pub fn new() -> Self {
        let mut store = Self::default();
        // Add some sample entries for testing
        store.add_sample_entries();
        store
    }

    fn add_sample_entries(&mut self) {
        let now = chrono::Utc::now().timestamp();

        let samples = vec![
            ("user_preferences", "User prefers dark mode theme", MemorySource::Memory),
            ("project_alpha", "Project Alpha started on 2024-01-15", MemorySource::Sessions),
            ("meeting_notes", "Team meeting scheduled for Fridays at 10am", MemorySource::Memory),
            ("api_design", "REST API follows OpenAPI 3.0 specification", MemorySource::Knowledge),
            ("coding_standards", "Code must pass linting before commit", MemorySource::Knowledge),
            ("user_feedback", "Users requested faster search performance", MemorySource::Memory),
        ];

        for (id, content, source) in samples {
            self.entries.push(MemoryEntry {
                id: uuid::Uuid::new_v4().to_string(),
                content: content.to_string(),
                source,
                embedding: generate_mock_embedding(content),
                metadata: serde_json::json!({
                    "category": id,
                    "author": "system",
                }),
                created_at: now - 86400, // 1 day ago
                updated_at: None,
            });
        }
    }

    pub fn search(
        &self,
        query_embedding: &[f32],
        max_results: usize,
        min_score: Option<f32>,
        sources: Option<&[MemorySource]>,
    ) -> Vec<(MemoryEntry, f32)> {
        let mut results: Vec<_> = self
            .entries
            .iter()
            .filter_map(|entry| {
                // Filter by source if specified
                if let Some(srcs) = sources {
                    if !srcs.contains(&entry.source) {
                        return None;
                    }
                }

                let score = cosine_similarity(query_embedding, &entry.embedding);

                // Filter by min_score if specified
                if let Some(min) = min_score {
                    if score < min {
                        return None;
                    }
                }

                Some((entry.clone(), score))
            })
            .collect();

        // Sort by score descending
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Limit results
        results.truncate(max_results);
        results
    }

    pub fn get_by_id(&self, id: &str) -> Option<&MemoryEntry> {
        self.entries.iter().find(|e| e.id == id)
    }
}

/// Memory search executor
pub struct MemorySearchExecutor {
    store: Arc<MockMemoryStore>,
}

impl MemorySearchExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockMemoryStore::new()),
        }
    }

    /// Perform the actual search
    pub async fn search(&self, params: &MemorySearchParams) -> Result<MemorySearchResponse, String> {
        let start = Instant::now();

        // Generate query embedding
        let query_embedding = generate_mock_embedding(&params.query);
        let embedding_dim = query_embedding.len();

        // Perform search
        let results = self.store.search(
            &query_embedding,
            params.max_results,
            params.min_score,
            params.sources.as_deref(),
        );

        let search_results: Vec<MemorySearchResult> = results
            .into_iter()
            .map(|(entry, score)| MemorySearchResult {
                id: entry.id,
                content: entry.content,
                source: entry.source,
                score,
                metadata: if params.include_metadata {
                    Some(entry.metadata)
                } else {
                    None
                },
                created_at: entry.created_at,
                updated_at: entry.updated_at,
            })
            .collect();

        let total = search_results.len();
        let duration_ms = start.elapsed().as_millis() as u64;

        Ok(MemorySearchResponse {
            query: params.query.clone(),
            results: search_results,
            total,
            duration_ms,
            embedding_dimension: Some(embedding_dim),
        })
    }
}

impl Default for MemorySearchExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for MemorySearchExecutor {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        // Parse parameters
        let search_params: MemorySearchParams = match serde_json::from_value(params) {
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

        // Inject tenant_id from context if not provided
        let mut params = search_params;
        if params.tenant_id.is_none() {
            params.tenant_id = Some(context.tenant_id.clone());
        }

        // Validate query
        if params.query.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Query cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate max_results
        if params.max_results == 0 {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "max_results must be greater than 0".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        if params.max_results > 100 {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "max_results cannot exceed 100".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate min_score
        if let Some(score) = params.min_score {
            if !(0.0..=1.0).contains(&score) {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: "min_score must be between 0.0 and 1.0".to_string(),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        }

        // Execute search
        match self.search(&params).await {
            Ok(response) => Ok(serde_json::to_value(response).map_err(|e| {
                ToolExecutionError {
                    code: ToolErrorCode::InternalError,
                    message: format!("Failed to serialize response: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                }
            })?),
            Err(e) => Err(ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: e,
                details: None,
                recoverable: true,
                retryable: true,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);

        let c = vec![1.0, 0.0, 0.0];
        let d = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&c, &d) - 0.0).abs() < 0.001);
    }

    #[test]
    fn test_mock_memory_store_search() {
        let store = MockMemoryStore::new();
        let query_emb = generate_mock_embedding("user preferences");

        let results = store.search(&query_emb, 5, None, None);
        assert!(!results.is_empty());

        // Test with min_score filter
        let results = store.search(&query_emb, 5, Some(0.8), None);
        assert!(results.iter().all(|(_, score)| score >= 0.8));

        // Test with source filter
        let results = store.search(&query_emb, 5, None, Some(&[MemorySource::Memory]));
        assert!(results.iter().all(|(e, _)| matches!(e.source, MemorySource::Memory)));
    }

    #[tokio::test]
    async fn test_memory_search_executor() {
        let executor = MemorySearchExecutor::new();
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

        // Valid request
        let params = serde_json::json!({
            "query": "user preferences",
            "max_results": 5
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());
        let response: MemorySearchResponse = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.query, "user preferences");
        assert!(!response.results.is_empty());

        // Empty query
        let params = serde_json::json!({
            "query": "",
            "max_results": 5
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Invalid max_results
        let params = serde_json::json!({
            "query": "test",
            "max_results": 0
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Invalid min_score
        let params = serde_json::json!({
            "query": "test",
            "max_results": 5,
            "min_score": 1.5
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }
}
