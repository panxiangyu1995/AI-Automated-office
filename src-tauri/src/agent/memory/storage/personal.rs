//! L1 Personal memory storage with SQLite persistence.

use async_trait::async_trait;
use rusqlite::ToSql;
use std::sync::Arc;

use super::backend::{SqliteStorage, StorageBackend, StorageError, map_memory_item};
use super::layer::{MemoryStore, PermissionBoundary};
use super::super::types::{MemoryItem, MemoryLayer, MemoryQuery};
use super::super::config::MemoryError;

/// Convert StorageError to MemoryError
impl From<StorageError> for MemoryError {
    fn from(e: StorageError) -> Self {
        MemoryError::Storage(e.to_string())
    }
}

/// In-memory personal memory store backed by SQLite
/// Production implementation persists to disk
pub struct PersonalMemoryStore {
    storage: Arc<SqliteStorage>,
}

impl PersonalMemoryStore {
    /// Create a new personal memory store with the given SQLite storage
    pub fn new(storage: SqliteStorage) -> Self {
        Self {
            storage: Arc::new(storage),
        }
    }

    /// Create a new personal memory store with default database path
    pub async fn with_default_db() -> Result<Self, MemoryError> {
        let db_path = dirs::data_local_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("ai-automated-office")
            .join("memory_personal.db");

        let storage = SqliteStorage::new(&db_path)
            .map_err(|e| MemoryError::Storage(format!("failed to create storage: {}", e)))?;

        storage.init_schema().await
            .map_err(|e| MemoryError::Storage(format!("failed to init schema: {}", e)))?;

        Ok(Self::new(storage))
    }

    /// Create an in-memory store for testing
    pub fn in_memory() -> Result<Self, MemoryError> {
        let storage = SqliteStorage::in_memory()
            .map_err(|e| MemoryError::Storage(format!("failed to create in-memory storage: {}", e)))?;

        Ok(Self::new(storage))
    }

    /// Get storage reference
    pub fn storage(&self) -> &Arc<SqliteStorage> {
        &self.storage
    }
}

