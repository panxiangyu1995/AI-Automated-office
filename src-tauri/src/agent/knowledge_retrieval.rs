//! Knowledge Retrieval Module
//!
//! This module implements:
//! - Backend retrieval service for vector and storage knowledge sources
//! - Scope filters for tenant, department, and session
//! - Caching, timeout, and degradation behavior
//! - Integration with PromptBuilder and runtime context
//!
//! Story 53.4 - Knowledge retrieval integration

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

use crate::vector::{VectorStore, VectorQuery, SearchResult};

/// Knowledge source type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum KnowledgeSourceType {
    Document,
    Database,
    Api,
    VectorStore,
    RuleSet,
    Template,
    KnowledgeGraph,
}

/// Knowledge scope
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum KnowledgeScope {
    Tenant,
    Department,
    User,
    Session,
    Global,
}

/// Retrieval status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RetrievalStatus {
    Pending,
    Querying,
    Success,
    Partial,
    Failed,
    Cancelled,
}

/// Knowledge source reference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSourceRef {
    pub source_id: String,
    pub source_type: KnowledgeSourceType,
    pub name: String,
    pub scope: KnowledgeScope,
    pub tenant_id: Option<String>,
    pub department_id: Option<String>,
    pub enabled: bool,
    pub priority: u32,
    pub metadata: Option<serde_json::Value>,
}

/// Retrieval filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalFilter {
    pub field: String,
    pub operator: String,
    pub value: serde_json::Value,
}

/// Retrieval options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalOptions {
    pub max_results: usize,
    pub min_score: f32,
    pub include_metadata: bool,
    pub timeout_ms: u64,
    pub filters: Vec<RetrievalFilter>,
    pub ranking_strategy: String,
}

impl Default for RetrievalOptions {
    fn default() -> Self {
        Self {
            max_results: 10,
            min_score: 0.5,
            include_metadata: true,
            timeout_ms: 30000,
            filters: Vec::new(),
            ranking_strategy: "relevance".to_string(),
        }
    }
}

/// Retrieved item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievedItem {
    pub item_id: String,
    pub source_id: String,
    pub source_type: KnowledgeSourceType,
    pub content: String,
    pub score: f32,
    pub metadata: Option<serde_json::Value>,
    pub highlights: Option<Vec<Highlight>>,
}

/// Highlight in retrieved content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Highlight {
    pub field: String,
    pub snippet: String,
    pub positions: Vec<Position>,
}

/// Position in text
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub start: usize,
    pub end: usize,
}

/// Retrieval request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalRequest {
    pub request_id: String,
    pub query: String,
    pub scope: KnowledgeScope,
    pub tenant_id: String,
    pub department_id: Option<String>,
    pub user_id: Option<String>,
    pub session_id: Option<String>,
    pub sources: Vec<KnowledgeSourceRef>,
    pub options: RetrievalOptions,
    pub created_at: i64,
    pub status: RetrievalStatus,
}

/// Retrieval result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalResult {
    pub request_id: String,
    pub status: RetrievalStatus,
    pub items: Vec<RetrievedItem>,
    pub total_count: usize,
    pub retrieved_count: usize,
    pub query_time_ms: u64,
    pub sources_queried: Vec<String>,
    pub sources_failed: Vec<String>,
    pub error: Option<RetrievalError>,
    pub created_at: i64,
    pub expires_at: Option<i64>,
}

/// Retrieval error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalError {
    pub code: String,
    pub message: String,
    pub source_id: Option<String>,
}

/// Knowledge context injection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeContextInjection {
    pub injection_id: String,
    pub request_id: String,
    pub injected_at: i64,
    pub context_type: String,
    pub items_injected: Vec<String>,
    pub token_count: usize,
}

/// Cache entry
#[derive(Debug, Clone)]
struct CacheEntry {
    result: RetrievalResult,
    cached_at: Instant,
    expires_at: Option<Instant>,
}

impl CacheEntry {
    fn is_expired(&self) -> bool {
        if let Some(expires) = self.expires_at {
            Instant::now() > expires
        } else {
            false
        }
    }
}

/// Knowledge retrieval cache
#[derive(Default)]
pub struct RetrievalCache {
    entries: RwLock<HashMap<String, CacheEntry>>,
    max_entries: usize,
    default_ttl: Duration,
}

impl RetrievalCache {
    fn new() -> Self {
        Self {
            entries: RwLock::new(HashMap::new()),
            max_entries: 100,
            default_ttl: Duration::from_secs(300), // 5 minutes
        }
    }

