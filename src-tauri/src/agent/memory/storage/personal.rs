//! L1 Personal memory storage.

use std::sync::Arc;
use tokio::sync::RwLock;

use async_trait::async_trait;

use super::layer::{MemoryStore, PermissionBoundary};
use super::super::types::{MemoryItem, MemoryLayer, MemoryQuery};
use super::super::config::MemoryError;

/// In-memory personal memory store
/// In production, this would be backed by SQLite with encryption
pub struct PersonalMemoryStore {
    items: Arc<RwLock<Vec<MemoryItem>>>,
}

impl PersonalMemoryStore {
    pub fn new() -> Self {
        Self {
            items: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Create with initial capacity
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            items: Arc::new(RwLock::new(Vec::with_capacity(capacity))),
        }
    }

    /// Get all items for a specific user
    pub async fn get_by_user(&self, user_id: &str) -> Vec<MemoryItem> {
        let items = self.items.read().await;
        items
            .iter()
            .filter(|item| item.user_id.as_deref() == Some(user_id) && !item.is_deleted)
            .cloned()
            .collect()
    }

    /// Get items by session key
    pub async fn get_by_session(&self, session_key: &str) -> Vec<MemoryItem> {
        let items = self.items.read().await;
        items
            .iter()
            .filter(|item| item.session_key.as_deref() == Some(session_key) && !item.is_deleted)
            .cloned()
            .collect()
    }

    /// Get items by category
    pub async fn get_by_category(&self, user_id: &str, category: &str) -> Vec<MemoryItem> {
        let items = self.items.read().await;
        items
            .iter()
            .filter(|item| {
                item.user_id.as_deref() == Some(user_id)
                    && !item.is_deleted
                    && format!("{:?}", item.category).to_lowercase() == category.to_lowercase()
            })
            .cloned()
            .collect()
    }
}

impl Default for PersonalMemoryStore {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl MemoryStore for PersonalMemoryStore {
    async fn add(&self, item: &MemoryItem) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        // Validate layer
        if item.layer != MemoryLayer::Personal {
            return Err(MemoryError::OperationFailed(
                "PersonalMemoryStore can only store personal memories".to_string(),
            ));
        }

        // Check for duplicate key for same user
        let has_duplicate = items.iter().any(|i| {
            i.tenant_id == item.tenant_id
                && i.user_id == item.user_id
                && i.key == item.key
                && !i.is_deleted
        });

        if has_duplicate {
            return Err(MemoryError::OperationFailed(
                "Memory with this key already exists for user".to_string(),
            ));
        }

        items.push(item.clone());
        Ok(())
    }

    async fn update(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(existing) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            // Verify user matches
            if existing.user_id != item.user_id {
                return Err(MemoryError::PermissionDenied(
                    "Cannot update memory belonging to another user".to_string(),
                ));
            }
            *existing = item.clone();
            existing.updated_at = chrono::Utc::now().timestamp();
            existing.version += 1;
            Ok(())
        } else {
            Err(MemoryError::NotFound(id.to_string()))
        }
    }

    async fn delete(&self, id: &str) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(item) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            item.is_deleted = true;
            item.updated_at = chrono::Utc::now().timestamp();
            Ok(())
        } else {
            Err(MemoryError::NotFound(id.to_string()))
        }
    }

    async fn get(&self, id: &str) -> Result<Option<MemoryItem>, MemoryError> {
        let items = self.items.read().await;
        Ok(items
            .iter()
            .find(|i| i.id == id && !i.is_deleted)
            .cloned())
    }

    async fn search(&self, query: &MemoryQuery) -> Result<Vec<MemoryItem>, MemoryError> {
        let items = self.items.read().await;

        let results: Vec<MemoryItem> = items
            .iter()
            .filter(|item| {
                if item.is_deleted {
                    return false;
                }
                // Filter by tenant
                if item.tenant_id != query.tenant_id {
                    return false;
                }
                // Filter by user if specified
                if let Some(ref query_user) = query.user_id {
                    if item.user_id.as_deref() != Some(query_user) {
                        return false;
                    }
                }
                // Filter by layer
                if let Some(ref layer) = query.layer {
                    if item.layer != *layer {
                        return false;
                    }
                }
                // Filter by category
                if let Some(ref cat) = query.category {
                    if item.category != *cat {
                        return false;
                    }
                }
                // Simple text search on key and value
                if !query.query.is_empty() {
                    let query_lower = query.query.to_lowercase();
                    if !item.key.to_lowercase().contains(&query_lower)
                        && !item.value.to_lowercase().contains(&query_lower)
                    {
                        return false;
                    }
                }
                true
            })
            .take(query.k)
            .cloned()
            .collect();

        Ok(results)
    }

    async fn find_similar(&self, _item: &MemoryItem, _threshold: f64) -> Result<Vec<MemoryItem>, MemoryError> {
        // In a full implementation, this would use vector similarity
        // For now, return empty
        Ok(Vec::new())
    }

    async fn update_access_stats(&self, id: &str) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(item) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            item.access_count += 1;
            item.last_accessed_at = Some(chrono::Utc::now().timestamp());
            Ok(())
        } else {
            Err(MemoryError::NotFound(id.to_string()))
        }
    }

    async fn merge(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(existing) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            // Merge value by appending
            if !existing.value.contains(&item.value) {
                existing.value = format!("{}\n---\n{}", existing.value, item.value);
            }
            // Update confidence to average
            existing.confidence = (existing.confidence + item.confidence) / 2.0;
            existing.updated_at = chrono::Utc::now().timestamp();
            existing.version += 1;
            Ok(())
        } else {
            Err(MemoryError::NotFound(id.to_string()))
        }
    }

    async fn hard_delete(&self, id: &str) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;
        let original_len = items.len();
        items.retain(|i| i.id != id);
        if items.len() == original_len {
            Err(MemoryError::NotFound(id.to_string()))
        } else {
            Ok(())
        }
    }

    async fn count(&self) -> Result<usize, MemoryError> {
        let items = self.items.read().await;
        Ok(items.iter().filter(|i| !i.is_deleted).count())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_personal_store_add_and_get() {
        let store = PersonalMemoryStore::new();

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
        let store = PersonalMemoryStore::new();

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
        let store = PersonalMemoryStore::new();

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
}
