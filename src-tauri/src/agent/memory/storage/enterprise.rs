//! L2 Enterprise knowledge base storage with SQLite persistence.

use async_trait::async_trait;
use rusqlite::ToSql;
use std::sync::Arc;

use super::backend::{SqliteStorage, StorageBackend, map_memory_item};
use super::layer::MemoryStore;
use super::super::types::{MemoryItem, MemoryLayer, MemoryQuery};
use super::super::config::MemoryError;

/// Department level for enterprise knowledge
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct DepartmentId(pub String);

impl DepartmentId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }
}

/// Knowledge approval status
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

/// Knowledge metadata for enterprise items
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnterpriseMetadata {
    pub department_id: Option<String>,
    pub approval_status: ApprovalStatus,
    pub approved_by: Option<String>,
    pub approved_at: Option<i64>,
    pub tags: Vec<String>,
}

impl Default for EnterpriseMetadata {
    fn default() -> Self {
        Self {
            department_id: None,
            approval_status: ApprovalStatus::Pending,
            approved_by: None,
            approved_at: None,
            tags: Vec::new(),
        }
    }
}

/// Enterprise knowledge store backed by SQLite
pub struct EnterpriseKnowledgeStore {
    storage: Arc<SqliteStorage>,
}

impl EnterpriseKnowledgeStore {
    /// Create a new enterprise knowledge store with the given SQLite storage
    pub fn new(storage: SqliteStorage) -> Self {
        Self {
            storage: Arc::new(storage),
        }
    }