    async fn get(&self, key: &str) -> Option<RetrievalResult> {
        let entries = self.entries.read().await;
        if let Some(entry) = entries.get(key) {
            if !entry.is_expired() {
                return Some(entry.result.clone());
            }
        }
        None
    }

    async fn remove_expired(&self) {
        let mut entries = self.entries.write().await;
        entries.retain(|_, e| !e.is_expired());
    }

    async fn set(&self, key: String, result: RetrievalResult, ttl_secs: Option<u64>) {
        let mut entries = self.entries.write().await;

        // Evict oldest if at capacity
        if entries.len() >= self.max_entries {
            if let Some(oldest_key) = entries.iter()
                .min_by_key(|(_, e)| e.cached_at)
                .map(|(k, _)| k.clone())
            {
                entries.remove(&oldest_key);
            }
        }

        let ttl = Duration::from_secs(ttl_secs.unwrap_or(300));
        let expires_at = Some(Instant::now() + ttl);

        entries.insert(key, CacheEntry {
            result,
            cached_at: Instant::now(),
            expires_at,
        });
    }

    async fn invalidate(&self, key: &str) {
        let mut entries = self.entries.write().await;
        entries.remove(key);
    }

    async fn clear(&self) {
        let mut entries = self.entries.write().await;
        entries.clear();
    }
}

/// Generate a unique request ID
fn generate_request_id() -> String {
    format!("req_{}", uuid::Uuid::new_v4())
}

/// Generate a unique item ID
fn generate_item_id() -> String {
    format!("item_{}", uuid::Uuid::new_v4())
}

/// Generate a unique injection ID
fn generate_injection_id() -> String {
    format!("inj_{}", uuid::Uuid::new_v4())
}

/// Filter sources by scope
fn filter_sources_by_scope(
    sources: &[KnowledgeSourceRef],
    tenant_id: &str,
    department_id: Option<&str>,
) -> Vec<KnowledgeSourceRef> {
    sources
        .iter()
        .filter(|source| {
            if !source.enabled {
                return false;
            }

            match source.scope {
                KnowledgeScope::Global => true,
                KnowledgeScope::Tenant => {
                    source.tenant_id.as_deref() == Some(tenant_id) || source.tenant_id.is_none()
                }
                KnowledgeScope::Department => {
                    source.tenant_id.as_deref() == Some(tenant_id)
                    && (source.department_id.as_deref() == department_id
                        || source.department_id.is_none())
                }
                KnowledgeScope::User => source.tenant_id.as_deref() == Some(tenant_id),
                KnowledgeScope::Session => source.tenant_id.as_deref() == Some(tenant_id),
            }
        })
        .cloned()
        .collect()
}

/// Sort sources by priority (higher first)
fn sort_sources_by_priority(sources: Vec<KnowledgeSourceRef>) -> Vec<KnowledgeSourceRef> {
    let mut sorted = sources;
    sorted.sort_by(|a, b| b.priority.cmp(&a.priority));
    sorted
}

/// Trait for knowledge retrieval operations
#[async_trait]
pub trait KnowledgeRetrieval: Send + Sync {
    async fn retrieve(&self, request: &RetrievalRequest) -> Result<RetrievalResult>;
    async fn retrieve_with_cache(&self, request: &RetrievalRequest, use_cache: bool) -> Result<RetrievalResult>;
    async fn inject_into_context(&self, request: &RetrievalRequest, context_type: &str) -> Result<KnowledgeContextInjection>;
}

/// Knowledge retrieval service implementation
pub struct KnowledgeRetrievalService {
    vector_store: Option<Arc<dyn VectorStore>>,
    cache: RetrievalCache,
    default_timeout: Duration,
}

impl KnowledgeRetrievalService {
    pub fn new() -> Self {
        Self {
            vector_store: None,
            cache: RetrievalCache::new(),
            default_timeout: Duration::from_secs(30),
        }
    }

    pub fn with_vector_store(mut self, store: Arc<dyn VectorStore>) -> Self {
        self.vector_store = Some(store);
        self
    }

    pub fn with_timeout(mut self, timeout_secs: u64) -> Self {
        self.default_timeout = Duration::from_secs(timeout_secs);
        self
    }

    /// Generate cache key from request
    fn cache_key(&self, request: &RetrievalRequest) -> String {
        let source_ids: Vec<_> = request.sources.iter().map(|s| s.source_id.clone()).collect();
        format!(
            "{}:{}:{}:{:?}",
            request.query,
            request.tenant_id,
            source_ids.join(","),
            request.scope
        )
    }

