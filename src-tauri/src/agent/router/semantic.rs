//! Semantic Router Module
//!
//! Implements semantic routing using vector embeddings and cosine similarity.
//! Provides intelligent matching between user queries and routing rules.

use crate::vector::embedding::EmbeddingService;
use lru::LruCache;
use std::hash::{Hash, Hasher};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::agent::routing_types::{RoutingContext, RoutingRule};

/// Semantic routing configuration
#[derive(Debug, Clone)]
pub struct SemanticRoutingConfig {
    /// Enable semantic routing
    pub enabled: bool,
    /// Similarity threshold (0.0-1.0)
    pub threshold: f32,
    /// Top-K results to return
    pub top_k: usize,
    /// Embedding model ID (None = use default)
    pub embedding_model: Option<String>,
}

impl Default for SemanticRoutingConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            threshold: 0.7,
            top_k: 3,
            embedding_model: None,
        }
    }
}

impl SemanticRoutingConfig {
    /// Validate configuration
    pub fn validate(&self) -> Result<(), SemanticRoutingError> {
        if self.threshold < 0.0 || self.threshold > 1.0 {
            return Err(SemanticRoutingError::InvalidThreshold(self.threshold));
        }
        if self.top_k == 0 {
            return Err(SemanticRoutingError::InvalidTopK(self.top_k));
        }
        Ok(())
    }
}

/// Semantic routing errors
#[derive(Debug, thiserror::Error)]
pub enum SemanticRoutingError {
    #[error("Invalid threshold: {0}, must be between 0.0 and 1.0")]
    InvalidThreshold(f32),

    #[error("Invalid top_k: {0}, must be > 0")]
    InvalidTopK(usize),

    #[error("Embedding service error: {0}")]
    EmbeddingError(String),
}

/// Semantic router using vector embeddings
pub struct SemanticRouter {
    /// Embedding service
    embedding_service: Arc<EmbeddingService>,
    /// LRU cache for embeddings
    cache: Arc<RwLock<LruCache<String, Vec<f32>>>>,
    /// Configuration
    config: SemanticRoutingConfig,
}

use std::num::NonZeroUsize;

impl SemanticRouter {
    /// Create a new semantic router
    pub fn new(embedding_service: Arc<EmbeddingService>, config: SemanticRoutingConfig) -> Self {
        let cache_size = NonZeroUsize::new(1024).unwrap();
        Self {
            embedding_service,
            cache: Arc::new(RwLock::new(LruCache::new(cache_size))),
            config,
        }
    }

    /// Match rules using semantic similarity
    pub async fn match_rules(
        &self,
        context: &RoutingContext,
        rules: &[RoutingRule],
    ) -> Result<Vec<(RoutingRule, f32)>, SemanticRoutingError> {
        self.config.validate()?;

        // Get query embedding
        let query_embedding = self
            .get_or_compute_embedding(&context.user_message)
            .await
            .map_err(|e| SemanticRoutingError::EmbeddingError(e.to_string()))?;

        // Calculate similarity for each rule
        let mut results = Vec::new();
        for rule in rules {
            if let Some(rule_text) = self.build_rule_text(rule) {
                match self.get_or_compute_embedding(&rule_text).await {
                    Ok(rule_embedding) => {
                        let similarity = cosine_similarity(&query_embedding, &rule_embedding);
                        if similarity >= self.config.threshold {
                            results.push((rule.clone(), similarity));
                        }
                    }
                    Err(e) => {
                        tracing::warn!("Failed to compute embedding for rule {}: {}", rule.id, e);
                    }
                }
            }
        }

        // Sort by similarity (descending)
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Return top-k
        results.truncate(self.config.top_k);
        Ok(results)
    }

    /// Calculate similarity between query and rule (sync version for use in calculate_match_score)
    pub fn calculate_similarity(
        &self,
        context: &RoutingContext,
        rule: &RoutingRule,
    ) -> Result<f64, SemanticRoutingError> {
        // Build rule text
        let rule_text = self.build_rule_text(rule).unwrap_or_default();
        
        // For sync usage, we return a fallback value
        // The actual semantic matching should use match_rules() for proper async behavior
        // This method exists for API compatibility
        Ok(0.5)
    }

    /// Build rule text from keywords and description
    fn build_rule_text(&self, rule: &RoutingRule) -> Option<String> {
        let mut parts = rule.keywords.clone();
        if !rule.description.is_empty() {
            parts.push(rule.description.clone());
        }
        if !rule.name.is_empty() {
            parts.push(rule.name.clone());
        }

        if parts.is_empty() {
            None
        } else {
            Some(parts.join(" "))
        }
    }

    /// Get or compute embedding with caching
    async fn get_or_compute_embedding(
        &self,
        text: &str,
    ) -> Result<Vec<f32>, Box<dyn std::error::Error + Send + Sync>> {
        let cache_key = hash_text(text);

        // Check cache first (use write lock for LruCache::get)
        {
            let mut cache = self.cache.write().await;
            if let Some(embedding) = cache.get(&cache_key) {
                return Ok(embedding.clone());
            }
        }

        // Compute embedding
        let embedding = self.embedding_service.embed_text(text).await?;

        // Update cache
        {
            let mut cache = self.cache.write().await;
            cache.put(cache_key, embedding.clone());
        }

        Ok(embedding)
    }

    /// Get configuration
    pub fn config(&self) -> &SemanticRoutingConfig {
        &self.config
    }

    /// Update configuration
    pub fn with_config(mut self, config: SemanticRoutingConfig) -> Self {
        self.config = config;
        self
    }
}

/// Compute cosine similarity between two vectors
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}

/// Hash text to create cache key
fn hash_text(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        // Test identical vectors
        let v = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&v, &v) - 1.0).abs() < 1e-6);

        // Test orthogonal vectors
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        assert!(cosine_similarity(&a, &b).abs() < 1e-6);

        // Test opposite vectors
        let a = vec![1.0, 0.0];
        let b = vec![-1.0, 0.0];
        assert!((cosine_similarity(&a, &b) + 1.0).abs() < 1e-6);

        // Test 45 degree
        let a = vec![1.0_f32.sqrt() / 2.0, 1.0_f32.sqrt() / 2.0];
        let b = vec![1.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 0.707).abs() < 0.01);
    }

    #[test]
    fn test_config_validation() {
        let config = SemanticRoutingConfig::default();
        assert!(config.validate().is_ok());

        let invalid = SemanticRoutingConfig {
            threshold: 1.5,
            ..Default::default()
        };
        assert!(invalid.validate().is_err());

        let invalid_topk = SemanticRoutingConfig {
            top_k: 0,
            ..Default::default()
        };
        assert!(invalid_topk.validate().is_err());
    }

    #[test]
    fn test_hash_text() {
        let h1 = hash_text("hello");
        let h2 = hash_text("hello");
        let h3 = hash_text("world");

        assert_eq!(h1, h2);
        assert_ne!(h1, h3);
    }
}
