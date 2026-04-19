//! Tool Cache Module
//!
//! Provides caching for tool execution results and file reads.
//! Reduces redundant operations and improves performance.

use lru::LruCache;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::num::NonZeroUsize;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Cache entry with expiration
#[derive(Debug, Clone)]
struct CacheEntry<V> {
    value: V,
    expires_at: Option<Instant>,
}

impl<V> CacheEntry<V> {
    fn new(value: V, ttl: Option<Duration>) -> Self {
        Self {
            value,
            expires_at: ttl.map(|d| Instant::now() + d),
        }
    }

    fn is_expired(&self) -> bool {
        self.expires_at
            .map(|exp| Instant::now() > exp)
            .unwrap_or(false)
    }
}

/// Tool cache configuration
#[derive(Debug, Clone)]
pub struct ToolCacheConfig {
    /// Max entries in cache
    pub max_entries: usize,
    /// Default TTL for entries
    pub default_ttl: Option<Duration>,
    /// Enable file content cache
    pub enable_file_cache: bool,
    /// Enable HTTP response cache
    pub enable_http_cache: bool,
}

impl Default for ToolCacheConfig {
    fn default() -> Self {
        Self {
            max_entries: 256,
            default_ttl: Some(Duration::from_secs(300)), // 5 minutes
            enable_file_cache: true,
            enable_http_cache: true,
        }
    }
}

/// Tool execution cache
pub struct ToolCache {
    /// File content cache
    file_cache: Arc<RwLock<HashMap<String, CacheEntry<String>>>>,
    /// HTTP response cache
    http_cache: Arc<RwLock<HashMap<HttpCacheKey, CacheEntry<String>>>>,
    /// Tool execution result cache
    exec_cache: Arc<RwLock<HashMap<String, CacheEntry<String>>>>,
    /// Configuration
    config: ToolCacheConfig,
}

