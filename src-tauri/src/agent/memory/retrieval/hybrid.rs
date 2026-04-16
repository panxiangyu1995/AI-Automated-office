//! Hybrid retrieval engine combining vector and BM25 search.

use std::sync::Arc;
use std::time::Instant;

use crate::vector::config::HybridSearchConfig;
use crate::vector::store::{SearchResult, VectorQuery, VectorStore};
use crate::vector::embedding::EmbeddingService;
use crate::vector::hybrid::reciprocal_rank_fusion;

use super::super::types::{MemoryItem, MemoryQuery, MemorySearchResult, HybridSearchResult};
use super::super::config::MemoryError;

/// Hybrid search engine for memory retrieval
pub struct HybridRetrievalEngine<V: VectorStore> {
    vector_store: Arc<V>,
    embedding_service: Arc<EmbeddingService>,
    config: HybridSearchConfig,
}

impl<V: VectorStore> HybridRetrievalEngine<V> {
    pub fn new(
        vector_store: Arc<V>,
        embedding_service: Arc<EmbeddingService>,
        config: HybridSearchConfig,
    ) -> Self {
        Self {
            vector_store,
            embedding_service,
            config,
        }
    }

    /// Perform hybrid search combining vector and keyword search
    pub async fn search(
        &self,
        query: &MemoryQuery,
    ) -> Result<HybridSearchResult, MemoryError> {
        let start = Instant::now();

        // If query is empty, return empty results
        if query.query.is_empty() {
            return Ok(HybridSearchResult {
                items: Vec::new(),
                total: 0,
                vector_time_ms: 0,
                bm25_time_ms: 0,
                fusion_time_ms: 0,
            });
        }

        // 1. Vector search
        let vector_start = Instant::now();
        let vector_results = self.vector_search(query).await?;
        let vector_time_ms = vector_start.elapsed().as_millis() as u64;

        // 2. BM25-style keyword search (simplified, in production use actual BM25)
        let bm25_start = Instant::now();
        let bm25_results = self.keyword_search(query).await?;
        let bm25_time_ms = bm25_start.elapsed().as_millis() as u64;

        // 3. RRF fusion
        let fusion_start = Instant::now();
        let fused = self.fuse_results(vector_results, bm25_results);
        let fusion_time_ms = fusion_start.elapsed().as_millis() as u64;

        let _total_time_ms = start.elapsed().as_millis() as u64;

        Ok(HybridSearchResult {
            items: fused,
            total: 0, // Would be total without limit
            vector_time_ms,
            bm25_time_ms,
            fusion_time_ms,
        })
    }

    /// Vector similarity search
    async fn vector_search(
        &self,
        query: &MemoryQuery,
    ) -> Result<Vec<SearchResult>, MemoryError> {
        // Generate embedding for query
        let embedding = self
            .embedding_service
            .embed_text(&query.query)
            .await
            .map_err(|e| MemoryError::VectorStore(e.to_string()))?;

        let vector_query = VectorQuery {
            vector: embedding,
            k: query.k,
            filter: None,
            include_metadata: true,
        };

        self.vector_store
            .search(vector_query)
            .await
            .map_err(|e| MemoryError::VectorStore(e.to_string()))
    }

    /// Keyword-based search (simplified BM25-like)
    async fn keyword_search(
        &self,
        query: &MemoryQuery,
    ) -> Result<Vec<SearchResult>, MemoryError> {
        // In production, this would use actual BM25 index
        // For now, we use a simple term matching approach
        let _keywords: Vec<&str> = query.query.split_whitespace().collect();

        // Return empty results as this would need access to the storage
        // In a full implementation, this would query the BM25 index
        Ok(Vec::new())
    }

    /// Fuse vector and BM25 results using RRF
    fn fuse_results(
        &self,
        vector_results: Vec<SearchResult>,
        bm25_results: Vec<SearchResult>,
    ) -> Vec<MemorySearchResult> {
        let fused = reciprocal_rank_fusion(
            vector_results,
            bm25_results,
            self.config.vector_weight,
            self.config.bm25_weight,
            self.config.rrf_k,
        );

        fused
            .into_iter()
            .map(|result| MemorySearchResult {
                item: MemoryItem::default(), // Would be fetched from storage
                score: result.score as f64,
                vector_score: Some(result.score as f64),
                bm25_score: None,
                highlights: Vec::new(),
            })
            .collect()
    }
}

/// Progressive disclosure filter
pub struct ProgressiveDisclosure {
    token_budget: usize,
}

impl ProgressiveDisclosure {
    pub fn new(token_budget: usize) -> Self {
        Self { token_budget }
    }

    /// Apply progressive disclosure to search results
    pub fn apply(
        &self,
        results: Vec<MemorySearchResult>,
    ) -> Vec<MemorySearchResult> {
        let mut disclosed = Vec::new();
        let mut total_tokens = 0;

        for result in results {
            let item_tokens = result.item.value.split_whitespace().count();
            if total_tokens + item_tokens <= self.token_budget {
                disclosed.push(result);
                total_tokens += item_tokens;
            } else {
                break;
            }
        }

        disclosed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_progressive_disclosure() {
        let disclosure = ProgressiveDisclosure::new(100);

        let mut results = Vec::new();
        for i in 0..10 {
            results.push(MemorySearchResult {
                item: MemoryItem {
                    id: format!("item-{}", i),
                    value: "word ".repeat(20), // 20 tokens
                    ..Default::default()
                },
                score: 1.0 - (i as f64 * 0.1),
                vector_score: Some(1.0 - (i as f64 * 0.1)),
                bm25_score: None,
                highlights: Vec::new(),
            });
        }

        let disclosed = disclosure.apply(results);

        // With 100 token budget and 20 tokens per item, should get 5 items
        assert!(disclosed.len() <= 5);
    }
}
