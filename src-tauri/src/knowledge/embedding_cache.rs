//! Embedding cache module.
//!
//! Provides persistent caching for embedding vectors using SQLite.
//! Reduces API calls by caching text embeddings based on SHA-256 hash.

use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Cache statistics for monitoring
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CacheStats {
    pub total_entries: usize,
    pub hits: usize,
    pub misses: usize,
    pub hit_rate: f64,
}

/// Embedding cache with SQLite backend
pub struct EmbeddingCache {
    conn: Arc<RwLock<Connection>>,
    stats: Arc<RwLock<CacheStats>>,
}

impl EmbeddingCache {
    /// Create a new cache instance with the given database path
    pub fn new<P: AsRef<Path>>(db_path: P) -> SqliteResult<Self> {
        let conn = Connection::open(db_path)?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS embedding_cache (
                text_hash TEXT PRIMARY KEY,
                embedding BLOB NOT NULL,
                model_name TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                access_count INTEGER NOT NULL DEFAULT 0,
                last_accessed INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_embedding_cache_model
             ON embedding_cache(model_name)",
            [],
        )?;

        Ok(Self {
            conn: Arc::new(RwLock::new(conn)),
            stats: Arc::new(RwLock::new(CacheStats::default())),
        })
    }

    /// Generate a cache key from text content
    pub fn generate_cache_key(text: &str, model_name: &str) -> String {
        let normalized = Self::normalize_text(text);
        let mut hasher = Sha256::new();
        hasher.update(normalized.as_bytes());
        hasher.update(model_name.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Normalize text for consistent hashing
    fn normalize_text(text: &str) -> String {
        text.chars()
            .filter(|c| !c.is_whitespace())
            .collect::<String>()
            .to_lowercase()
    }

    /// Generate text hash only (without model name)
    pub fn hash_text(text: &str) -> String {
        let normalized = Self::normalize_text(text);
        let mut hasher = Sha256::new();
        hasher.update(normalized.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Get cached embedding by hash
    pub async fn get(&self, text_hash: &str) -> Option<Vec<f32>> {
        let conn = self.conn.read().await;

        let result: SqliteResult<Vec<u8>> = conn.query_row(
            "SELECT embedding FROM embedding_cache WHERE text_hash = ?",
            params![text_hash],
            |row| row.get(0),
        );

        match result {
            Ok(blob) => {
                let _ = conn.execute(
                    "UPDATE embedding_cache SET access_count = access_count + 1,
                     last_accessed = ? WHERE text_hash = ?",
                    params![chrono::Utc::now().timestamp(), text_hash],
                );

                {
                    let mut stats = self.stats.write().await;
                    stats.hits += 1;
                    stats.hit_rate = stats.hits as f64 / (stats.hits + stats.misses) as f64;
                }

                Some(deserialize_embedding(&blob))
            }
            Err(_) => {
                let mut stats = self.stats.write().await;
                stats.misses += 1;
                stats.hit_rate = stats.hits as f64 / (stats.hits + stats.misses) as f64;
                None
            }
        }
    }

    /// Set embedding in cache
    pub async fn set(&self, text_hash: &str, embedding: &[f32], model_name: &str) -> SqliteResult<()> {
        let conn = self.conn.write().await;
        let blob = serialize_embedding(embedding);
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "INSERT OR REPLACE INTO embedding_cache
             (text_hash, embedding, model_name, created_at, access_count, last_accessed)
             VALUES (?, ?, ?, ?, 0, ?)",
            params![text_hash, blob, model_name, now, now],
        )?;

        let total: usize = conn.query_row(
            "SELECT COUNT(*) FROM embedding_cache",
            [],
            |row| row.get(0),
        )?;

        let mut stats = self.stats.write().await;
        stats.total_entries = total;

        Ok(())
    }

    /// Batch get cached embeddings
    pub async fn get_batch(&self, text_hashes: &[String]) -> Vec<(String, Vec<f32>)> {
        if text_hashes.is_empty() {
            return Vec::new();
        }

        let conn = self.conn.read().await;
        let mut results = Vec::new();

        for hash in text_hashes {
            let result: SqliteResult<Vec<u8>> = conn.query_row(
                "SELECT embedding FROM embedding_cache WHERE text_hash = ?",
                params![hash],
                |row| row.get(0),
            );

            if let Ok(blob) = result {
                results.push((hash.clone(), deserialize_embedding(&blob)));

                let _ = conn.execute(
                    "UPDATE embedding_cache SET access_count = access_count + 1,
                     last_accessed = ? WHERE text_hash = ?",
                    params![chrono::Utc::now().timestamp(), hash],
                );
            }
        }

        {
            let mut stats = self.stats.write().await;
            stats.hits += results.len();
            let misses = text_hashes.len() - results.len();
            stats.misses += misses;
            stats.hit_rate = if stats.hits + stats.misses > 0 {
                stats.hits as f64 / (stats.hits + stats.misses) as f64
            } else {
                0.0
            };
        }

        results
    }

    /// Batch set embeddings in cache
    pub async fn set_batch(&self, entries: &[(String, Vec<f32>, String)]) -> SqliteResult<usize> {
        if entries.is_empty() {
            return Ok(0);
        }

        let mut conn = self.conn.write().await;
        let tx = conn.transaction()?;
        let now = chrono::Utc::now().timestamp();
        let mut count = 0;

        for (text_hash, embedding, model_name) in entries {
            let blob = serialize_embedding(embedding);
            if tx.execute(
                "INSERT OR REPLACE INTO embedding_cache
                 (text_hash, embedding, model_name, created_at, access_count, last_accessed)
                 VALUES (?, ?, ?, ?, 0, ?)",
                params![text_hash, blob, model_name, now, now],
            ).is_ok() {
                count += 1;
            }
        }

        tx.commit()?;

        let total: usize = conn.query_row(
            "SELECT COUNT(*) FROM embedding_cache",
            [],
            |row| row.get(0),
        )?;

        let mut stats = self.stats.write().await;
        stats.total_entries = total;

        Ok(count)
    }

    /// Get cache statistics
    pub async fn get_stats(&self) -> CacheStats {
        let stats = self.stats.read().await;
        stats.clone()
    }

    /// Get total entries count
    pub async fn len(&self) -> usize {
        let conn = self.conn.read().await;
        conn.query_row("SELECT COUNT(*) FROM embedding_cache", [], |row| row.get(0))
            .unwrap_or(0)
    }

    /// Check if cache is empty
    pub async fn is_empty(&self) -> bool {
        self.len().await == 0
    }

    /// Clear all cache entries
    pub async fn clear(&self) -> SqliteResult<()> {
        let conn = self.conn.write().await;
        conn.execute("DELETE FROM embedding_cache", [])?;

        let mut stats = self.stats.write().await;
        stats.total_entries = 0;
        stats.hits = 0;
        stats.misses = 0;
        stats.hit_rate = 0.0;

        Ok(())
    }

    /// Delete entries older than specified days
    pub async fn cleanup_old_entries(&self, days: i64) -> SqliteResult<usize> {
        let conn = self.conn.write().await;
        let cutoff = chrono::Utc::now().timestamp() - (days * 86400);

        let deleted = conn.execute(
            "DELETE FROM embedding_cache WHERE created_at < ?",
            params![cutoff],
        )?;

        let total: usize = conn.query_row(
            "SELECT COUNT(*) FROM embedding_cache",
            [],
            |row| row.get(0),
        )?;

        let mut stats = self.stats.write().await;
        stats.total_entries = total;

        Ok(deleted)
    }

    /// Get most accessed cache keys
    pub async fn get_top_accessed(&self, limit: usize) -> SqliteResult<Vec<(String, usize)>> {
        let conn = self.conn.read().await;
        let mut stmt = conn.prepare(
            "SELECT text_hash, access_count FROM embedding_cache
             ORDER BY access_count DESC LIMIT ?",
        )?;

        let rows = stmt.query_map(params![limit as i64], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, usize>(1)?))
        })?;

        rows.collect()
    }
}

