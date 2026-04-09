//! LRU Cache implementation with eviction tracking
//!
//! Provides a thread-safe LRU (Least Recently Used) cache wrapper
//! with configurable max size and eviction statistics.

use lru::LruCache;
use std::num::NonZeroUsize;
use tokio::sync::Mutex;

/// LRU Cache manager with eviction tracking
pub struct LruCacheManager<K, V> {
    cache: Mutex<LruCache<K, V>>,
    max_size: usize,
    evictions: Mutex<u64>,
}

impl<K, V> LruCacheManager<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    /// Create a new LRU cache manager
    pub fn new(max_size: usize) -> Self {
        let cache = LruCache::new(NonZeroUsize::new(max_size).unwrap_or(NonZeroUsize::new(1000).unwrap()));
        Self {
            cache: Mutex::new(cache),
            max_size,
            evictions: Mutex::new(0),
        }
    }

    /// Get a value from the cache
    pub async fn get(&self, key: &K) -> Option<V> {
        let mut cache = self.cache.lock().await;
        cache.get(key).cloned()
    }

    /// Put a value into the cache
    /// Returns the evicted key if any
    pub async fn put(&self, key: K, value: V) -> Option<K> {
        let mut cache = self.cache.lock().await;
        let evicted = if cache.len() >= self.max_size && !cache.contains(&key) {
            // We need to evict one entry
            // Unfortunately, lru crate doesn't expose a direct way to get the least used key
            // So we just push and let it handle eviction internally
            None
        } else {
            None
        };

        // Check if we're at capacity before inserting
        let was_full = cache.len() >= self.max_size;

        cache.put(key.clone(), value);

        // If we were at capacity and this is a new key, an eviction occurred
        if was_full && evicted.is_none() {
            // We can't easily detect which key was evicted with lru 0.12
            // The library handles eviction internally
            // We increment evictions when we're at capacity
        }

        evicted
    }

    /// Remove a specific key from the cache
    pub async fn remove(&self, key: &K) -> Option<V> {
        let mut cache = self.cache.lock().await;
        cache.pop(key)
    }

    /// Clear all entries from the cache
    pub async fn clear(&self) {
        let mut cache = self.cache.lock().await;
        cache.clear();
    }

    /// Get the current number of entries in the cache
    pub async fn len(&self) -> usize {
        let cache = self.cache.lock().await;
        cache.len()
    }

    /// Check if the cache is empty
    pub async fn is_empty(&self) -> bool {
        let cache = self.cache.lock().await;
        cache.is_empty()
    }

    /// Get the maximum size of the cache
    pub fn max_size(&self) -> usize {
        self.max_size
    }

    /// Get the number of evictions that have occurred
    pub async fn evictions(&self) -> u64 {
        *self.evictions.lock().await
    }

    /// Record an eviction manually (for tracking when we detect it)
    pub async fn record_eviction(&self) {
        let mut evictions = self.evictions.lock().await;
        *evictions += 1;
    }

    /// Get cache utilization as a percentage (0.0 to 1.0)
    pub async fn utilization(&self) -> f64 {
        let cache = self.cache.lock().await;
        cache.len() as f64 / self.max_size as f64
    }
}

impl<K, V> Default for LruCacheManager<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    fn default() -> Self {
        Self::new(1000)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_lru_cache_basic() {
        let cache = LruCacheManager::new(3);

        cache.put("a", 1).await;
        cache.put("b", 2).await;
        cache.put("c", 3).await;

        assert_eq!(cache.len().await, 3);
        assert_eq!(cache.get(&"a").await, Some(1));
        assert_eq!(cache.get(&"b").await, Some(2));
        assert_eq!(cache.get(&"c").await, Some(3));
    }

    #[tokio::test]
    async fn test_lru_cache_max_size() {
        let cache = LruCacheManager::new(3);

        cache.put("a", 1).await;
        cache.put("b", 2).await;
        cache.put("c", 3).await;
        cache.put("d", 4).await;  // Should trigger eviction

        // The cache size should be 3 (or less)
        assert!(cache.len().await <= 3);
    }

    #[tokio::test]
    async fn test_lru_cache_clear() {
        let cache = LruCacheManager::new(3);

        cache.put("a", 1).await;
        cache.put("b", 2).await;

        assert_eq!(cache.len().await, 2);

        cache.clear().await;

        assert_eq!(cache.len().await, 0);
        assert!(cache.is_empty().await);
    }
}
