//! Knowledge segment management module.
//!
//! Implements segment (chunk) management for knowledge bases.

use crate::knowledge::crud::KnowledgeBaseService;
use crate::knowledge::permission::AccessLevel;
use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Segment (chunk) status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SegmentStatus {
    Active,
    Disabled,
    Archived,
}

impl Default for SegmentStatus {
    fn default() -> Self {
        Self::Active
    }
}

/// Knowledge segment entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSegment {
    pub id: String,
    pub document_id: String,
    pub knowledge_base_id: String,
    pub tenant_id: String,
    pub content: String,
    pub tokens: usize,
    pub keywords: Vec<String>,
    pub hash: String,
    pub index: usize,
    pub status: SegmentStatus,
    pub metadata: serde_json::Value,
    pub vector_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub created_by: String,
}

/// Segment summary for list views
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentSummary {
    pub id: String,
    pub document_id: String,
    pub content_preview: String,
    pub tokens: usize,
    pub keywords: Vec<String>,
    pub status: SegmentStatus,
    pub index: usize,
    pub created_at: i64,
    pub updated_at: i64,
}

impl From<&KnowledgeSegment> for SegmentSummary {
    fn from(seg: &KnowledgeSegment) -> Self {
        // Generate content preview (first 100 chars)
        let preview = if seg.content.len() > 100 {
            format!("{}...", &seg.content[..100])
        } else {
            seg.content.clone()
        };

        Self {
            id: seg.id.clone(),
            document_id: seg.document_id.clone(),
            content_preview: preview,
            tokens: seg.tokens,
            keywords: seg.keywords.clone(),
            status: seg.status,
            index: seg.index,
            created_at: seg.created_at,
            updated_at: seg.updated_at,
        }
    }
}

/// Segment filter params
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SegmentFilter {
    pub document_id: Option<String>,
    pub status: Option<SegmentStatus>,
    pub search: Option<String>,
}

/// Update segment request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSegmentRequest {
    pub content: Option<String>,
    pub keywords: Option<Vec<String>>,
    pub status: Option<SegmentStatus>,
    pub metadata: Option<serde_json::Value>,
}

/// Segment service state
pub struct SegmentService {
    segments: Arc<RwLock<std::collections::HashMap<String, KnowledgeSegment>>>,
    knowledge_base_service: Arc<KnowledgeBaseService>,
}

impl SegmentService {
    pub fn new(knowledge_base_service: Arc<KnowledgeBaseService>) -> Self {
        Self {
            segments: Arc::new(RwLock::new(std::collections::HashMap::new())),
            knowledge_base_service,
        }
    }

    /// Create a user context helper
    fn make_user_context(user_id: &str, tenant_id: &str) -> crate::knowledge::permission::UserContext {
        crate::knowledge::permission::UserContext {
            user_id: user_id.to_string(),
            tenant_id: tenant_id.to_string(),
            department_id: None,
        }
    }

    /// Create a new segment
    pub async fn create(
        &self,
        user_id: &str,
        tenant_id: &str,
        document_id: &str,
        knowledge_base_id: &str,
        content: &str,
        tokens: usize,
        keywords: Vec<String>,
        metadata: Option<serde_json::Value>,
    ) -> Result<Option<KnowledgeSegment>> {
        // Check knowledge base access
        let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
        if let Some(kb) = kb_service.get(knowledge_base_id) {
            let user = Self::make_user_context(user_id, tenant_id);
            let result = self.knowledge_base_service
                .permission_service
                .check_access(&user, kb, AccessLevel::Write)
                .await;
            if !result.allowed {
                return Ok(None);
            }
        } else {
            return Ok(None);
        }
        drop(kb_service);

        // Get current segment count for index
        let segments = self.segments.read().await;
        let count = segments
            .values()
            .filter(|s| s.document_id == document_id)
            .count();
        drop(segments);

        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp();
        let hash = format!("{:x}", md5::compute(content.as_bytes()));

        let seg = KnowledgeSegment {
            id: id.clone(),
            document_id: document_id.to_string(),
            knowledge_base_id: knowledge_base_id.to_string(),
            tenant_id: tenant_id.to_string(),
            content: content.to_string(),
            tokens,
            keywords,
            hash,
            index: count,
            status: SegmentStatus::Active,
            metadata: metadata.unwrap_or(serde_json::json!({})),
            vector_id: None,
            created_at: now,
            updated_at: now,
            created_by: user_id.to_string(),
        };

        let mut segments = self.segments.write().await;
        segments.insert(id, seg.clone());

        Ok(Some(seg))
    }

