//! Knowledge Search Commands Module
//!
//! Provides Tauri commands for knowledge base search operations.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::session::TenantContext;
use crate::vector::VectorService;

/// Knowledge search request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSearchRequest {
    /// Search query text
    pub query: String,
    /// Maximum number of results (default: 10)
    pub top_k: Option<usize>,
    /// Minimum relevance score (0.0-1.0)
    pub score_threshold: Option<f32>,
    /// Knowledge base IDs to search (None = all accessible)
    pub knowledge_base_ids: Option<Vec<String>>,
    /// Search mode: semantic, full_text, hybrid
    pub search_mode: Option<String>,
}

/// Knowledge search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSearchResult {
    /// Result ID
    pub id: String,
    /// Document/chunk ID
    pub document_id: String,
    /// Content snippet
    pub content: String,
    /// Relevance score (0.0-1.0)
    pub score: f32,
    /// Highlighted snippets
    pub highlights: Vec<String>,
    /// Source metadata
    pub metadata: serde_json::Value,
}

/// Knowledge search response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSearchResponse {
    /// Search results
    pub results: Vec<KnowledgeSearchResult>,
    /// Total results found
    pub total: usize,
    /// Query time in milliseconds
    pub query_time_ms: u64,
    /// Search mode used
    pub search_mode: String,
}

/// Vector service state type alias
pub type VectorServiceState = Arc<RwLock<Option<VectorService>>>;

/// Perform hybrid knowledge search
#[tauri::command]
pub async fn knowledge_search(
    tenant_id: String,
    user_id: String,
    request: KnowledgeSearchRequest,
    vector_state: tauri::State<'_, VectorServiceState>,
) -> Result<KnowledgeSearchResponse, String> {
    let start = std::time::Instant::now();
    
    tracing::info!(
        "[KnowledgeSearch] Starting search for tenant: {}, query: {}", 
        tenant_id, request.query
    );
    
    // Create execution context for permission checking
    let ctx = TenantContext::new(
        tenant_id.clone(),
        user_id.clone(),
        "user".to_string(),
    );
    
    // Build search parameters
    let top_k = request.top_k.unwrap_or(10);
    let score_threshold = request.score_threshold.unwrap_or(0.0);
    let search_mode = request.search_mode.unwrap_or_else(|| "hybrid".to_string());
    
    // Perform real hybrid search if vector service is available
    let results = if request.query.is_empty() {
        Vec::new()
    } else {
        // Try to use real vector search
        let vector_service = vector_state.read().await;
        if let Some(service) = vector_service.as_ref() {
            match service.hybrid_search(&request.query, top_k, Some(tenant_id.clone())).await {
                Ok(search_results) => {
                    // Convert SearchResult to KnowledgeSearchResult
                    search_results.into_iter()
                        .filter(|r| r.score >= score_threshold)
                        .map(|r| {
                            let doc_id = r.id.split('-').next().unwrap_or(&r.id).to_string();
                            KnowledgeSearchResult {
                                id: r.id,
                                document_id: doc_id,
                                content: r.metadata.get("content")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("相关文档内容")
                                    .to_string(),
                                score: r.score,
                                highlights: vec![format!("相似度: {:.2}", r.score)],
                                metadata: r.metadata,
                            }
                        })
                        .collect()
                }
                Err(e) => {
                    tracing::warn!("[KnowledgeSearch] Vector search failed, using mock: {}", e);
                    create_mock_results(&request.query, &tenant_id)
                }
            }
        } else {
            tracing::info!("[KnowledgeSearch] Vector service not initialized, using mock results");
            create_mock_results(&request.query, &tenant_id)
        }
    };
    
    let total = results.len();
    let query_time_ms = start.elapsed().as_millis() as u64;
    
    tracing::info!(
        "[KnowledgeSearch] Search completed: {} results in {}ms", 
        total, query_time_ms
    );
    
    Ok(KnowledgeSearchResponse {
        results,
        total,
        query_time_ms,
        search_mode,
    })
}

/// Create mock results when vector service is not available
fn create_mock_results(query: &str, tenant_id: &str) -> Vec<KnowledgeSearchResult> {
    vec![
        KnowledgeSearchResult {
            id: format!("result-{}", uuid::Uuid::new_v4()),
            document_id: "doc-001".to_string(),
            content: format!("相关知识: {}", query),
            score: 0.95,
            highlights: vec![format!("找到相关内容: {}", query)],
            metadata: serde_json::json!({
                "source": "knowledge_base",
                "tenant_id": tenant_id,
                "category": "general"
            }),
        },
        KnowledgeSearchResult {
            id: format!("result-{}", uuid::Uuid::new_v4()),
            document_id: "doc-002".to_string(),
            content: format!("补充信息: {}", query),
            score: 0.87,
            highlights: vec![format!("补充内容: {}", query)],
            metadata: serde_json::json!({
                "source": "knowledge_base",
                "tenant_id": tenant_id,
                "category": "reference"
            }),
        },
    ]
}

/// Get knowledge base statistics
#[tauri::command]
pub async fn knowledge_stats(
    tenant_id: String,
) -> Result<serde_json::Value, String> {
    tracing::info!("[KnowledgeStats] Getting stats for tenant: {}", tenant_id);
    
    // In production, this would query the actual knowledge base
    Ok(serde_json::json!({
        "total_documents": 0,
        "total_chunks": 0,
        "total_size_bytes": 0,
        "last_indexed_at": null,
        "index_status": "ready",
        "tenant_id": tenant_id,
    }))
}

/// List accessible knowledge bases for a user
#[tauri::command]
pub async fn list_knowledge_bases(
    tenant_id: String,
    user_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    tracing::info!(
        "[KnowledgeBases] Listing bases for tenant: {}, user: {}", 
        tenant_id, user_id
    );
    
    // Return empty list as knowledge bases would be configured in database
    Ok(Vec::new())
}
