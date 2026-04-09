//! Cache Statistics Tauri Commands
//!
//! Provides Tauri commands for cache statistics management:
//! - Get cache statistics
//! - Clear cache
//! - Cache warming control

use std::sync::Arc;
use tauri::State;

use crate::cache::{CacheMetrics, CacheStatsCollector};

/// Cache statistics state
#[derive(Clone)]
pub struct CacheStatsState {
    pub embedding_stats: Arc<CacheStatsCollector>,
    pub token_stats: Arc<CacheStatsCollector>,
    pub config_stats: Arc<CacheStatsCollector>,
}

impl Default for CacheStatsState {
    fn default() -> Self {
        Self::new()
    }
}

impl CacheStatsState {
    pub fn new() -> Self {
        Self {
            embedding_stats: Arc::new(CacheStatsCollector::new("embedding")),
            token_stats: Arc::new(CacheStatsCollector::new("token")),
            config_stats: Arc::new(CacheStatsCollector::new("config")),
        }
    }
}

/// Get embedding cache statistics
#[tauri::command]
pub async fn get_embedding_cache_stats(
    state: State<'_, CacheStatsState>,
) -> Result<CacheMetrics, String> {
    Ok(state.embedding_stats.get_metrics().await)
}

/// Get token cache statistics
#[tauri::command]
pub async fn get_token_cache_stats(
    state: State<'_, CacheStatsState>,
) -> Result<CacheMetrics, String> {
    Ok(state.token_stats.get_metrics().await)
}

/// Get config cache statistics
#[tauri::command]
pub async fn get_config_cache_stats(
    state: State<'_, CacheStatsState>,
) -> Result<CacheMetrics, String> {
    Ok(state.config_stats.get_metrics().await)
}

/// Get all cache statistics
#[tauri::command]
pub async fn get_all_cache_stats(
    state: State<'_, CacheStatsState>,
) -> Result<Vec<CacheMetrics>, String> {
    let embedding = state.embedding_stats.get_metrics().await;
    let token = state.token_stats.get_metrics().await;
    let config = state.config_stats.get_metrics().await;
    Ok(vec![embedding, token, config])
}

/// Clear all cache statistics
#[tauri::command]
pub async fn clear_cache_stats(
    state: State<'_, CacheStatsState>,
) -> Result<(), String> {
    state.embedding_stats.reset().await;
    state.token_stats.reset().await;
    state.config_stats.reset().await;
    Ok(())
}

/// Record cache hit
#[tauri::command]
pub async fn record_cache_hit(
    cache_type: String,
    state: State<'_, CacheStatsState>,
) -> Result<(), String> {
    match cache_type.as_str() {
        "embedding" => state.embedding_stats.record_hit().await,
        "token" => state.token_stats.record_hit().await,
        "config" => state.config_stats.record_hit().await,
        _ => return Err(format!("Unknown cache type: {}", cache_type)),
    }
    Ok(())
}

/// Record cache miss
#[tauri::command]
pub async fn record_cache_miss(
    cache_type: String,
    state: State<'_, CacheStatsState>,
) -> Result<(), String> {
    match cache_type.as_str() {
        "embedding" => state.embedding_stats.record_miss().await,
        "token" => state.token_stats.record_miss().await,
        "config" => state.config_stats.record_miss().await,
        _ => return Err(format!("Unknown cache type: {}", cache_type)),
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_cache_stats_state() {
        let state = CacheStatsState::new();

        state.embedding_stats.record_hit().await;
        state.embedding_stats.record_hit().await;
        state.embedding_stats.record_miss().await;

        let metrics = state.embedding_stats.get_metrics().await;
        assert_eq!(metrics.hits, 2);
        assert_eq!(metrics.misses, 1);
        assert_eq!(metrics.name, "embedding");
    }

    #[tokio::test]
    async fn test_record_hit() {
        let collector = CacheStatsCollector::new("test");
        collector.record_hit().await;
        let metrics = collector.get_metrics().await;
        assert_eq!(metrics.hits, 1);
    }
}