    /// List segments in a knowledge base
    pub async fn list(
        &self,
        user_id: &str,
        tenant_id: &str,
        knowledge_base_id: &str,
        pagination: crate::knowledge::crud::PaginationParams,
        filter: SegmentFilter,
    ) -> Result<Option<crate::knowledge::crud::PaginatedResult<SegmentSummary>>> {
        // Check knowledge base access
        let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
        if let Some(kb) = kb_service.get(knowledge_base_id) {
            let user = Self::make_user_context(user_id, tenant_id);
            let result = self.knowledge_base_service
                .permission_service
                .check_access(&user, kb, AccessLevel::Read)
                .await;
            if !result.allowed {
                return Ok(None);
            }
        } else {
            return Ok(None);
        }
        drop(kb_service);

        let segments = self.segments.read().await;

        let mut filtered: Vec<SegmentSummary> = segments
            .values()
            .filter(|s| s.knowledge_base_id == knowledge_base_id)
            .filter(|s| {
                // Document filter
                if let Some(ref doc_id) = filter.document_id {
                    if &s.document_id != doc_id {
                        return false;
                    }
                }

                // Status filter
                if let Some(ref status) = filter.status {
                    if s.status != *status {
                        return false;
                    }
                }

                // Search filter
                if let Some(ref search) = filter.search {
                    let search_lower = search.to_lowercase();
                    if !s.content.to_lowercase().contains(&search_lower)
                        && !s.keywords.iter().any(|k| k.to_lowercase().contains(&search_lower))
                    {
                        return false;
                    }
                }

                true
            })
            .map(SegmentSummary::from)
            .collect();

        // Sort by index
        filtered.sort_by(|a, b| a.index.cmp(&b.index));

        let total = filtered.len();
        let start = (pagination.page - 1) * pagination.page_size;
        let end = (start + pagination.page_size).min(total);

        let items = if start < total {
            filtered[start..end].to_vec()
        } else {
            vec![]
        };

        Ok(Some(crate::knowledge::crud::PaginatedResult::new(
            items,
            total,
            pagination.page,
            pagination.page_size,
        )))
    }

    /// Get a segment by ID
    pub async fn get(
        &self,
        user_id: &str,
        tenant_id: &str,
        id: &str,
    ) -> Result<Option<KnowledgeSegment>> {
        let segments = self.segments.read().await;

        if let Some(seg) = segments.get(id) {
            // Check knowledge base access
            let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
            if let Some(kb) = kb_service.get(&seg.knowledge_base_id) {
                let user = Self::make_user_context(user_id, tenant_id);
                let result = self.knowledge_base_service
                    .permission_service
                    .check_access(&user, kb, AccessLevel::Read)
                    .await;
                if result.allowed {
                    return Ok(Some(seg.clone()));
                }
            }
        }

        Ok(None)
    }

    /// Update a segment (with re-embed capability)
    pub async fn update(
        &self,
        user_id: &str,
        tenant_id: &str,
        id: &str,
        request: UpdateSegmentRequest,
    ) -> Result<Option<KnowledgeSegment>> {
        let mut segments = self.segments.write().await;

        if let Some(seg) = segments.get_mut(id) {
            // Check knowledge base access
            let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
            if let Some(kb) = kb_service.get(&seg.knowledge_base_id) {
                let user = Self::make_user_context(user_id, tenant_id);
                let result = self.knowledge_base_service
                    .permission_service
                    .check_access(&user, kb, AccessLevel::Write)
                    .await;
                if !result.allowed {
                    return Ok(None);
                }
            } else {
                return Ok(None);
            }
            drop(kb_service);

            // Update fields
            if let Some(content) = request.content {
                seg.content = content;
                seg.hash = format!("{:x}", md5::compute(seg.content.as_bytes()));
                // Clear vector_id to trigger re-embed
                seg.vector_id = None;
            }
            if let Some(keywords) = request.keywords {
                seg.keywords = keywords;
            }
            if let Some(status) = request.status {
                seg.status = status;
            }
            if let Some(metadata) = request.metadata {
                seg.metadata = metadata;
            }
            seg.updated_at = Utc::now().timestamp();

            return Ok(Some(seg.clone()));
        }

        Ok(None)
    }

