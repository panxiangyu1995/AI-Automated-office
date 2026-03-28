//! L2 Enterprise knowledge base storage.

use std::sync::Arc;
use tokio::sync::RwLock;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

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
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

/// Knowledge metadata for enterprise items
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// In-memory enterprise knowledge store
/// In production, this would be backed by SQLite with department-level access control
pub struct EnterpriseKnowledgeStore {
    items: Arc<RwLock<Vec<MemoryItem>>>,
}

impl EnterpriseKnowledgeStore {
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

    /// Get all items for a tenant
    pub async fn get_by_tenant(&self, tenant_id: &str) -> Vec<MemoryItem> {
        let items = self.items.read().await;
        items
            .iter()
            .filter(|item| item.tenant_id == tenant_id && !item.is_deleted)
            .cloned()
            .collect()
    }

    /// Get approved items only
    pub async fn get_approved(&self, tenant_id: &str) -> Vec<MemoryItem> {
        let items = self.items.read().await;
        items
            .iter()
            .filter(|item| {
                if item.tenant_id != tenant_id || item.is_deleted {
                    return false;
                }
                // Check approval status in metadata
                if let Some(status) = item.metadata.get("approval_status") {
                    return status != "pending";
                }
                true // No status means approved (backwards compatible)
            })
            .cloned()
            .collect()
    }

    /// Get items by department
    pub async fn get_by_department(&self, tenant_id: &str, department_id: &str) -> Vec<MemoryItem> {
        let items = self.items.read().await;
        items
            .iter()
            .filter(|item| {
                if item.tenant_id != tenant_id || item.is_deleted {
                    return false;
                }
                if let Some(dept) = item.metadata.get("department_id") {
                    return dept == department_id;
                }
                false
            })
            .cloned()
            .collect()
    }

    /// Submit for approval
    pub async fn submit_for_approval(&self, id: &str) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(item) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            if item.layer != MemoryLayer::Enterprise {
                return Err(MemoryError::OperationFailed(
                    "Only enterprise memories can be submitted for approval".to_string(),
                ));
            }
            item.metadata["approval_status"] = serde_json::json!("pending");
            item.updated_at = chrono::Utc::now().timestamp();
            Ok(())
        } else {
            Err(MemoryError::NotFound(id.to_string()))
        }
    }

    /// Approve knowledge item
    pub async fn approve(&self, id: &str, approved_by: &str) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(item) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            item.metadata["approval_status"] = serde_json::json!("approved");
            item.metadata["approved_by"] = serde_json::json!(approved_by);
            item.metadata["approved_at"] = serde_json::json!(chrono::Utc::now().timestamp());
            item.updated_at = chrono::Utc::now().timestamp();
            Ok(())
        } else {
            Err(MemoryError::NotFound(id.to_string()))
        }
    }

    /// Reject knowledge item
    pub async fn reject(&self, id: &str, rejected_by: &str) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(item) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            item.metadata["approval_status"] = serde_json::json!("rejected");
            item.metadata["rejected_by"] = serde_json::json!(rejected_by);
            item.updated_at = chrono::Utc::now().timestamp();
            Ok(())
        } else {
            Err(MemoryError::NotFound(id.to_string()))
        }
    }
}

impl Default for EnterpriseKnowledgeStore {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl MemoryStore for EnterpriseKnowledgeStore {
    async fn add(&self, item: &MemoryItem) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        // Validate layer
        if item.layer != MemoryLayer::Enterprise {
            return Err(MemoryError::OperationFailed(
                "EnterpriseKnowledgeStore can only store enterprise memories".to_string(),
            ));
        }

        // Check for duplicate key for same tenant
        let has_duplicate = items.iter().any(|i| {
            i.tenant_id == item.tenant_id
                && i.key == item.key
                && !i.is_deleted
        });

        if has_duplicate {
            return Err(MemoryError::OperationFailed(
                "Knowledge with this key already exists for tenant".to_string(),
            ));
        }

        items.push(item.clone());
        Ok(())
    }

    async fn update(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError> {
        let mut items = self.items.write().await;

        if let Some(existing) = items.iter_mut().find(|i| i.id == id && !i.is_deleted) {
            // Enterprise items don't have user_id restriction
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
                // Filter by tenant (required for enterprise)
                if item.tenant_id != query.tenant_id {
                    return false;
                }
                // Filter by layer
                if let Some(ref layer) = query.layer {
                    if item.layer != *layer {
                        return false;
                    }
                } else {
                    // Default to enterprise layer
                    if item.layer != MemoryLayer::Enterprise {
                        return false;
                    }
                }
                // Filter by category
                if let Some(ref cat) = query.category {
                    if item.category != *cat {
                        return false;
                    }
                }
                // Text search on key and value
                if !query.query.is_empty() {
                    let query_lower = query.query.to_lowercase();
                    if !item.key.to_lowercase().contains(&query_lower)
                        && !item.value.to_lowercase().contains(&query_lower)
                    {
                        return false;
                    }
                }
                // Filter out pending items by default
                if let Some(status) = item.metadata.get("approval_status") {
                    if status == "pending" {
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
            if !existing.value.contains(&item.value) {
                existing.value = format!("{}\n---\n{}", existing.value, item.value);
            }
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
    async fn test_enterprise_store_add_and_get() {
        let store = EnterpriseKnowledgeStore::new();

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
        let store = EnterpriseKnowledgeStore::new();

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
}
