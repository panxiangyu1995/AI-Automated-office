//! Cache Module
//!
//! Provides unified cache management with:
//! - LRU eviction
//! - Multi-tenant isolation
//! - Cache warming
//! - Statistics collection

pub mod lru_cache;
pub mod warmer;
pub mod stats;

pub use lru_cache::LruCacheManager;
pub use warmer::{SimpleWarmer, EmbeddingWarmer, WarmupStats};
pub use stats::{CacheMetrics, CacheStatsCollector};
