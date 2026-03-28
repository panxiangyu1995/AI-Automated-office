//! Memory system configuration.

use serde::{Deserialize, Serialize};

use crate::vector::config::{EmbeddingConfig, HybridSearchConfig, VectorMode};

/// Memory system configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryConfig {
    /// Vector database mode
    pub vector_mode: VectorMode,
    /// Embedding configuration
    pub embedding: EmbeddingConfig,
    /// Hybrid search configuration
    pub hybrid_search: HybridSearchConfig,
    /// Memory retention policy
    pub retention: RetentionPolicy,
    /// Sync configuration
    pub sync: SyncConfig,
}

impl Default for MemoryConfig {
    fn default() -> Self {
        Self {
            vector_mode: VectorMode::Local,
            embedding: EmbeddingConfig::default(),
            hybrid_search: HybridSearchConfig::default(),
            retention: RetentionPolicy::default(),
            sync: SyncConfig::default(),
        }
    }
}

/// Memory retention policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    /// Personal memory retention days
    pub personal_retention_days: u32,
    /// Enterprise knowledge retention days
    pub enterprise_retention_days: u32,
    /// Maximum memory items per user
    pub max_items_per_user: u32,
    /// Auto compression threshold
    pub auto_compress_threshold: u32,
}

impl Default for RetentionPolicy {
    fn default() -> Self {
        Self {
            personal_retention_days: 90,
            enterprise_retention_days: 365,
            max_items_per_user: 10000,
            auto_compress_threshold: 5000,
        }
    }
}

/// Sync configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    /// Whether sync is enabled
    pub enabled: bool,
    /// Sync interval in seconds
    pub interval_secs: u64,
    /// Conflict resolution strategy
    pub conflict_strategy: ConflictStrategy,
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            interval_secs: 300,
            conflict_strategy: ConflictStrategy::LatestWins,
        }
    }
}

/// Conflict resolution strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConflictStrategy {
    LocalWins,
    RemoteWins,
    LatestWins,
    Merge,
}

impl Default for ConflictStrategy {
    fn default() -> Self {
        ConflictStrategy::LatestWins
    }
}

/// Memory error types
#[derive(Debug, thiserror::Error)]
pub enum MemoryError {
    #[error("memory not found: {0}")]
    NotFound(String),
    #[error("memory operation failed: {0}")]
    OperationFailed(String),
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("storage error: {0}")]
    Storage(String),
    #[error("vector store error: {0}")]
    VectorStore(String),
    #[error("invalid configuration: {0}")]
    ConfigError(String),
}

impl From<anyhow::Error> for MemoryError {
    fn from(e: anyhow::Error) -> Self {
        MemoryError::OperationFailed(e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = MemoryConfig::default();
        assert_eq!(config.vector_mode, VectorMode::Local);
        assert_eq!(config.retention.personal_retention_days, 90);
    }
}