    /// Query vector store for results
    async fn query_vector_store(
        &self,
        query: &str,
        sources: &[KnowledgeSourceRef],
        options: &RetrievalOptions,
    ) -> Result<Vec<RetrievedItem>> {
        let vector_store = self.vector_store
            .as_ref()
            .ok_or_else(|| anyhow!("vector store not configured"))?;

        // Generate query embedding (simplified - in production would use actual embedding)
        let query_vector = self.generate_query_embedding(query);

        let mut all_items = Vec::new();

        for source in sources.iter().filter(|s| s.source_type == KnowledgeSourceType::VectorStore) {
            let filter = self.build_filter(source, options);

            let vector_query = VectorQuery {
                vector: query_vector.clone(),
                k: options.max_results,
                filter,
                include_metadata: options.include_metadata,
            };

            match vector_store.search(vector_query).await {
                Ok(results) => {
                    for result in results {
                        if result.score >= options.min_score {
                            all_items.push(self.search_result_to_item(&result, source));
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!("vector search failed for source {}: {}", source.source_id, e);
                }
            }
        }

        // Sort by score descending
        all_items.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

        // Limit results
        all_items.truncate(options.max_results);

        Ok(all_items)
    }

    /// Generate query embedding (placeholder - would use actual embedding model)
    fn generate_query_embedding(&self, query: &str) -> Vec<f32> {
        // Simple hash-based embedding for demo - in production use actual embedding model
        let mut embedding = vec![0.0f32; 128];
        for (i, c) in query.chars().take(128).enumerate() {
            embedding[i] = ((c as usize) as f32 / 128.0).powi(2);
        }
        let len = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if len > 0.0 {
            for v in &mut embedding {
                *v /= len;
            }
        }
        embedding
    }

    /// Build filter string from source and options
    fn build_filter(&self, source: &KnowledgeSourceRef, _options: &RetrievalOptions) -> Option<String> {
        let mut parts = Vec::new();

        if let Some(ref tenant_id) = source.tenant_id {
            parts.push(format!("tenant_id = '{}'", tenant_id));
        }
        if let Some(ref dept_id) = source.department_id {
            parts.push(format!("department_id = '{}'", dept_id));
        }

        if parts.is_empty() {
            None
        } else {
            Some(parts.join(" AND "))
        }
    }

    /// Convert search result to retrieved item
    fn search_result_to_item(&self, result: &SearchResult, source: &KnowledgeSourceRef) -> RetrievedItem {
        RetrievedItem {
            item_id: generate_item_id(),
            source_id: source.source_id.clone(),
            source_type: source.source_type.clone(),
            content: result.metadata
                .get("content")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            score: result.score,
            metadata: Some(result.metadata.clone()),
            highlights: None,
        }
    }

    /// Execute retrieval with timeout
    async fn execute_with_timeout<F, T>(future: F, timeout_ms: u64) -> Result<T>
    where
        F: std::future::Future<Output = T>,
    {
        tokio::time::timeout(Duration::from_millis(timeout_ms), future)
            .await
            .map_err(|_| anyhow!("retrieval timed out"))
    }

    /// Apply degradation behavior on failure
    fn degrade_result(&self, request: &RetrievalRequest, error: &str) -> RetrievalResult {
        RetrievalResult {
            request_id: request.request_id.clone(),
            status: RetrievalStatus::Partial,
            items: Vec::new(),
            total_count: 0,
            retrieved_count: 0,
            query_time_ms: 0,
            sources_queried: Vec::new(),
            sources_failed: request.sources.iter().map(|s| s.source_id.clone()).collect(),
            error: Some(RetrievalError {
                code: "DEGRADED".to_string(),
                message: error.to_string(),
                source_id: None,
            }),
            created_at: Utc::now().timestamp(),
            expires_at: None,
        }
    }
}

impl Default for KnowledgeRetrievalService {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl KnowledgeRetrieval for KnowledgeRetrievalService {
    async fn retrieve(&self, request: &RetrievalRequest) -> Result<RetrievalResult> {
        self.retrieve_with_cache(request, false).await
    }

    async fn retrieve_with_cache(&self, request: &RetrievalRequest, use_cache: bool) -> Result<RetrievalResult> {
        let start_time = Instant::now();

        // Check cache if enabled
        if use_cache {
            let cache_key = self.cache_key(request);
            if let Some(cached) = self.cache.get(&cache_key).await {
                return Ok(cached);
            }
        }

        // Filter and sort sources by scope
        let filtered_sources = filter_sources_by_scope(
            &request.sources,
            &request.tenant_id,
            request.department_id.as_deref(),
        );
        let sorted_sources = sort_sources_by_priority(filtered_sources);

        if sorted_sources.is_empty() {
            let result = RetrievalResult {
                request_id: request.request_id.clone(),
                status: RetrievalStatus::Success,
                items: Vec::new(),
                total_count: 0,
                retrieved_count: 0,
                query_time_ms: start_time.elapsed().as_millis() as u64,
                sources_queried: Vec::new(),
                sources_failed: Vec::new(),
                error: None,
                created_at: Utc::now().timestamp(),
                expires_at: None,
            };

            if use_cache {
                self.cache.set(self.cache_key(request), result.clone(), None).await;
            }
            return Ok(result);
        }

        // Execute retrieval with timeout
        let timeout_ms = request.options.timeout_ms;

        let retrieve_future = async {
            let mut all_items = Vec::new();
            let mut sources_failed = Vec::new();

            // Query vector store sources
            let vector_sources: Vec<_> = sorted_sources
                .iter()
                .filter(|s| s.source_type == KnowledgeSourceType::VectorStore)
                .cloned()
                .collect();

            if !vector_sources.is_empty() {
                match self.query_vector_store(&request.query, &vector_sources, &request.options).await {
                    Ok(items) => all_items.extend(items),
                    Err(e) => {
                        sources_failed.extend(vector_sources.iter().map(|s| s.source_id.clone()));
                        tracing::warn!("vector query failed: {}", e);
                    }
                }
            }

            // For non-vector sources, we would add additional retrieval logic here
            // (Database, API, RuleSet, Template, KnowledgeGraph)
            // For now, these return empty results

            let query_time_ms = start_time.elapsed().as_millis() as u64;
            let items_count = all_items.len();

            let status = if sources_failed.len() == sorted_sources.len() {
                RetrievalStatus::Failed
            } else if !sources_failed.is_empty() {
                RetrievalStatus::Partial
            } else {
                RetrievalStatus::Success
            };

            RetrievalResult {
                request_id: request.request_id.clone(),
                status,
                items: all_items,
                total_count: items_count,
                retrieved_count: items_count,
                query_time_ms,
                sources_queried: sorted_sources.iter().map(|s| s.source_id.clone()).collect(),
                sources_failed,
                error: None,
                created_at: Utc::now().timestamp(),
                expires_at: Some(Utc::now().timestamp() + 300), // 5 min expiry
            }
        };

        let result = match Self::execute_with_timeout(retrieve_future, timeout_ms).await {
            Ok(result) => result,
            Err(_) => self.degrade_result(request, "retrieval timed out"),
        };

        // Cache result if enabled
        if use_cache {
            self.cache.set(self.cache_key(request), result.clone(), None).await;
        }

        Ok(result)
    }

    async fn inject_into_context(&self, request: &RetrievalRequest, context_type: &str) -> Result<KnowledgeContextInjection> {
        let result = self.retrieve_with_cache(request, true).await?;

        let token_count = result.items.iter()
            .map(|item| item.content.len() / 4) // rough token estimate
            .sum::<usize>();

        Ok(KnowledgeContextInjection {
            injection_id: generate_injection_id(),
            request_id: request.request_id.clone(),
            injected_at: Utc::now().timestamp(),
            context_type: context_type.to_string(),
            items_injected: result.items.iter().map(|i| i.item_id.clone()).collect(),
            token_count,
        })
    }
}

/// Format retrieval result for planner context
pub fn format_for_planner_context(result: &RetrievalResult) -> String {
    if result.items.is_empty() {
        return String::new();
    }

    let summaries: Vec<_> = result.items.iter().map(|item| {
        let title = item.metadata
            .as_ref()
            .and_then(|m| m.get("title"))
            .and_then(|v| v.as_str())
            .unwrap_or("Untitled");
        let preview = if item.content.len() > 200 {
            format!("{}...", &item.content[..200])
        } else {
            item.content.clone()
        };
        format!("- {} (score: {:.2})\n  {}", title, item.score, preview)
    }).collect();

    format!("## Relevant Knowledge\n\n{}", summaries.join("\n\n"))
}

/// Format retrieval result for runtime context
pub fn format_for_runtime_context(result: &RetrievalResult) -> String {
    if result.items.is_empty() {
        return "No relevant knowledge found for this operation.".to_string();
    }

    let sections: Vec<_> = result.items.iter().enumerate().map(|(i, item)| {
        let source = format!("[{:?}:{}]", item.source_type, item.source_id);
        let title = item.metadata
            .as_ref()
            .and_then(|m| m.get("title"))
            .map(|v| format!(" - {}", v.as_str().unwrap_or("")))
            .unwrap_or_default();
        format!("### Result {} {}{}\n\n{}", i + 1, source, title, item.content)
    }).collect();

    format!("## Knowledge Retrieval Results\n\n{}", sections.join("\n\n"))
}

/// Format retrieval result for tool context
pub fn format_for_tool_context(result: &RetrievalResult, tool_name: Option<&str>) -> String {
    if result.items.is_empty() {
        return "No relevant knowledge found for this operation.".to_string();
    }

    let relevant_items: Vec<_> = result.items.iter()
        .filter(|item| item.score >= 0.5)
        .collect();

    if relevant_items.is_empty() {
        return "No relevant knowledge found for this operation.".to_string();
    }

    let details: Vec<_> = relevant_items.iter().map(|item| {
        let source = format!("{:?}:{}", item.source_type, item.source_id);
        format!("Source: {}\nRelevance: {:.0}%\nContent: {}",
            source, item.score * 100.0, item.content)
    }).collect();

    let header = tool_name
        .map(|n| format!("## Knowledge Context for {}", n))
        .unwrap_or_else(|| "## Knowledge Context".to_string());

    format!("{}\n\n{}", header, details.join("\n\n---\n\n"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_source(source_id: &str, scope: KnowledgeScope, tenant_id: Option<&str>) -> KnowledgeSourceRef {
        KnowledgeSourceRef {
            source_id: source_id.to_string(),
            source_type: KnowledgeSourceType::VectorStore,
            name: format!("Test Source {}", source_id),
            scope,
            tenant_id: tenant_id.map(|s| s.to_string()),
            department_id: None,
            enabled: true,
            priority: 1,
            metadata: None,
        }
    }

    #[test]
    fn test_filter_sources_by_scope_global() {
        let sources = vec![
            create_test_source("1", KnowledgeScope::Global, None),
            create_test_source("2", KnowledgeScope::Tenant, Some("tenant_a")),
            create_test_source("3", KnowledgeScope::Department, Some("tenant_a")),
        ];

        let filtered = filter_sources_by_scope(&sources, "tenant_a", Some("dept_1"));
        assert_eq!(filtered.len(), 3); // Global + Tenant + Department all match
    }

    #[test]
    fn test_filter_sources_by_scope_tenant() {
        let sources = vec![
            create_test_source("1", KnowledgeScope::Global, None),
            create_test_source("2", KnowledgeScope::Tenant, Some("tenant_a")),
            create_test_source("3", KnowledgeScope::Tenant, Some("tenant_b")),
        ];

        let filtered = filter_sources_by_scope(&sources, "tenant_a", None);
        assert_eq!(filtered.len(), 2); // Global + tenant_a
    }

    #[test]
    fn test_sort_sources_by_priority() {
        let mut sources = vec![
            create_test_source("1", KnowledgeScope::Global, None),
            create_test_source("2", KnowledgeScope::Global, None),
            create_test_source("3", KnowledgeScope::Global, None),
        ];
        sources[0].priority = 1;
        sources[1].priority = 3;
        sources[2].priority = 2;

        let sorted = sort_sources_by_priority(sources);
        assert_eq!(sorted[0].source_id, "2");
        assert_eq!(sorted[1].source_id, "3");
        assert_eq!(sorted[2].source_id, "1");
    }

    #[tokio::test]
    async fn test_retrieval_cache() {
        let cache = RetrievalCache::new();

        let result = RetrievalResult {
            request_id: "req_1".to_string(),
            status: RetrievalStatus::Success,
            items: vec![],
            total_count: 0,
            retrieved_count: 0,
            query_time_ms: 10,
            sources_queried: vec![],
            sources_failed: vec![],
            error: None,
            created_at: 0,
            expires_at: None,
        };

        // Set and get
        cache.set("key1".to_string(), result.clone(), Some(60)).await;
        let cached = cache.get("key1").await;
        assert!(cached.is_some());

        // Invalidate
        cache.invalidate("key1").await;
        let cached = cache.get("key1").await;
        assert!(cached.is_none());

        // Clear
        cache.set("key2".to_string(), result.clone(), None).await;
        cache.clear().await;
        let cached = cache.get("key2").await;
        assert!(cached.is_none());
    }
}