impl ToolCache {
    /// Create a new tool cache
    pub fn new(config: ToolCacheConfig) -> Self {
        Self {
            file_cache: Arc::new(RwLock::new(HashMap::new())),
            http_cache: Arc::new(RwLock::new(HashMap::new())),
            exec_cache: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    // =================================================================
    // File Content Cache
    // =================================================================

    /// Get cached file content
    pub async fn get_file(&self, path: &str, content_hash: &str) -> Option<String> {
        if !self.config.enable_file_cache {
            return None;
        }

        let cache_key = format!("{}:{}", path, content_hash);
        let cache = self.file_cache.read().await;
        cache.get(&cache_key).and_then(|entry| {
            if entry.is_expired() {
                None
            } else {
                Some(entry.value.clone())
            }
        })
    }

    /// Cache file content
    pub async fn put_file(&self, path: &str, content_hash: &str, content: String) {
        if !self.config.enable_file_cache {
            return;
        }

        // Evict old entries if at capacity
        self.evict_if_needed(&self.file_cache).await;
        
        let cache_key = format!("{}:{}", path, content_hash);
        let entry = CacheEntry::new(content, self.config.default_ttl);
        let mut cache = self.file_cache.write().await;
        cache.insert(cache_key, entry);
    }

    /// Invalidate file cache for a path
    pub async fn invalidate_file(&self, path: &str) {
        let mut cache = self.file_cache.write().await;
        cache.retain(|k, _| !k.starts_with(path));
    }

    // =================================================================
    // HTTP Response Cache
    // =================================================================

    /// Get cached HTTP response
    pub async fn get_http(&self, key: &HttpCacheKey) -> Option<String> {
        if !self.config.enable_http_cache {
            return None;
        }

        let cache = self.http_cache.read().await;
        cache.get(key).and_then(|entry| {
            if entry.is_expired() {
                None
            } else {
                Some(entry.value.clone())
            }
        })
    }

    /// Cache HTTP response
    pub async fn put_http(&self, key: HttpCacheKey, response: String, ttl: Option<Duration>) {
        if !self.config.enable_http_cache {
            return;
        }

        // Evict old entries if at capacity
        self.evict_if_needed(&self.http_cache).await;
        
        let entry = CacheEntry::new(response, ttl.or(self.config.default_ttl));
        let mut cache = self.http_cache.write().await;
        cache.insert(key, entry);
    }

    /// Invalidate HTTP cache for a URL pattern
    pub async fn invalidate_http(&self, url_pattern: &str) {
        let mut cache = self.http_cache.write().await;
        cache.retain(|k, _| !k.url.contains(url_pattern));
    }

    // =================================================================
    // Tool Execution Cache
    // =================================================================

    /// Get cached tool execution result
    pub async fn get_exec(&self, key: &str) -> Option<String> {
        let cache = self.exec_cache.read().await;
        cache.get(key).and_then(|entry| {
            if entry.is_expired() {
                None
            } else {
                Some(entry.value.clone())
            }
        })
    }

    /// Cache tool execution result
    pub async fn put_exec(&self, key: String, result: String, ttl: Option<Duration>) {
        // Evict old entries if at capacity
        self.evict_if_needed(&self.exec_cache).await;
        
        let entry = CacheEntry::new(result, ttl.or(self.config.default_ttl));
        let mut cache = self.exec_cache.write().await;
        cache.insert(key, entry);
    }

    /// Generate cache key for tool execution
    pub fn generate_exec_key(
        tool_id: &str,
        params: &HashMap<String, serde_json::Value>,
    ) -> String {
        let params_str = serde_json::to_string(params).unwrap_or_default();
        let mut hasher = std::collections::hash_map::DefaultHasher::new();
        tool_id.hash(&mut hasher);
        params_str.hash(&mut hasher);
        format!("{}:{:x}", tool_id, hasher.finish())
    }

    // =================================================================
    // Cache Management
    // =================================================================

    /// Evict expired entries if cache is at capacity
    async fn evict_if_needed<K, V>(&self, cache: &Arc<RwLock<HashMap<K, CacheEntry<V>>>>)
    where
        K: Eq + Hash + Clone,
        V: Clone,
    {
        let mut map = cache.write().await;
        if map.len() >= self.config.max_entries {
            // Remove expired entries first
            map.retain(|_, v| !v.is_expired());
            
            // If still at capacity, remove oldest entries
            if map.len() >= self.config.max_entries {
                let to_remove = map.len() - self.config.max_entries / 2;
                let keys: Vec<_> = map.keys().take(to_remove).cloned().collect();
                for key in keys {
                    map.remove(&key);
                }
            }
        }
    }

    /// Clear all caches
    pub async fn clear(&self) {
        self.file_cache.write().await.clear();
        self.http_cache.write().await.clear();
        self.exec_cache.write().await.clear();
    }

    /// Get cache statistics
    pub async fn stats(&self) -> CacheStats {
        CacheStats {
            file_entries: self.file_cache.read().await.len(),
            http_entries: self.http_cache.read().await.len(),
            exec_entries: self.exec_cache.read().await.len(),
            max_entries: self.config.max_entries,
        }
    }
}

/// HTTP cache key (URL + method + headers hash)
#[derive(Debug, Clone, Hash, Eq)]
pub struct HttpCacheKey {
    pub url: String,
    pub method: String,
    pub headers_hash: u64,
}

impl PartialEq for HttpCacheKey {
    fn eq(&self, other: &Self) -> bool {
        self.url == other.url && self.method == other.method && self.headers_hash == other.headers_hash
    }
}

impl HttpCacheKey {
    pub fn new(url: String, method: String, headers: &HashMap<String, String>) -> Self {
        let mut hasher = std::collections::hash_map::DefaultHasher::new();
        let mut sorted_headers: Vec<_> = headers.iter().collect();
        sorted_headers.sort_by(|a, b| a.0.cmp(b.0));
        for (k, v) in sorted_headers {
            k.hash(&mut hasher);
            v.hash(&mut hasher);
        }

        Self {
            url,
            method,
            headers_hash: hasher.finish(),
        }
    }
}

/// Cache statistics
#[derive(Debug, Clone, serde::Serialize)]
pub struct CacheStats {
    pub file_entries: usize,
    pub http_entries: usize,
    pub exec_entries: usize,
    pub max_entries: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_file_cache() {
        let cache = ToolCache::new(ToolCacheConfig::default());
        
        cache.put_file("/path/to/file.txt", "abc123", "file content".to_string()).await;
        let result = cache.get_file("/path/to/file.txt", "abc123").await;
        
        assert_eq!(result, Some("file content".to_string()));
    }

    #[tokio::test]
    async fn test_exec_cache_key() {
        let mut params = HashMap::new();
        params.insert("name".to_string(), serde_json::json!("test"));
        
        let key1 = ToolCache::generate_exec_key("test_tool", &params);
        let key2 = ToolCache::generate_exec_key("test_tool", &params);
        
        assert_eq!(key1, key2);
    }
}
