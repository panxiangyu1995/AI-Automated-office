//! Scan result caching module.

use super::SecurityScanResult;
use std::collections::HashMap;
use std::time::{Duration, Instant};

/// Cache entry with expiration
struct CacheEntry {
    result: SecurityScanResult,
    expires_at: Instant,
}

/// Scan result cache
pub struct ScanResultCache {
    /// Cache storage
    cache: HashMap<String, CacheEntry>,
    /// Default TTL in seconds
    ttl_secs: u64,
}

impl ScanResultCache {
    /// Create a new cache with TTL
    pub fn new(ttl_secs: u64) -> Self {
        Self {
            cache: HashMap::new(),
            ttl_secs,
        }
    }

    /// Get a cached result
    pub fn get(&self, key: &str) -> Option<SecurityScanResult> {
        self.cache.get(key).and_then(|entry| {
            if entry.expires_at > Instant::now() {
                Some(entry.result.clone())
            } else {
                None
            }
        })
    }

    /// Set a cached result
    pub fn set(&mut self, key: String, result: &SecurityScanResult) {
        self.cache.insert(
            key,
            CacheEntry {
                result: result.clone(),
                expires_at: Instant::now() + Duration::from_secs(self.ttl_secs),
            },
        );
    }

    /// Clear expired entries
    pub fn cleanup(&mut self) {
        self.cache.retain(|_, entry| entry.expires_at > Instant::now());
    }

    /// Clear all entries
    pub fn clear(&mut self) {
        self.cache.clear();
    }
}

impl Default for ScanResultCache {
    fn default() -> Self {
        Self::new(3600)
    }
}
