//! Knowledge base CRUD commands module.
//!
//! Implements Tauri commands for knowledge base operations.

use crate::knowledge::permission::{AccessLevel, KnowledgeBase, KnowledgeBaseSummary, KnowledgePermission, KnowledgePermissionRecord, PermissionCheckResult, PermissionService, UserContext};
use crate::vector::store::VectorStore;
use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Pagination parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationParams {
    pub page: usize,
    pub page_size: usize,
}

/// Pagination result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
}

impl<T> PaginatedResult<T> {
    pub fn new(items: Vec<T>, total: usize, page: usize, page_size: usize) -> Self {
        let total_pages = if total == 0 {
            0
        } else {
            (total + page_size - 1) / page_size
        };
        Self {
            items,
            total,
            page,
            page_size,
            total_pages,
        }
    }
}

/// Knowledge base create request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateKnowledgeBaseRequest {
    pub name: String,
    pub description: Option<String>,
    pub permission: KnowledgePermission,
    pub tags: Vec<String>,
    pub embedding_model: Option<String>,
    pub indexing_technique: Option<String>,
}

/// Knowledge base update request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateKnowledgeBaseRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub permission: Option<KnowledgePermission>,
    pub tags: Option<Vec<String>>,
}

/// Knowledge base filter params
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct KnowledgeBaseFilter {
    pub search: Option<String>,
    pub tags: Option<Vec<String>>,
    pub permission: Option<KnowledgePermission>,
}

/// Knowledge base CRUD service state
pub struct KnowledgeBaseService {
    pub(crate) knowledge_bases: Arc<RwLock<std::collections::HashMap<String, KnowledgeBase>>>,
    permissions: Arc<RwLock<std::collections::HashMap<String, Vec<KnowledgePermissionRecord>>>>,
    pub(crate) permission_service: PermissionService,
}

impl KnowledgeBaseService {
    pub fn new() -> Self {
        Self {
            knowledge_bases: Arc::new(RwLock::new(std::collections::HashMap::new())),
            permissions: Arc::new(RwLock::new(std::collections::HashMap::new())),
            permission_service: PermissionService::new(),
        }
    }

    /// Create a new knowledge base
    pub async fn create(
        &self,
        user: &UserContext,
        request: CreateKnowledgeBaseRequest,
    ) -> Result<KnowledgeBase> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let kb = KnowledgeBase {
            id: id.clone(),
            name: request.name,
            description: request.description,
            tenant_id: user.tenant_id.clone(),
            owner_id: user.user_id.clone(),
            permission: request.permission,
            tags: request.tags,
            embedding_model: request.embedding_model,
            indexing_technique: request.indexing_technique,
            created_at: now,
            updated_at: now,
            created_by: user.user_id.clone(),
            document_count: 0,
            chunk_count: 0,
        };

        let mut bases = self.knowledge_bases.write().await;
        bases.insert(id, kb.clone());