    /// Create with default database path
    pub async fn with_default_db() -> Result<Self, MemoryError> {
        let db_path = dirs::data_local_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("ai-automated-office")
            .join("memory_enterprise.db");

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

    /// Get all items for a tenant
    pub async fn get_by_tenant(&self, tenant_id: &str) -> Result<Vec<MemoryItem>, MemoryError> {
        let sql = r#"
            SELECT * FROM memory_items
            WHERE is_deleted = 0
              AND layer = 'Enterprise'
              AND tenant_id = ?
            ORDER BY updated_at DESC
        "#;

        let items: Vec<MemoryItem> = self.storage
            .query(sql, map_memory_item)
            .await
            .map_err(|e| MemoryError::Storage(format!("get_by_tenant failed: {}", e)))?;

        Ok(items)
    }

    /// Get approved items only
    pub async fn get_approved(&self, tenant_id: &str) -> Result<Vec<MemoryItem>, MemoryError> {
        let sql = r#"
            SELECT * FROM memory_items
            WHERE is_deleted = 0
              AND layer = 'Enterprise'
              AND tenant_id = ?
              AND (metadata NOT LIKE '%"approval_status":"pending"%' OR metadata NOT LIKE '%approval_status%')
            ORDER BY updated_at DESC
        "#;

        let items: Vec<MemoryItem> = self.storage
            .query(sql, map_memory_item)
            .await
            .map_err(|e| MemoryError::Storage(format!("get_approved failed: {}", e)))?;

        Ok(items)
    }

    /// Get items by department
    pub async fn get_by_department(
        &self,
        tenant_id: &str,
        department_id: &str,
    ) -> Result<Vec<MemoryItem>, MemoryError> {
        let sql = r#"
            SELECT * FROM memory_items
            WHERE is_deleted = 0
              AND layer = 'Enterprise'
              AND tenant_id = ?
              AND json_extract(metadata, '$.department_id') = ?
            ORDER BY updated_at DESC
        "#;

        let items: Vec<MemoryItem> = self.storage
            .query(sql, map_memory_item)
            .await
            .map_err(|e| MemoryError::Storage(format!("get_by_department failed: {}", e)))?;

        Ok(items)
    }

    /// Submit for approval
    pub async fn submit_for_approval(&self, id: &str) -> Result<(), MemoryError> {
        let sql = r#"
            UPDATE memory_items
            SET metadata = json_set(metadata, '$.approval_status', 'pending'),
                updated_at = ?
            WHERE id = ? AND is_deleted = 0 AND layer = 'Enterprise'
        "#;

        self.storage.execute_with_params(sql, &[
            &chrono::Utc::now().timestamp() as &dyn ToSql,
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("submit_for_approval failed: {}", e)))?;

        Ok(())
    }

    /// Approve knowledge item
    pub async fn approve(&self, id: &str, approved_by: &str) -> Result<(), MemoryError> {
        let sql = r#"
            UPDATE memory_items
            SET metadata = json_set(json_set(metadata, '$.approval_status', 'approved'),
                                     '$.approved_by', ?),
                updated_at = ?
            WHERE id = ? AND is_deleted = 0 AND layer = 'Enterprise'
        "#;

        self.storage.execute_with_params(sql, &[
            &approved_by as &dyn ToSql,
            &chrono::Utc::now().timestamp() as &dyn ToSql,
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("approve failed: {}", e)))?;

        Ok(())
    }

    /// Reject knowledge item
    pub async fn reject(&self, id: &str, rejected_by: &str) -> Result<(), MemoryError> {
        let sql = r#"
            UPDATE memory_items
            SET metadata = json_set(json_set(metadata, '$.approval_status', 'rejected'),
                                     '$.rejected_by', ?),
                updated_at = ?
            WHERE id = ? AND is_deleted = 0 AND layer = 'Enterprise'
        "#;

        self.storage.execute_with_params(sql, &[
            &rejected_by as &dyn ToSql,
            &chrono::Utc::now().timestamp() as &dyn ToSql,
            &id as &dyn ToSql,
        ]).await.map_err(|e| MemoryError::Storage(format!("reject failed: {}", e)))?;

        Ok(())
    }
}

#[async_trait]
impl MemoryStore for EnterpriseKnowledgeStore {
    async fn add(&self, item: &MemoryItem) -> Result<(), MemoryError> {
        if item.layer != MemoryLayer::Enterprise {
            return Err(MemoryError::OperationFailed(
                "EnterpriseKnowledgeStore can only store enterprise memories".to_string(),
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
            &Option::<String>::None as &dyn ToSql,
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

        self.storage.execute_with_params(sql, &[
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
        let sql = r#"
            SELECT * FROM memory_items
            WHERE is_deleted = 0
              AND layer = 'Enterprise'
              AND tenant_id = ?
              AND (key LIKE ? OR value LIKE ?)
              AND (metadata NOT LIKE '%"approval_status":"pending"%' OR metadata NOT LIKE '%approval_status%')
            ORDER BY updated_at DESC
            LIMIT ?
        "#;

        let like_pattern = format!("%{}%", query.query);

        let items: Vec<MemoryItem> = self.storage
            .query(sql, map_memory_item)
            .await
            .map_err(|e| MemoryError::Storage(format!("search failed: {}", e)))?;

        // Filter by category if specified
        let mut results: Vec<MemoryItem> = items;
        if let Some(ref cat) = query.category {
            results.retain(|item| item.category == *cat);
        }

        // Apply limit
        results.truncate(query.k);

        Ok(results)
    }

    async fn find_similar(&self, _item: &MemoryItem, _threshold: f64) -> Result<Vec<MemoryItem>, MemoryError> {
        // TODO: Implement vector similarity search using sqlite-vec
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
        let sql = "SELECT COUNT(*) as count FROM memory_items WHERE is_deleted = 0 AND layer = 'Enterprise'";

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
    async fn test_enterprise_store_add_and_get() {
        let store = EnterpriseKnowledgeStore::in_memory().unwrap();

        let item = MemoryItem {
            id: "test-1".to_string(),
            layer: MemoryLayer::Enterprise,
            tenant_id: "tenant-1".to_string(),
            key: "company-policy".to_string(),
            value: "Leave policy: 10 days".to_string(),
            ..Default::default()
        };

        store.add(&item).await.unwrap();

        let retrieved = store.get("test-1").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().key, "company-policy");
    }

    #[tokio::test]
    async fn test_enterprise_store_approval() {
        let store = EnterpriseKnowledgeStore::in_memory().unwrap();

        let item = MemoryItem {
            id: "test-1".to_string(),
            layer: MemoryLayer::Enterprise,
            tenant_id: "tenant-1".to_string(),
            key: "company-policy".to_string(),
            value: "Leave policy: 10 days".to_string(),
            ..Default::default()
        };

        store.add(&item).await.unwrap();
        store.approve("test-1", "admin-1").await.unwrap();

        let retrieved = store.get("test-1").await.unwrap().unwrap();
        assert_eq!(retrieved.metadata["approval_status"], "approved");
    }

    #[tokio::test]
    async fn test_enterprise_store_search() {
        let store = EnterpriseKnowledgeStore::in_memory().unwrap();

        let item = MemoryItem {
            id: "test-search".to_string(),
            layer: MemoryLayer::Enterprise,
            tenant_id: "tenant-1".to_string(),
            key: "hr-policy".to_string(),
            value: "Vacation policy details".to_string(),
            ..Default::default()
        };

        store.add(&item).await.unwrap();

        let query = MemoryQuery {
            query: "policy".to_string(),
            tenant_id: "tenant-1".to_string(),
            ..Default::default()
        };

        let results = store.search(&query).await.unwrap();
        assert_eq!(results.len(), 1);
    }
}
