//! Storage backend abstraction with SQLite implementation.
//!
//! This module provides:
//! - A generic `StorageBackend` trait for storage abstraction
//! - `SqliteStorage` implementation using rusqlite
//! - Async wrappers for synchronous SQLite operations

use async_trait::async_trait;
use rusqlite::{params, Connection, ToSql};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::task;

use super::super::config::MemoryError;

/// Storage backend error type
#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("execution error: {0}")]
    Execution(String),
    #[error("query error: {0}")]
    Query(String),
    #[error("init error: {0}")]
    Init(String),
    #[error("connection error: {0}")]
    Connection(String),
}

/// Result type for storage operations
pub type StorageResult<T> = Result<T, StorageError>;

/// Storage backend trait for abstracting storage implementations
#[async_trait]
pub trait StorageBackend: Send + Sync {
    /// Execute a SQL statement without returning results
    async fn execute(&self, sql: &str) -> StorageResult<()>;

    /// Execute a SQL statement with parameters
    async fn execute_with_params(&self, sql: &str, params: Vec<String>) -> StorageResult<()>;

    /// Query rows and map them using the provided mapper
    async fn query<T, F>(&self, sql: &str, mapper: F) -> StorageResult<Vec<T>>
    where
        F: FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T> + Send + 'static,
        T: Send + 'static;

    /// Initialize the database schema
    async fn init_schema(&self) -> StorageResult<()>;

    /// Get the database path
    fn db_path(&self) -> &str;
}

/// SQLite storage implementation
pub struct SqliteStorage {
    path: String,
    conn: Arc<Mutex<Connection>>,
}

impl SqliteStorage {
    /// Get a reference to the connection for direct access
    pub fn conn(&self) -> &Arc<Mutex<Connection>> {
        &self.conn
    }
}