#[async_trait]
impl MemoryStore for PersonalMemoryStore {
    async fn add(&self, item: &MemoryItem) -> Result<(), MemoryError> {
        if item.layer != MemoryLayer::Personal {
            return Err(MemoryError::OperationFailed(
                "PersonalMemoryStore can only store personal memories".to_string(),
            ));
        }

        let sql = r#"
            INSERT OR REPLACE INTO memory_items
            (id, layer, tenant_id, user_id, session_key, key, value, category,
             confidence, source, embedding, metadata, created_at, updated_at,
             last_accessed_at, access_count, version, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#;

        self.storage.execute_with_params(sql, &[
            &item.id as &dyn ToSql,
            &format!("{:?}", item.layer) as &dyn ToSql,
            &item.tenant_id as &dyn ToSql,
            &item.user_id as &dyn ToSql,
            &item.session_key as &dyn ToSql,
            &item.key as &dyn ToSql,
            &item.value as &dyn ToSql,
            &format!("{:?}", item.category) as &dyn ToSql,
            &item.confidence as &dyn ToSql,
            &format!("{:?}", item.source) as &dyn ToSql,
            &Option::<String>::None as &dyn ToSql, // embedding stored separately
            &item.metadata.to_string() as &dyn ToSql,
            &item.created_at as &dyn ToSql,
            &item.updated_at as &dyn ToSql,
            &item.last_accessed_at as &dyn ToSql,
            &item.access_count as &dyn ToSql,
            &item.version as &dyn ToSql,
            &(item.is_deleted as i32) as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("add failed: {}", e)))?;

        Ok(())
    }

    async fn update(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError> {
        let sql = r#"
            UPDATE memory_items
            SET layer = ?, tenant_id = ?, user_id = ?, session_key = ?, key = ?,
                value = ?, category = ?, confidence = ?, source = ?,
                metadata = ?, updated_at = ?, version = version + 1
            WHERE id = ? AND is_deleted = 0
        "#;

        let rows = self.storage.execute_with_params(sql, &[
            &format!("{:?}", item.layer) as &dyn ToSql,
            &item.tenant_id as &dyn ToSql,
            &item.user_id as &dyn ToSql,
            &item.session_key as &dyn ToSql,
            &item.key as &dyn ToSql,
            &item.value as &dyn ToSql,
            &format!("{:?}", item.category) as &dyn ToSql,
            &item.confidence as &dyn ToSql,
            &format!("{:?}", item.source) as &dyn ToSql,
            &item.metadata.to_string() as &dyn ToSql,
            &chrono::Utc::now().timestamp() as &dyn ToSql,
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("update failed: {}", e)))?;

        // Check if any row was updated
        // Note: rusqlite doesn't return affected rows directly with execute
        // We verify by checking if the item exists after update
        let existing = self.get(id).await?;
        if existing.is_none() {
            return Err(MemoryError::NotFound(id.to_string()));
        }

        Ok(())
    }

    async fn delete(&self, id: &str) -> Result<(), MemoryError> {
        let sql = r#"
            UPDATE memory_items
            SET is_deleted = 1, updated_at = ?
            WHERE id = ? AND is_deleted = 0
        "#;

        self.storage.execute_with_params(sql, &[
            &chrono::Utc::now().timestamp() as &dyn ToSql,
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("delete failed: {}", e)))?;

        Ok(())
    }

    async fn get(&self, id: &str) -> Result<Option<MemoryItem>, MemoryError> {
        let sql = "SELECT * FROM memory_items WHERE id = ? AND is_deleted = 0";

        let items: Vec<MemoryItem> = self.storage
            .query(sql, map_memory_item)
            .await
            .map_err(|e| MemoryError::Storage(format!("get failed: {}", e)))?;

        Ok(items.into_iter().next())
    }

    async fn search(&self, query: &MemoryQuery) -> Result<Vec<MemoryItem>, MemoryError> {
        // Build SQL with optional filters
        let mut sql = String::from(
            "SELECT * FROM memory_items WHERE is_deleted = 0 AND layer = 'Personal' AND tenant_id = ?"
        );

        // Execute base query
        let conn = self.storage.conn.lock().await;
        let mut stmt = conn.prepare(sql.as_str())
            .map_err(|e| StorageError::Query(e.to_string()))?;

        let rows = stmt.query_map([&query.tenant_id as &dyn rusqlite::ToSql], map_memory_item)
            .map_err(|e| StorageError::Query(e.to_string()))?;

        let mut items: Vec<MemoryItem> = rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| StorageError::Query(e.to_string()))?;
        drop(stmt);
        drop(conn);

        // Filter by user if specified
        if let Some(ref user_id) = query.user_id {
            items.retain(|item| item.user_id.as_deref() == Some(user_id));
        }

        // Text search on key and value
        if !query.query.is_empty() {
            let query_lower = query.query.to_lowercase();
            items.retain(|item| {
                item.key.to_lowercase().contains(&query_lower)
                    || item.value.to_lowercase().contains(&query_lower)
            });
        }

        // Apply limit
        items.truncate(query.k);

        Ok(items)
    }

    async fn find_similar(&self, _item: &MemoryItem, _threshold: f64) -> Result<Vec<MemoryItem>, MemoryError> {
        // TODO: Implement vector similarity search using sqlite-vec
        // For now, return empty - will be implemented in retrieval layer
        Ok(Vec::new())
    }

    async fn update_access_stats(&self, id: &str) -> Result<(), MemoryError> {
        let sql = r#"
            UPDATE memory_items
            SET access_count = access_count + 1,
                last_accessed_at = ?
            WHERE id = ? AND is_deleted = 0
        "#;

        self.storage.execute_with_params(sql, &[
            &chrono::Utc::now().timestamp() as &dyn ToSql,
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("update_access_stats failed: {}", e)))?;

        Ok(())
    }

    async fn merge(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError> {
        let sql = r#"
            UPDATE memory_items
            SET value = value || char(10) || '---' || char(10) || ?,
                confidence = (confidence + ?) / 2,
                updated_at = ?,
                version = version + 1
            WHERE id = ? AND is_deleted = 0
        "#;

        self.storage.execute_with_params(sql, &[
            &item.value as &dyn ToSql,
            &item.confidence as &dyn ToSql,
            &chrono::Utc::now().timestamp() as &dyn ToSql,
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("merge failed: {}", e)))?;

        Ok(())
    }

    async fn hard_delete(&self, id: &str) -> Result<(), MemoryError> {
        let sql = "DELETE FROM memory_items WHERE id = ?";

        self.storage.execute_with_params(sql, &[
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("hard_delete failed: {}", e)))?;

        Ok(())
    }

    async fn count(&self) -> Result<usize, MemoryError> {
        let sql = "SELECT COUNT(*) as count FROM memory_items WHERE is_deleted = 0 AND layer = 'Personal'";

        let count: i64 = self.storage
            .query(sql, |row| row.get("count"))
            .await
            .map_err(|e| MemoryError::Storage(format!("count failed: {}", e)))?
            .into_iter()
            .next()
            .unwrap_or(0);

        Ok(count as usize)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_personal_store_add_and_get() {
        let store = PersonalMemoryStore::in_memory().unwrap();

        let item = MemoryItem {
            id: "test-1".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            key: "test-key".to_string(),
            value: "test-value".to_string(),
            ..Default::default()
        };

        store.add(&item).await.unwrap();

        let retrieved = store.get("test-1").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().key, "test-key");
    }

    #[tokio::test]
    async fn test_personal_store_delete() {
        let store = PersonalMemoryStore::in_memory().unwrap();

        let item = MemoryItem {
            id: "test-1".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            key: "test-key".to_string(),
            value: "test-value".to_string(),
            ..Default::default()
        };

        store.add(&item).await.unwrap();
        store.delete("test-1").await.unwrap();

        let retrieved = store.get("test-1").await.unwrap();
        assert!(retrieved.is_none());
    }

    #[tokio::test]
    async fn test_personal_store_search() {
        let store = PersonalMemoryStore::in_memory().unwrap();

        let item = MemoryItem {
            id: "test-1".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            key: "preference-theme".to_string(),
            value: "dark mode".to_string(),
            ..Default::default()
        };

        store.add(&item).await.unwrap();

        let query = MemoryQuery {
            query: "preference".to_string(),
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            ..Default::default()
        };

        let results = store.search(&query).await.unwrap();
        assert_eq!(results.len(), 1);
        assert!(results[0].key.contains("preference"));
    }

    #[tokio::test]
    async fn test_personal_store_merge() {
        let store = PersonalMemoryStore::in_memory().unwrap();

        let item1 = MemoryItem {
            id: "test-merge".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            key: "test-key".to_string(),
            value: "original value".to_string(),
            confidence: 0.9,
            ..Default::default()
        };

        store.add(&item1).await.unwrap();

        let item2 = MemoryItem {
            id: "test-merge-2".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            value: "new information".to_string(),
            confidence: 0.8,
            ..Default::default()
        };

        store.merge("test-merge", &item2).await.unwrap();

        let retrieved = store.get("test-merge").await.unwrap().unwrap();
        assert!(retrieved.value.contains("original value"));
        assert!(retrieved.value.contains("new information"));
        assert!((retrieved.confidence - 0.85).abs() < 0.01);
    }
}
