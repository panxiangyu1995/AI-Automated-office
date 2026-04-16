//! Three-layer storage abstraction.

use async_trait::async_trait;

use super::super::types::{MemoryItem, MemoryLayer, MemoryQuery};
use super::super::config::MemoryError;

/// Permission boundary for memory access
#[derive(Debug, Clone)]
pub struct PermissionBoundary {
    pub layer: MemoryLayer,
    pub tenant_id: String,
    pub user_id: Option<String>,
}

impl PermissionBoundary {
    /// Check if a user can access a memory item
    pub fn can_access(&self, item: &MemoryItem) -> bool {
        // Tenant must match
        if item.tenant_id != self.tenant_id {
            return false;
        }

        // Layer must match or be more permissive
        match (&self.layer, &item.layer) {
            // L1 Personal: user must match
            (MemoryLayer::Personal, MemoryLayer::Personal) => {
                self.user_id.as_ref() == item.user_id.as_ref()
            }
            // L2 Enterprise: same tenant, any user
            (MemoryLayer::Enterprise, MemoryLayer::Enterprise) => true,
            // Graph layer not yet implemented
            (MemoryLayer::Graph, _) | (_, MemoryLayer::Graph) => false,
            // Personal cannot access enterprise directly
            (MemoryLayer::Personal, MemoryLayer::Enterprise) => false,
            // Enterprise accessing personal requires user match
            (MemoryLayer::Enterprise, MemoryLayer::Personal) => {
                self.user_id.as_ref() == item.user_id.as_ref()
            }
        }
    }
}

/// Memory storage trait
#[async_trait]
pub trait MemoryStore: Send + Sync {
    /// Add a new memory item
    async fn add(&self, item: &MemoryItem) -> Result<(), MemoryError>;

    /// Update an existing memory item
    async fn update(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError>;

    /// Delete a memory item (soft delete)
    async fn delete(&self, id: &str) -> Result<(), MemoryError>;

    /// Get a memory item by ID
    async fn get(&self, id: &str) -> Result<Option<MemoryItem>, MemoryError>;

    /// Search memories
    async fn search(&self, query: &MemoryQuery) -> Result<Vec<MemoryItem>, MemoryError>;

    /// Find similar memories
    async fn find_similar(&self, item: &MemoryItem, threshold: f64) -> Result<Vec<MemoryItem>, MemoryError>;

    /// Update access statistics
    async fn update_access_stats(&self, id: &str) -> Result<(), MemoryError>;

    /// Merge a memory item with existing
    async fn merge(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError>;

    /// Hard delete (for permanent removal)
    async fn hard_delete(&self, id: &str) -> Result<(), MemoryError>;

    /// Count items
    async fn count(&self) -> Result<usize, MemoryError>;
}

/// Memory storage wrapper with permission enforcement
pub struct PermissionedStore<S> {
    inner: S,
}

impl<S: MemoryStore> PermissionedStore<S> {
    pub fn new(inner: S) -> Self {
        Self { inner }
    }

    /// Search with permission filtering
    pub async fn search_with_permission(
        &self,
        query: &MemoryQuery,
        boundary: &PermissionBoundary,
    ) -> Result<Vec<MemoryItem>, MemoryError> {
        let items = self.inner.search(query).await?;
        Ok(items
            .into_iter()
            .filter(|item| boundary.can_access(item))
            .collect())
    }

    /// Get with permission check
    pub async fn get_with_permission(
        &self,
        id: &str,
        boundary: &PermissionBoundary,
    ) -> Result<Option<MemoryItem>, MemoryError> {
        if let Some(item) = self.inner.get(id).await? {
            if boundary.can_access(&item) {
                return Ok(Some(item));
            }
            return Err(MemoryError::PermissionDenied(
                "User does not have permission to access this memory".to_string(),
            ));
        }
        Ok(None)
    }
}

/// Create a permission boundary for the given context
pub fn create_permission_boundary(
    layer: MemoryLayer,
    tenant_id: String,
    user_id: Option<String>,
) -> PermissionBoundary {
    PermissionBoundary {
        layer,
        tenant_id,
        user_id,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_personal_same_user() {
        let boundary = PermissionBoundary {
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
        };

        let item = MemoryItem {
            id: "item-1".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            ..Default::default()
        };

        assert!(boundary.can_access(&item));
    }

    #[test]
    fn test_permission_personal_different_user() {
        let boundary = PermissionBoundary {
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
        };

        let item = MemoryItem {
            id: "item-1".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-2".to_string()),
            ..Default::default()
        };

        assert!(!boundary.can_access(&item));
    }

    #[test]
    fn test_permission_enterprise_same_tenant() {
        let boundary = PermissionBoundary {
            layer: MemoryLayer::Enterprise,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
        };

        let item = MemoryItem {
            id: "item-1".to_string(),
            layer: MemoryLayer::Enterprise,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-2".to_string()), // Different user
            ..Default::default()
        };

        assert!(boundary.can_access(&item));
    }
}