        Ok(kb)
    }

    /// List knowledge bases with permission filtering
    pub async fn list(
        &self,
        user: &UserContext,
        pagination: PaginationParams,
        filter: KnowledgeBaseFilter,
    ) -> Result<PaginatedResult<KnowledgeBaseSummary>> {
        let bases = self.knowledge_bases.read().await;
        let permissions = self.permissions.read().await;

        // Filter and collect accessible knowledge bases
        let mut accessible: Vec<KnowledgeBaseSummary> = bases
            .values()
            .filter(|kb| {
                // Tenant isolation
                if kb.tenant_id != user.tenant_id {
                    return false;
                }

                // Owner always has access
                if kb.owner_id == user.user_id {
                    return true;
                }

                // Check permission type
                match kb.permission {
                    KnowledgePermission::OnlyMe => false,
                    KnowledgePermission::AllTeam => true,
                    KnowledgePermission::PartialTeam => {
                        // Check explicit permission
                        permissions
                            .get(&kb.id)
                            .map(|p| p.iter().any(|r| r.user_id == user.user_id))
                            .unwrap_or(false)
                    }
                }
            })
            .filter(|kb| {
                // Apply search filter
                if let Some(ref search) = filter.search {
                    let search_lower = search.to_lowercase();
                    if !kb.name.to_lowercase().contains(&search_lower)
                        && !kb.description
                            .as_ref()
                            .map(|d| d.to_lowercase().contains(&search_lower))
                            .unwrap_or(false)
                    {
                        return false;
                    }
                }

                // Apply tags filter
                if let Some(ref tags) = filter.tags {
                    if !tags.iter().any(|t| kb.tags.contains(t)) {
                        return false;
                    }
                }

                // Apply permission filter
                if let Some(permission) = filter.permission {
                    if kb.permission != permission {
                        return false;
                    }
                }

                true
            })
            .map(KnowledgeBaseSummary::from)
            .collect();

        // Sort by updated_at descending
        accessible.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

        let total = accessible.len();
        let start = (pagination.page - 1) * pagination.page_size;
        let end = (start + pagination.page_size).min(total);

        let items = if start < total {
            accessible[start..end].to_vec()
        } else {
            vec![]
        };

        Ok(PaginatedResult::new(items, total, pagination.page, pagination.page_size))
    }

    /// Get a knowledge base by ID
    pub async fn get(&self, user: &UserContext, id: &str) -> Result<Option<KnowledgeBase>> {
        let bases = self.knowledge_bases.read().await;

        if let Some(kb) = bases.get(id) {
            // Check access
            let result = self.permission_service
                .check_access(user, kb, AccessLevel::Read)
                .await;

            if result.allowed {
                Ok(Some(kb.clone()))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// Update a knowledge base
    pub async fn update(
        &self,
        user: &UserContext,
        id: &str,
        request: UpdateKnowledgeBaseRequest,
    ) -> Result<Option<KnowledgeBase>> {
        let mut bases = self.knowledge_bases.write().await;

        if let Some(kb) = bases.get_mut(id) {
            // Check admin access
            let result = self.permission_service
                .check_access(user, kb, AccessLevel::Admin)
                .await;

            if !result.allowed {
                return Ok(None);
            }

            // Update fields
            if let Some(name) = request.name {
                kb.name = name;
            }
            if let Some(description) = request.description {
                kb.description = Some(description);
            }
            if let Some(permission) = request.permission {
                kb.permission = permission;
            }
            if let Some(tags) = request.tags {
                kb.tags = tags;
            }
            kb.updated_at = Utc::now();

            Ok(Some(kb.clone()))
        } else {
            Ok(None)
        }
    }

    /// Delete a knowledge base (cascade delete)
    pub async fn delete(&self, user: &UserContext, id: &str) -> Result<bool> {
        let mut bases = self.knowledge_bases.write().await;

        if let Some(kb) = bases.get(id) {
            // Check admin access
            let result = self.permission_service
                .check_access(user, kb, AccessLevel::Admin)
                .await;

            if !result.allowed {
                return Ok(false);
            }

            // Delete permissions
            {
                let mut perms = self.permissions.write().await;
                perms.remove(id);
            }

            // Delete knowledge base
            bases.remove(id);

            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Add a member to a knowledge base
    pub async fn add_member(
        &self,
        user: &UserContext,
        knowledge_base_id: &str,
        target_user_id: &str,
        target_tenant_id: &str,
        access_level: AccessLevel,
    ) -> Result<Option<KnowledgePermissionRecord>> {
        // Check admin access
        let bases = self.knowledge_bases.read().await;
        if let Some(kb) = bases.get(knowledge_base_id) {
            let result = self.permission_service
                .check_access(user, kb, AccessLevel::Admin)
                .await;

            if !result.allowed {
                return Ok(None);
            }

            // Can't modify owner
            if target_user_id == kb.owner_id {
                return Ok(None);
            }
        } else {
            return Ok(None);
        }
        drop(bases);

        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let record = KnowledgePermissionRecord {
            id: id.clone(),
            knowledge_base_id: knowledge_base_id.to_string(),
            user_id: target_user_id.to_string(),
            tenant_id: target_tenant_id.to_string(),
            access_level,
            created_at: now,
            updated_at: now,
        };

        let mut perms = self.permissions.write().await;
        perms
            .entry(knowledge_base_id.to_string())
            .or_insert_with(Vec::new)
            .push(record.clone());

        Ok(Some(record))
    }

    /// List members of a knowledge base
    pub async fn list_members(
        &self,
        user: &UserContext,
        knowledge_base_id: &str,
    ) -> Result<Option<Vec<super::permission::KnowledgeMember>>> {
        let bases = self.knowledge_bases.read().await;

        if let Some(kb) = bases.get(knowledge_base_id) {
            // Check access
            let result = self.permission_service
                .check_access(user, kb, AccessLevel::Read)
                .await;

            if !result.allowed {
                return Ok(None);
            }

            let mut members = Vec::new();

            // Add owner
            members.push(super::permission::KnowledgeMember {
                user_id: kb.owner_id.clone(),
                access_level: AccessLevel::Admin,
                is_owner: true,
                joined_at: kb.created_at,
            });

            // Add explicit permissions
            let perms = self.permissions.read().await;
            if let Some(records) = perms.get(knowledge_base_id) {
                for record in records {
                    members.push(super::permission::KnowledgeMember {
                        user_id: record.user_id.clone(),
                        access_level: record.access_level,
                        is_owner: false,
                        joined_at: record.created_at,
                    });
                }
            }

            Ok(Some(members))
        } else {
            Ok(None)
        }
    }

    /// Remove a member from a knowledge base
    pub async fn remove_member(
        &self,
        user: &UserContext,
        knowledge_base_id: &str,
        target_user_id: &str,
    ) -> Result<bool> {
        let bases = self.knowledge_bases.read().await;

        if let Some(kb) = bases.get(knowledge_base_id) {
            // Check admin access
            let result = self.permission_service
                .check_access(user, kb, AccessLevel::Admin)
                .await;

            if !result.allowed {
                return Ok(false);
            }

            // Can't remove owner
            if target_user_id == kb.owner_id {
                return Ok(false);
            }
        } else {
            return Ok(false);
        }
        drop(bases);

        let mut perms = self.permissions.write().await;
        if let Some(records) = perms.get_mut(knowledge_base_id) {
            let original_len = records.len();
            records.retain(|r| r.user_id != target_user_id);
            return Ok(records.len() < original_len);
        }

        Ok(false)
    }

    /// Update member permission
    pub async fn update_member(
        &self,
        user: &UserContext,
        knowledge_base_id: &str,
        target_user_id: &str,
        access_level: AccessLevel,
    ) -> Result<bool> {
        let bases = self.knowledge_bases.read().await;

        if let Some(kb) = bases.get(knowledge_base_id) {
            // Check admin access
            let result = self.permission_service
                .check_access(user, kb, AccessLevel::Admin)
                .await;

            if !result.allowed {
                return Ok(false);
            }

            // Can't modify owner
            if target_user_id == kb.owner_id {
                return Ok(false);
            }
        } else {
            return Ok(false);
        }
        drop(bases);

        let mut perms = self.permissions.write().await;
        if let Some(records) = perms.get_mut(knowledge_base_id) {
            for record in records.iter_mut() {
                if record.user_id == target_user_id {
                    record.access_level = access_level;
                    record.updated_at = Utc::now();
                    return Ok(true);
                }
            }
        }

        Ok(false)
    }
}

impl Default for KnowledgeBaseService {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Create a new knowledge base
#[tauri::command]
pub async fn knowledge_base_create(
    user: UserContext,
    request: CreateKnowledgeBaseRequest,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<KnowledgeBase, String> {
    service
        .create(&user, request)
        .await
        .map_err(|e| e.to_string())
}

/// List knowledge bases with pagination
#[tauri::command]
pub async fn knowledge_base_list(
    user: UserContext,
    pagination: PaginationParams,
    filter: KnowledgeBaseFilter,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<PaginatedResult<KnowledgeBaseSummary>, String> {
    service
        .list(&user, pagination, filter)
        .await
        .map_err(|e| e.to_string())
}

/// Get a knowledge base by ID
#[tauri::command]
pub async fn knowledge_base_get(
    user: UserContext,
    id: String,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<Option<KnowledgeBase>, String> {
    service.get(&user, &id).await.map_err(|e| e.to_string())
}

/// Update a knowledge base
#[tauri::command]
pub async fn knowledge_base_update(
    user: UserContext,
    id: String,
    request: UpdateKnowledgeBaseRequest,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<Option<KnowledgeBase>, String> {
    service
        .update(&user, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a knowledge base
#[tauri::command]
pub async fn knowledge_base_delete(
    user: UserContext,
    id: String,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<bool, String> {
    service.delete(&user, &id).await.map_err(|e| e.to_string())
}

/// Add a member to a knowledge base
#[tauri::command]
pub async fn knowledge_member_add(
    user: UserContext,
    knowledge_base_id: String,
    target_user_id: String,
    target_tenant_id: String,
    access_level: AccessLevel,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<Option<KnowledgePermissionRecord>, String> {
    service
        .add_member(&user, &knowledge_base_id, &target_user_id, &target_tenant_id, access_level)
        .await
        .map_err(|e| e.to_string())
}

/// List members of a knowledge base
#[tauri::command]
pub async fn knowledge_member_list(
    user: UserContext,
    knowledge_base_id: String,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<Option<Vec<super::permission::KnowledgeMember>>, String> {
    service
        .list_members(&user, &knowledge_base_id)
        .await
        .map_err(|e| e.to_string())
}

/// Remove a member from a knowledge base
#[tauri::command]
pub async fn knowledge_member_remove(
    user: UserContext,
    knowledge_base_id: String,
    target_user_id: String,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<bool, String> {
    service
        .remove_member(&user, &knowledge_base_id, &target_user_id)
        .await
        .map_err(|e| e.to_string())
}

/// Update member permission
#[tauri::command]
pub async fn knowledge_member_update(
    user: UserContext,
    knowledge_base_id: String,
    target_user_id: String,
    access_level: AccessLevel,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<bool, String> {
    service
        .update_member(&user, &knowledge_base_id, &target_user_id, access_level)
        .await
        .map_err(|e| e.to_string())
}

/// Check permission for a knowledge base
#[tauri::command]
pub async fn knowledge_check_permission(
    user: UserContext,
    knowledge_base_id: String,
    required_level: AccessLevel,
    service: State<'_, Arc<KnowledgeBaseService>>,
) -> Result<PermissionCheckResult, String> {
    let bases = service.knowledge_bases.read().await;
    if let Some(kb) = bases.get(&knowledge_base_id) {
        let result = service.permission_service
            .check_access(&user, kb, required_level)
            .await;
        Ok(result)
    } else {
        Ok(PermissionCheckResult {
            allowed: false,
            reason: Some("Knowledge base not found".to_string()),
            required_level: Some(required_level),
        })
    }
}