impl SqliteStorage {
    /// Create a new SQLite storage with the given path
    pub fn new<P: AsRef<Path>>(path: P) -> StorageResult<Self> {
        let path_str = path
            .as_ref()
            .to_str()
            .ok_or_else(|| StorageError::Connection("Invalid path".to_string()))?;

        // Ensure parent directory exists
        if let Some(parent) = path.as_ref().parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| StorageError::Connection(e.to_string()))?;
        }

        let conn = Connection::open(path.as_ref())
            .map_err(|e| StorageError::Connection(e.to_string()))?;

        // Enable WAL mode for better concurrent access
        conn.execute_batch("PRAGMA journal_mode=WAL;")
            .map_err(|e| StorageError::Init(e.to_string()))?;

        Ok(Self {
            path: path_str.to_string(),
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Create a new in-memory SQLite storage (for testing)
    pub fn in_memory() -> StorageResult<Self> {
        let conn = Connection::open_in_memory()
            .map_err(|e| StorageError::Connection(e.to_string()))?;

        Ok(Self {
            path: ":memory:".to_string(),
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Initialize the database schema (delegates to trait impl)
    pub async fn init_schema(&self) -> StorageResult<()> {
        StorageBackend::init_schema(self).await
    }

    /// Execute a SQL statement (delegates to trait impl)
    pub async fn execute(&self, sql: &str) -> StorageResult<()> {
        StorageBackend::execute(self, sql).await
    }

    /// Execute a SQL statement with parameters
    pub async fn execute_with_params(&self, sql: &str, params: Vec<String>) -> StorageResult<()> {
        StorageBackend::execute_with_params(self, sql, params).await
    }

    /// Query rows and map them (delegates to trait impl)
    pub async fn query<T, F>(&self, sql: &str, mapper: F) -> StorageResult<Vec<T>>
    where
        F: FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T> + Send + 'static,
        T: Send + 'static,
    {
        StorageBackend::query(self, sql, mapper).await
    }
}

impl Drop for SqliteStorage {
    fn drop(&mut self) {
        // SQLite connections are automatically closed when dropped
        // No need for explicit cleanup
    }
}

#[async_trait]
impl StorageBackend for SqliteStorage {
    async fn execute(&self, sql: &str) -> StorageResult<()> {
        let sql = sql.to_string();
        let conn = self.conn.clone();

        task::spawn_blocking(move || {
            let conn = conn.blocking_lock();
            conn.execute_batch(&sql)
                .map_err(|e| StorageError::Execution(e.to_string()))?;
            Ok(())
        }).await.map_err(|e| StorageError::Execution(e.to_string()))?
    }

    async fn execute_with_params(&self, sql: &str, params: Vec<String>) -> StorageResult<()> {
        let conn = self.conn.lock().await;
        let params_refs: Vec<&dyn ToSql> = params.iter().map(|s| s as &dyn ToSql).collect();
        conn.execute(sql, params_refs.as_slice())
            .map_err(|e| StorageError::Execution(e.to_string()))?;
        Ok(())
    }

    async fn query<T, F>(&self, sql: &str, mapper: F) -> StorageResult<Vec<T>>
    where
        F: FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T> + Send + 'static,
        T: Send + 'static,
    {
        let conn = self.conn.lock().await;
        let mut stmt = conn
            .prepare(sql)
            .map_err(|e| StorageError::Query(e.to_string()))?;

        let rows = stmt
            .query_map([], mapper)
            .map_err(|e| StorageError::Query(e.to_string()))?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| StorageError::Query(e.to_string()))
    }

    async fn init_schema(&self) -> StorageResult<()> {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS memory_items (
                id TEXT PRIMARY KEY,
                layer TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                user_id TEXT,
                session_key TEXT,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                category TEXT NOT NULL,
                confidence REAL NOT NULL,
                source TEXT NOT NULL,
                embedding BLOB,
                metadata TEXT NOT NULL DEFAULT '{}',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                last_accessed_at INTEGER,
                access_count INTEGER NOT NULL DEFAULT 0,
                version INTEGER NOT NULL DEFAULT 1,
                is_deleted INTEGER NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_memory_tenant
                ON memory_items(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_memory_user
                ON memory_items(user_id);
            CREATE INDEX IF NOT EXISTS idx_memory_layer
                ON memory_items(layer);
            CREATE INDEX IF NOT EXISTS idx_memory_key
                ON memory_items(tenant_id, user_id, key);
            CREATE INDEX IF NOT EXISTS idx_memory_updated
                ON memory_items(updated_at DESC);
        "#;

        self.execute(sql).await
    }

    fn db_path(&self) -> &str {
        &self.path
    }
}

/// Row mapper for MemoryItem
pub fn map_memory_item(row: &rusqlite::Row<'_>) -> rusqlite::Result<crate::agent::memory::types::MemoryItem> {
    use crate::agent::memory::types::{MemoryCategory, MemoryLayer, MemorySource};

    let layer_str: String = row.get("layer")?;
    let layer = match layer_str.as_str() {
        "Personal" => MemoryLayer::Personal,
        "Enterprise" => MemoryLayer::Enterprise,
        "Graph" => MemoryLayer::Graph,
        _ => MemoryLayer::Personal,
    };

    let category_str: String = row.get("category")?;
    let category = match category_str.as_str() {
        "Preference" => MemoryCategory::Preference,
        "Fact" => MemoryCategory::Fact,
        "Rule" => MemoryCategory::Rule,
        "Context" => MemoryCategory::Context,
        "Observation" => MemoryCategory::Observation,
        "Summary" => MemoryCategory::Summary,
        "Knowledge" => MemoryCategory::Knowledge,
        _ => MemoryCategory::Context,
    };

    let source_str: String = row.get("source")?;
    let source = match source_str.as_str() {
        "UserInput" => MemorySource::UserInput,
        "AgentInference" => MemorySource::AgentInference,
        "ToolResult" => MemorySource::ToolResult,
        "SystemImport" => MemorySource::SystemImport,
        "KnowledgeBase" => MemorySource::KnowledgeBase,
        _ => MemorySource::UserInput,
    };

    let metadata_str: String = row.get("metadata")?;
    let metadata: serde_json::Value = serde_json::from_str(&metadata_str)
        .unwrap_or(serde_json::json!({}));

    Ok(crate::agent::memory::types::MemoryItem {
        id: row.get("id")?,
        layer,
        tenant_id: row.get("tenant_id")?,
        user_id: row.get("user_id")?,
        session_key: row.get("session_key")?,
        key: row.get("key")?,
        value: row.get("value")?,
        category,
        confidence: row.get("confidence")?,
        source,
        embedding: None, // Embeddings stored separately in sqlite-vec
        metadata,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        last_accessed_at: row.get("last_accessed_at")?,
        access_count: row.get("access_count")?,
        version: row.get("version")?,
        is_deleted: row.get::<_, i32>("is_deleted")? != 0,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_in_memory_storage() {
        let storage = SqliteStorage::in_memory().unwrap();
        storage.init_schema().await.unwrap();

        // Insert a test item
        let sql = r#"
            INSERT INTO memory_items
            (id, layer, tenant_id, user_id, key, value, category, confidence, source, metadata, created_at, updated_at, access_count, version, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#;

        let params: Vec<&dyn ToSql> = vec![
            &"test-id-1" as &dyn ToSql,
            &"Personal" as &dyn ToSql,
            &"tenant-1" as &dyn ToSql,
            &"user-1" as &dyn ToSql,
            &"test-key" as &dyn ToSql,
            &"test-value" as &dyn ToSql,
            &"Context" as &dyn ToSql,
            &1.0 as &dyn ToSql,
            &"UserInput" as &dyn ToSql,
            &"{}" as &dyn ToSql,
            &1000i64 as &dyn ToSql,
            &1000i64 as &dyn ToSql,
            &0i64 as &dyn ToSql,
            &1i64 as &dyn ToSql,
            &0i32 as &dyn ToSql,
        ];

        storage.execute_with_params(sql, params).await.unwrap();

        // Query back
        let items: Vec<crate::agent::memory::types::MemoryItem> = storage
            .query("SELECT * FROM memory_items WHERE id = ?", |row| {
                map_memory_item(row)
            })
            .await
            .unwrap();

        assert_eq!(items.len(), 1);
        assert_eq!(items[0].id, "test-id-1");
        assert_eq!(items[0].key, "test-key");
    }

    #[tokio::test]
    async fn test_schema_creation() {
        let storage = SqliteStorage::in_memory().unwrap();
        storage.init_schema().await.unwrap();

        // Verify table exists
        let count: i64 = storage
            .query("SELECT COUNT(*) as count FROM memory_items", |row| {
                row.get("count")
            })
            .await
            .unwrap()
            .first()
            .cloned()
            .unwrap_or(0);

        assert_eq!(count, 0);
    }
}
