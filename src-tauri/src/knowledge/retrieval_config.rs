//! RAG retrieval configuration
//!
//! Configuration for retrieval operations including search method, weights, and filters.

use crate::knowledge::metadata_filter::MetadataFilter;
use serde::{Deserialize, Serialize};

/// Search method
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SearchMethod {
    /// Semantic search using vector similarity
    Semantic,
    /// Full-text search using BM25
    FullText,
    /// Hybrid search combining semantic and full-text
    Hybrid,
}

impl Default for SearchMethod {
    fn default() -> Self {
        Self::Hybrid
    }
}

/// Retrieval configuration for RAG operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalConfig {
    /// Search method to use
    pub search_method: SearchMethod,
    /// Number of results to return
    pub top_k: usize,
    /// Minimum relevance score threshold (0.0 to 1.0)
    pub score_threshold: f32,
    /// Vector search weight in hybrid mode (0.0 to 1.0)
    pub vector_weight: f32,
    /// BM25 weight in hybrid mode (0.0 to 1.0)
    pub bm25_weight: f32,
    /// RRF parameter for hybrid search (default: 60)
    pub rrf_k: usize,
    /// Diversity penalty for reranking (0.0 to 1.0)
    pub diversity: f32,
    /// Metadata filter for filtering results
    pub filter: Option<MetadataFilter>,
    /// Reranking enabled
    pub rerank_enabled: bool,
    /// Reranking model (optional)
    pub rerank_model: Option<String>,
    /// Reranking mode
    pub reranking_mode: RerankingMode,
}

impl Default for RetrievalConfig {
    fn default() -> Self {
        Self {
            search_method: SearchMethod::Hybrid,
            top_k: 10,
            score_threshold: 0.0,
            vector_weight: 0.7,
            bm25_weight: 0.3,
            rrf_k: 60,
            diversity: 0.0,
            filter: None,
            rerank_enabled: false,
            rerank_model: None,
            reranking_mode: RerankingMode::WeightedScore,
        }
    }
}

/// Reranking mode
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RerankingMode {
    /// Weighted score combination
    WeightedScore,
    /// Reciprocal Rank Fusion
    ReciprocalRankFusion,
    /// Rerank model (if available)
    RerankModel,
}

impl Default for RerankingMode {
    fn default() -> Self {
        Self::WeightedScore
    }
}

/// Retrieval result with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalResult {
    /// Unique result ID
    pub id: String,
    /// Document/chunk ID
    pub document_id: String,
    /// Content snippet
    pub content: String,
    /// Relevance score
    pub score: f32,
    /// Highlighted snippets
    pub highlights: Vec<String>,
    /// Source metadata
    pub metadata: serde_json::Value,
}

impl RetrievalConfig {
    /// Create a new config with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Set search method
    pub fn with_search_method(mut self, method: SearchMethod) -> Self {
        self.search_method = method;
        self
    }

    /// Set top-k
    pub fn with_top_k(mut self, k: usize) -> Self {
        self.top_k = k;
        self
    }

    /// Set score threshold
    pub fn with_score_threshold(mut self, threshold: f32) -> Self {
        self.score_threshold = threshold;
        self
    }

    /// Set hybrid weights
    pub fn with_weights(mut self, vector_weight: f32, bm25_weight: f32) -> Self {
        self.vector_weight = vector_weight;
        self.bm25_weight = bm25_weight;
        self
    }

    /// Set metadata filter
    pub fn with_filter(mut self, filter: MetadataFilter) -> Self {
        self.filter = Some(filter);
        self
    }

    /// Enable reranking
    pub fn with_reranking(mut self, enabled: bool) -> Self {
        self.rerank_enabled = enabled;
        self
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<(), RetrievalConfigError> {
        if self.vector_weight < 0.0 || self.vector_weight > 1.0 {
            return Err(RetrievalConfigError::InvalidWeight {
                name: "vector_weight".to_string(),
                value: self.vector_weight,
            });
        }

        if self.bm25_weight < 0.0 || self.bm25_weight > 1.0 {
            return Err(RetrievalConfigError::InvalidWeight {
                name: "bm25_weight".to_string(),
                value: self.bm25_weight,
            });
        }

        if self.rrf_k == 0 {
            return Err(RetrievalConfigError::InvalidRrfK { value: 0 });
        }

        if self.score_threshold < 0.0 || self.score_threshold > 1.0 {
            return Err(RetrievalConfigError::InvalidThreshold {
                value: self.score_threshold,
            });
        }

        if self.diversity < 0.0 || self.diversity > 1.0 {
            return Err(RetrievalConfigError::InvalidDiversity {
                value: self.diversity,
            });
        }

        Ok(())
    }
}

/// Retrieval configuration errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RetrievalConfigError {
    InvalidWeight { name: String, value: f32 },
    InvalidRrfK { value: usize },
    InvalidThreshold { value: f32 },
    InvalidDiversity { value: f32 },
}

impl std::fmt::Display for RetrievalConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RetrievalConfigError::InvalidWeight { name, value } => {
                write!(f, "Invalid weight '{}': {}", name, value)
            }
            RetrievalConfigError::InvalidRrfK { value } => {
                write!(f, "Invalid RRF k: {}", value)
            }
            RetrievalConfigError::InvalidThreshold { value } => {
                write!(f, "Invalid score threshold: {}", value)
            }
            RetrievalConfigError::InvalidDiversity { value } => {
                write!(f, "Invalid diversity: {}", value)
            }
        }
    }
}

impl std::error::Error for RetrievalConfigError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = RetrievalConfig::default();
        assert_eq!(config.search_method, SearchMethod::Hybrid);
        assert_eq!(config.top_k, 10);
        assert_eq!(config.vector_weight, 0.7);
        assert_eq!(config.bm25_weight, 0.3);
    }

    #[test]
    fn test_config_builder() {
        let config = RetrievalConfig::new()
            .with_search_method(SearchMethod::Semantic)
            .with_top_k(20)
            .with_score_threshold(0.6);

        assert_eq!(config.search_method, SearchMethod::Semantic);
        assert_eq!(config.top_k, 20);
        assert_eq!(config.score_threshold, 0.6);
    }

    #[test]
    fn test_config_validation() {
        let config = RetrievalConfig::default();
        assert!(config.validate().is_ok());

        let invalid_config = RetrievalConfig {
            vector_weight: 1.5,
            ..Default::default()
        };
        assert!(invalid_config.validate().is_err());
    }

    #[test]
    fn test_filter_config() {
        let filter = MetadataFilter::eq("department_id", "sales");
        let config = RetrievalConfig::new()
            .with_filter(filter);

        assert!(config.filter.is_some());
    }
}
