//! Unified cache statistics interface
//!
//! Provides a consistent way to collect and report cache metrics
//! across different cache implementations.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Unified cache metrics structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMetrics {
    /// Total number of entries in the cache
    pub total_entries: usize,
    /// Number of cache hits
    pub hits: u64,
    /// Number of cache misses
    pub misses: u64,
    /// Cache hit rate (0.0 to 1.0)
    pub hit_rate: f64,
    /// Number of evictions
    pub evictions: u64,
    /// Timestamp of last warmup (Unix timestamp)
    pub last_warmup: Option<i64>,
    /// Cache name/identifier
    pub name: String,
}

impl CacheMetrics {
    /// Create new metrics for a cache
    pub fn new(name: &str) -> Self {
        Self {
            total_entries: 0,
            hits: 0,
            misses: 0,
            hit_rate: 0.0,
            evictions: 0,
            last_warmup: None,
            name: name.to_string(),
        }
    }

    /// Update hit rate based on hits and misses
    pub fn update_hit_rate(&mut self) {
        let total = self.hits + self.misses;
        if total > 0 {
            self.hit_rate = self.hits as f64 / total as f64;
        }
    }

    /// Record a cache hit
    pub fn record_hit(&mut self) {
        self.hits += 1;
        self.update_hit_rate();
    }

    /// Record a cache miss
    pub fn record_miss(&mut self) {
        self.misses += 1;
        self.update_hit_rate();
    }

    /// Record an eviction
    pub fn record_eviction(&mut self) {
        self.evictions += 1;
    }

    /// Record warmup completion
    pub fn record_warmup(&mut self) {
        self.last_warmup = Some(chrono::Utc::now().timestamp());
    }
}

/// Thread-safe cache statistics collector
#[derive(Debug, Clone)]
pub struct CacheStatsCollector {
    metrics: Arc<RwLock<CacheMetrics>>,
}

impl CacheStatsCollector {
    /// Create a new statistics collector
    pub fn new(name: &str) -> Self {
        Self {
            metrics: Arc::new(RwLock::new(CacheMetrics::new(name))),
        }
    }

    /// Record a hit
    pub async fn record_hit(&self) {
        let mut metrics = self.metrics.write().await;
        metrics.record_hit();
    }

    /// Record a miss
    pub async fn record_miss(&self) {
        let mut metrics = self.metrics.write().await;
        metrics.record_miss();
    }

    /// Record an eviction
    pub async fn record_eviction(&self) {
        let mut metrics = self.metrics.write().await;
        metrics.record_eviction();
    }

    /// Record warmup completion
    pub async fn record_warmup(&self) {
        let mut metrics = self.metrics.write().await;
        metrics.record_warmup();
    }

    /// Update total entries count
    pub async fn set_total_entries(&self, count: usize) {
        let mut metrics = self.metrics.write().await;
        metrics.total_entries = count;
    }

    /// Get current metrics
    pub async fn get_metrics(&self) -> CacheMetrics {
        self.metrics.read().await.clone()
    }

    /// Reset all statistics
    pub async fn reset(&self) {
        let mut metrics = self.metrics.write().await;
        metrics.hits = 0;
        metrics.misses = 0;
        metrics.hit_rate = 0.0;
        metrics.evictions = 0;
    }
}

impl Default for CacheStatsCollector {
    fn default() -> Self {
        Self::new("default")
    }
}

/// Trait for caches that support statistics collection
pub trait CacheStats {
    /// Get cache name
    fn name(&self) -> &str;

    /// Get current statistics
    fn stats(&self) -> impl std::future::Future<Output = CacheMetrics> + Send;

    /// Record a hit
    fn record_hit(&self) -> impl std::future::Future<Output = ()> + Send;

    /// Record a miss
    fn record_miss(&self) -> impl std::future::Future<Output = ()> + Send;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_cache_metrics() {
        let mut metrics = CacheMetrics::new("test");

        metrics.record_hit();
        metrics.record_hit();
        metrics.record_miss();

        assert_eq!(metrics.hits, 2);
        assert_eq!(metrics.misses, 1);
        assert!((metrics.hit_rate - 0.666).abs() < 0.01);
    }

    #[tokio::test]
    async fn test_stats_collector() {
        let collector = CacheStatsCollector::new("test");

        collector.record_hit().await;
        collector.record_hit().await;
        collector.record_miss().await;
        collector.record_eviction().await;

        let metrics = collector.get_metrics().await;
        assert_eq!(metrics.hits, 2);
        assert_eq!(metrics.misses, 1);
        assert_eq!(metrics.evictions, 1);
    }

    #[tokio::test]
    async fn test_reset() {
        let collector = CacheStatsCollector::new("test");

        collector.record_hit().await;
        collector.record_eviction().await;

        collector.reset().await;

        let metrics = collector.get_metrics().await;
        assert_eq!(metrics.hits, 0);
        assert_eq!(metrics.evictions, 0);
    }
}