fn serialize_embedding(embedding: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(embedding.len() * 4);
    for &val in embedding {
        bytes.extend_from_slice(&val.to_le_bytes());
    }
    bytes
}

fn deserialize_embedding(bytes: &[u8]) -> Vec<f32> {
    bytes
        .chunks_exact(4)
        .map(|chunk| f32::from_le_bytes(chunk.try_into().unwrap()))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_cache_key() {
        let key1 = EmbeddingCache::generate_cache_key("Hello World", "text-embedding-ada-002");
        let key2 = EmbeddingCache::generate_cache_key("Hello World", "text-embedding-ada-002");
        let key3 = EmbeddingCache::generate_cache_key("hello   world", "text-embedding-ada-002");

        assert_eq!(key1, key2);
        assert_eq!(key1, key3);
    }

    #[test]
    fn test_serialize_deserialize() {
        let embedding = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        let serialized = serialize_embedding(&embedding);
        let deserialized = deserialize_embedding(&serialized);
        assert_eq!(embedding, deserialized);
    }

    #[tokio::test]
    async fn test_cache_basic_operations() {
        let cache = EmbeddingCache::new(":memory:").unwrap();

        let hash = EmbeddingCache::hash_text("test text");
        let embedding = vec![0.1, 0.2, 0.3];

        assert!(cache.get(&hash).await.is_none());

        cache.set(&hash, &embedding, "test-model").await.unwrap();

        let cached = cache.get(&hash).await;
        assert!(cached.is_some());
        assert_eq!(cached.unwrap(), embedding);

        let stats = cache.get_stats().await;
        assert_eq!(stats.hits, 1);
        assert_eq!(stats.misses, 0);
    }

    #[tokio::test]
    async fn test_cache_batch() {
        let cache = EmbeddingCache::new(":memory:").unwrap();

        let entries = vec![
            ("hash1".to_string(), vec![0.1, 0.2], "model1".to_string()),
            ("hash2".to_string(), vec![0.3, 0.4], "model1".to_string()),
            ("hash3".to_string(), vec![0.5, 0.6], "model1".to_string()),
        ];

        let count = cache.set_batch(&entries).await.unwrap();
        assert_eq!(count, 3);

        let hashes = vec!["hash1".to_string(), "hash2".to_string(), "hash4".to_string()];
        let results = cache.get_batch(&hashes).await;
        assert_eq!(results.len(), 2);
    }
}
