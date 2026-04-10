//! Tenant Context - Execution context for multi-tenant support
//!
//! This module defines the TenantContext structure that carries tenant,
//! user, and role information through the execution pipeline.

use serde::{Deserialize, Serialize};

use super::metadata::SessionMetadata;

/// Execution context for tenant-aware operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantContext {
    /// Tenant ID
    pub tenant_id: String,
    
    /// User ID
    pub user_id: String,
    
    /// User role
    pub role: String,
    
    /// Department ID (optional)
    pub department_id: Option<String>,
}

impl TenantContext {
    /// Create TenantContext from SessionMetadata
    pub fn from_metadata(metadata: &SessionMetadata) -> Self {
        Self {
            tenant_id: metadata.tenant_id.clone(),
            user_id: metadata.user_id.clone(),
            role: "user".to_string(), // TODO: Get from user profile
            department_id: None,
        }
    }
    
    /// Create TenantContext from user and tenant IDs
    pub fn new(tenant_id: String, user_id: String, role: String) -> Self {
        Self {
            tenant_id,
            user_id,
            role,
            department_id: None,
        }
    }
    
    /// Set department ID
    pub fn with_department(mut self, department_id: Option<String>) -> Self {
        self.department_id = department_id;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tenant_context_creation() {
        let ctx = TenantContext::new(
            "tenant-1".to_string(),
            "user-1".to_string(),
            "admin".to_string(),
        );
        
        assert_eq!(ctx.tenant_id, "tenant-1");
        assert_eq!(ctx.user_id, "user-1");
        assert_eq!(ctx.role, "admin");
        assert!(ctx.department_id.is_none());
    }

    #[test]
    fn test_tenant_context_with_department() {
        let ctx = TenantContext::new(
            "tenant-1".to_string(),
            "user-1".to_string(),
            "manager".to_string(),
        ).with_department(Some("sales".to_string()));
        
        assert_eq!(ctx.department_id, Some("sales".to_string()));
    }

    #[test]
    fn test_tenant_context_from_metadata() {
        let metadata = SessionMetadata::new(
            "user-123".to_string(),
            "testuser".to_string(),
            "tenant-456".to_string(),
            "refresh-token-xyz".to_string(),
            3600,
        );
        
        let ctx = TenantContext::from_metadata(&metadata);
        
        assert_eq!(ctx.tenant_id, "tenant-456");
        assert_eq!(ctx.user_id, "user-123");
        assert_eq!(ctx.role, "user");
    }
}
