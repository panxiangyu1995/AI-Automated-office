//! Knowledge base permission module.
//!
//! Implements the permission model for knowledge bases, following Dify's approach:
//! - OnlyMe: Only the owner can access
//! - AllTeam: All team members can access
//! - PartialTeam: Only specified members can access

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Knowledge permission type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum KnowledgePermission {
    /// Only the owner can access
    OnlyMe,
    /// All team members can access
    AllTeam,
    /// Only specified members can access
    PartialTeam,
}

impl Default for KnowledgePermission {
    fn default() -> Self {
        Self::PartialTeam
    }
}

/// Access level for knowledge base operations
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AccessLevel {
    /// Read-only access
    Read,
    /// Read and write access
    Write,
    /// Full access including member management and deletion
    Admin,
}

impl AccessLevel {
    /// Check if this level includes the specified level
    pub fn includes(&self, other: AccessLevel) -> bool {
        match (self, other) {
            (AccessLevel::Admin, _) => true,
            (AccessLevel::Write, AccessLevel::Read) => true,
            (AccessLevel::Write, AccessLevel::Write) => true,
            (AccessLevel::Read, AccessLevel::Read) => true,
            _ => false,
        }
    }
}

/// User context for permission checks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserContext {
    pub user_id: String,
    pub tenant_id: String,
    pub department_id: Option<String>,
}

/// Knowledge base entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeBase {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub tenant_id: String,
    pub owner_id: String,
    pub permission: KnowledgePermission,
    pub tags: Vec<String>,
    pub embedding_model: Option<String>,
    pub indexing_technique: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub document_count: usize,
    pub chunk_count: usize,
}

/// Knowledge base summary (for list views)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeBaseSummary {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub permission: KnowledgePermission,
    pub tags: Vec<String>,
    pub document_count: usize,
    pub chunk_count: usize,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<&KnowledgeBase> for KnowledgeBaseSummary {
    fn from(kb: &KnowledgeBase) -> Self {
        Self {
            id: kb.id.clone(),
            name: kb.name.clone(),
            description: kb.description.clone(),
            permission: kb.permission,
            tags: kb.tags.clone(),
            document_count: kb.document_count,
            chunk_count: kb.chunk_count,
            created_at: kb.created_at,
            updated_at: kb.updated_at,
        }
    }
}

/// Knowledge base permission record (member permissions)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgePermissionRecord {
    pub id: String,
    pub knowledge_base_id: String,
    pub user_id: String,
    pub tenant_id: String,
    pub access_level: AccessLevel,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Knowledge base member info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeMember {
    pub user_id: String,
    pub access_level: AccessLevel,
    pub is_owner: bool,
    pub joined_at: DateTime<Utc>,
}

/// Permission check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionCheckResult {
    pub allowed: bool,
    pub reason: Option<String>,
    pub required_level: Option<AccessLevel>,
}

/// Permission service for checking access rights
pub struct PermissionService {
    permission_cache: Arc<RwLock<std::collections::HashMap<String, PermissionCacheEntry>>>,
}

/// Cache entry for permission checks
struct PermissionCacheEntry {
    allowed: bool,
    cached_at: i64,
}