    /// Delete a segment
    pub async fn delete(
        &self,
        user_id: &str,
        tenant_id: &str,
        id: &str,
    ) -> Result<bool> {
        let segments = self.segments.read().await;

        if let Some(seg) = segments.get(id) {
            // Check knowledge base access
            let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
            if let Some(kb) = kb_service.get(&seg.knowledge_base_id) {
                let user = Self::make_user_context(user_id, tenant_id);
                let result = self.knowledge_base_service
                    .permission_service
                    .check_access(&user, kb, AccessLevel::Write)
                    .await;
                if !result.allowed {
                    return Ok(false);
                }
            } else {
                return Ok(false);
            }
        } else {
            return Ok(false);
        }
        drop(segments);

        let mut segments = self.segments.write().await;
        segments.remove(id);
        Ok(true)
    }

    /// Get segments by document ID
    pub async fn get_by_document(
        &self,
        user_id: &str,
        tenant_id: &str,
        document_id: &str,
    ) -> Result<Vec<KnowledgeSegment>> {
        let segments = self.segments.read().await;

        let mut result = Vec::new();
        for seg in segments.values() {
            if seg.document_id == document_id && seg.status == SegmentStatus::Active {
                // Check access
                let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
                if let Some(kb) = kb_service.get(&seg.knowledge_base_id) {
                    let user = Self::make_user_context(user_id, tenant_id);
                    let access_result = self.knowledge_base_service
                        .permission_service
                        .check_access(&user, kb, AccessLevel::Read)
                        .await;
                    if access_result.allowed {
                        result.push(seg.clone());
                    }
                }
            }
        }

        // Sort by index
        result.sort_by(|a, b| a.index.cmp(&b.index));
        Ok(result)
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Create a new segment
#[tauri::command]
pub async fn knowledge_segment_create(
    user_id: String,
    tenant_id: String,
    document_id: String,
    knowledge_base_id: String,
    content: String,
    tokens: usize,
    keywords: Vec<String>,
    metadata: Option<serde_json::Value>,
    service: State<'_, Arc<SegmentService>>,
) -> Result<Option<KnowledgeSegment>, String> {
    service
        .create(&user_id, &tenant_id, &document_id, &knowledge_base_id, &content, tokens, keywords, metadata)
        .await
        .map_err(|e| e.to_string())
}

/// List segments in a knowledge base
#[tauri::command]
pub async fn knowledge_segment_list(
    user_id: String,
    tenant_id: String,
    knowledge_base_id: String,
    pagination: crate::knowledge::crud::PaginationParams,
    filter: SegmentFilter,
    service: State<'_, Arc<SegmentService>>,
) -> Result<Option<crate::knowledge::crud::PaginatedResult<SegmentSummary>>, String> {
    service
        .list(&user_id, &tenant_id, &knowledge_base_id, pagination, filter)
        .await
        .map_err(|e| e.to_string())
}

/// Get a segment by ID
#[tauri::command]
pub async fn knowledge_segment_get(
    user_id: String,
    tenant_id: String,
    id: String,
    service: State<'_, Arc<SegmentService>>,
) -> Result<Option<KnowledgeSegment>, String> {
    service
        .get(&user_id, &tenant_id, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Update a segment
#[tauri::command]
pub async fn knowledge_segment_update(
    user_id: String,
    tenant_id: String,
    id: String,
    request: UpdateSegmentRequest,
    service: State<'_, Arc<SegmentService>>,
) -> Result<Option<KnowledgeSegment>, String> {
    service
        .update(&user_id, &tenant_id, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a segment
#[tauri::command]
pub async fn knowledge_segment_delete(
    user_id: String,
    tenant_id: String,
    id: String,
    service: State<'_, Arc<SegmentService>>,
) -> Result<bool, String> {
    service
        .delete(&user_id, &tenant_id, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Get segments by document ID
#[tauri::command]
pub async fn knowledge_segment_get_by_document(
    user_id: String,
    tenant_id: String,
    document_id: String,
    service: State<'_, Arc<SegmentService>>,
) -> Result<Vec<KnowledgeSegment>, String> {
    service
        .get_by_document(&user_id, &tenant_id, &document_id)
        .await
        .map_err(|e| e.to_string())
}
