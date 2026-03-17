use crate::vector::config::HybridSearchConfig;
use crate::vector::store::{SearchResult, VectorQuery, VectorStore};
use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;

#[async_trait]
pub trait Bm25Store: Send + Sync {
    async fn bm25_search(&self, query: &str, k: usize) -> Result<Vec<SearchResult>>;
}

pub struct HybridSearchEngine<S, B>
where
    S: VectorStore,
    B: Bm25Store,
{
    vector_store: S,
    bm25_store: B,
    config: HybridSearchConfig,
}

impl<S, B> HybridSearchEngine<S, B>
where
    S: VectorStore,
    B: Bm25Store,
{
    pub fn new(vector_store: S, bm25_store: B, config: HybridSearchConfig) -> Self {
        Self {
            vector_store,
            bm25_store,
            config,
        }
    }

    pub async fn search(&self, query_text: &str, query: VectorQuery) -> Result<Vec<SearchResult>> {
        let vector_results = self.vector_store.search(query).await?;
        let bm25_results = self
            .bm25_store
            .bm25_search(query_text, self.config.max_results)
            .await?;
        let mut fused = reciprocal_rank_fusion(
            vector_results,
            bm25_results,
            self.config.vector_weight,
            self.config.bm25_weight,
            self.config.rrf_k,
        );
        fused.retain(|r| r.score >= self.config.min_score);
        if fused.len() > self.config.max_results {
            fused.truncate(self.config.max_results);
        }
        Ok(fused)
    }
}

pub fn reciprocal_rank_fusion(
    vector_results: Vec<SearchResult>,
    bm25_results: Vec<SearchResult>,
    vector_weight: f32,
    bm25_weight: f32,
    k: usize,
) -> Vec<SearchResult> {
    let mut scores: HashMap<String, f32> = HashMap::new();
    let mut metadata_map: HashMap<String, serde_json::Value> = HashMap::new();

    for (rank, result) in vector_results.iter().enumerate() {
        let rrf_score = vector_weight / (k as f32 + rank as f32 + 1.0);
        *scores.entry(result.id.clone()).or_default() += rrf_score;
        metadata_map
            .entry(result.id.clone())
            .or_insert_with(|| result.metadata.clone());
    }

    for (rank, result) in bm25_results.iter().enumerate() {
        let rrf_score = bm25_weight / (k as f32 + rank as f32 + 1.0);
        *scores.entry(result.id.clone()).or_default() += rrf_score;
        metadata_map
            .entry(result.id.clone())
            .or_insert_with(|| result.metadata.clone());
    }

    let mut results: Vec<_> = scores
        .into_iter()
        .map(|(id, score)| SearchResult {
            metadata: metadata_map.remove(&id).unwrap_or_default(),
            id,
            score,
        })
        .collect();
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    results
}

#[cfg(test)]
mod tests {
    use super::reciprocal_rank_fusion;
    use crate::vector::store::SearchResult;

    #[test]
    fn test_rrf_prefers_higher_rank() {
        let vector_results = vec![
            SearchResult {
                id: "a".to_string(),
                score: 0.9,
                metadata: serde_json::json!({}),
            },
            SearchResult {
                id: "b".to_string(),
                score: 0.8,
                metadata: serde_json::json!({}),
            },
        ];
        let bm25_results = vec![
            SearchResult {
                id: "b".to_string(),
                score: 0.7,
                metadata: serde_json::json!({}),
            },
            SearchResult {
                id: "c".to_string(),
                score: 0.6,
                metadata: serde_json::json!({}),
            },
        ];
        let results = reciprocal_rank_fusion(vector_results, bm25_results, 0.6, 0.4, 60);
        assert_eq!(results.first().unwrap().id, "b");
    }
}