impl PermissionService {
    pub fn new() -> Self {
        Self {
            permission_cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Check if user has access to the knowledge base
    pub async fn check_access(
        &self,
        user: &UserContext,
        knowledge_base: &KnowledgeBase,
        required_level: AccessLevel,
    ) -> PermissionCheckResult {
        // Tenant isolation check
        if user.tenant_id != knowledge_base.tenant_id {
            return PermissionCheckResult {
                allowed: false,
                reason: Some("Tenant mismatch".to_string()),
                required_level: Some(required_level),
            };
        }

        // Owner bypass - owner has full access
        if user.user_id == knowledge_base.owner_id {
            return PermissionCheckResult {
                allowed: true,
                reason: Some("Owner bypass".to_string()),
                required_level: None,
            };
        }

        // Check based on permission type
        match knowledge_base.permission {
            KnowledgePermission::OnlyMe => {
                PermissionCheckResult {
                    allowed: false,
                    reason: Some("Knowledge base is private (OnlyMe)".to_string()),
                    required_level: Some(required_level),
                }
            }
            KnowledgePermission::AllTeam => {
                // All team members have at least read access
                let allowed = required_level == AccessLevel::Read;
                PermissionCheckResult {
                    allowed,
                    reason: if allowed {
                        Some("AllTeam access".to_string())
                    } else {
                        Some("AllTeam only allows Read access".to_string())
                    },
                    required_level: Some(required_level),
                }
            }
            KnowledgePermission::PartialTeam => {
                // Need explicit permission record
                PermissionCheckResult {
                    allowed: false,
                    reason: Some("PartialTeam requires explicit permission".to_string()),
                    required_level: Some(required_level),
                }
            }
        }
    }

    /// Check explicit permission from knowledge_permissions table
    pub async fn check_explicit_permission(
        &self,
        user_id: &str,
        knowledge_base_id: &str,
        required_level: AccessLevel,
        permission_record: Option<&KnowledgePermissionRecord>,
    ) -> PermissionCheckResult {
        match permission_record {
            Some(record) if record.user_id == user_id && record.knowledge_base_id == knowledge_base_id => {
                if record.access_level.includes(required_level) {
                    PermissionCheckResult {
                        allowed: true,
                        reason: Some("Explicit permission granted".to_string()),
                        required_level: None,
                    }
                } else {
                    PermissionCheckResult {
                        allowed: false,
                        reason: Some(format!(
                            "Insufficient permission level: {:?} required, {:?} granted",
                            required_level, record.access_level
                        )),
                        required_level: Some(required_level),
                    }
                }
            }
            _ => PermissionCheckResult {
                allowed: false,
                reason: Some("No permission record found".to_string()),
                required_level: Some(required_level),
            },
        }
    }

    /// Get access level for a user
    pub async fn get_access_level(
        &self,
        user: &UserContext,
        knowledge_base: &KnowledgeBase,
        permission_record: Option<&KnowledgePermissionRecord>,
    ) -> AccessLevel {
        // Owner has Admin access
        if user.user_id == knowledge_base.owner_id {
            return AccessLevel::Admin;
        }

        // Tenant mismatch - no access
        if user.tenant_id != knowledge_base.tenant_id {
            return AccessLevel::Read; // Minimum level
        }

        match knowledge_base.permission {
            KnowledgePermission::OnlyMe => AccessLevel::Read,
            KnowledgePermission::AllTeam => AccessLevel::Read,
            KnowledgePermission::PartialTeam => {
                permission_record
                    .map(|r| r.access_level)
                    .unwrap_or(AccessLevel::Read)
            }
        }
    }

    /// Clear permission cache
    pub async fn clear_cache(&self) {
        let mut cache = self.permission_cache.write().await;
        cache.clear();
    }
}

impl Default for PermissionService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_kb(permission: KnowledgePermission, owner_id: &str) -> KnowledgeBase {
        KnowledgeBase {
            id: "kb1".to_string(),
            name: "Test KB".to_string(),
            description: None,
            tenant_id: "tenant1".to_string(),
            owner_id: owner_id.to_string(),
            permission,
            tags: vec![],
            embedding_model: None,
            indexing_technique: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            created_by: "creator".to_string(),
            document_count: 0,
            chunk_count: 0,
        }
    }

    fn create_test_user(user_id: &str, tenant_id: &str) -> UserContext {
        UserContext {
            user_id: user_id.to_string(),
            tenant_id: tenant_id.to_string(),
            department_id: None,
        }
    }

    #[tokio::test]
    async fn test_owner_bypass() {
        let service = PermissionService::new();
        let kb = create_test_kb(KnowledgePermission::OnlyMe, "owner1");
        let user = create_test_user("owner1", "tenant1");

        let result = service.check_access(&user, &kb, AccessLevel::Admin).await;
        assert!(result.allowed);
        assert_eq!(result.reason, Some("Owner bypass".to_string()));
    }

    #[tokio::test]
    async fn test_onlyme_denies_non_owner() {
        let service = PermissionService::new();
        let kb = create_test_kb(KnowledgePermission::OnlyMe, "owner1");
        let user = create_test_user("other_user", "tenant1");

        let result = service.check_access(&user, &kb, AccessLevel::Read).await;
        assert!(!result.allowed);
    }

    #[tokio::test]
    async fn test_allteam_read_access() {
        let service = PermissionService::new();
        let kb = create_test_kb(KnowledgePermission::AllTeam, "owner1");
        let user = create_test_user("team_member", "tenant1");

        let result = service.check_access(&user, &kb, AccessLevel::Read).await;
        assert!(result.allowed);
    }

    #[tokio::test]
    async fn test_allteam_write_denied() {
        let service = PermissionService::new();
        let kb = create_test_kb(KnowledgePermission::AllTeam, "owner1");
        let user = create_test_user("team_member", "tenant1");

        let result = service.check_access(&user, &kb, AccessLevel::Write).await;
        assert!(!result.allowed);
    }

    #[tokio::test]
    async fn test_tenant_mismatch() {
        let service = PermissionService::new();
        let kb = create_test_kb(KnowledgePermission::AllTeam, "owner1");
        let user = create_test_user("team_member", "other_tenant");

        let result = service.check_access(&user, &kb, AccessLevel::Read).await;
        assert!(!result.allowed);
        assert_eq!(result.reason, Some("Tenant mismatch".to_string()));
    }

    #[test]
    fn test_access_level_includes() {
        assert!(AccessLevel::Admin.includes(AccessLevel::Read));
        assert!(AccessLevel::Admin.includes(AccessLevel::Write));
        assert!(AccessLevel::Admin.includes(AccessLevel::Admin));
        assert!(AccessLevel::Write.includes(AccessLevel::Read));
        assert!(!AccessLevel::Write.includes(AccessLevel::Write)); // Same level, not includes
        assert!(AccessLevel::Read.includes(AccessLevel::Read));
        assert!(!AccessLevel::Read.includes(AccessLevel::Write));
    }
}
