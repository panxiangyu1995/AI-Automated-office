//! Knowledge document CRUD module.
//!
//! Implements document management for knowledge bases.

use crate::knowledge::crud::KnowledgeBaseService;
use crate::knowledge::permission::{AccessLevel, UserContext};
use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Document status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Pending,
    Processing,
    Indexed,
    Failed,
    Archived,
}

impl Default for DocumentStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// Document type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentType {
    Pdf,
    Word,
    Excel,
    Txt,
    Markdown,
    Html,
    Json,
    Csv,
}

impl Default for DocumentType {
    fn default() -> Self {
        Self::Txt
    }
}

/// Knowledge document entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeDocument {
    pub id: String,
    pub knowledge_base_id: String,
    pub tenant_id: String,
    pub name: String,
    pub file_path: String,
    pub file_type: DocumentType,
    pub file_size: u64,
    pub checksum: String,
    pub status: DocumentStatus,
    pub tags: Vec<String>,
    pub metadata: serde_json::Value,
    pub chunk_count: usize,
    pub processed_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub created_by: String,
}

/// Document summary for list views
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentSummary {
    pub id: String,
    pub name: String,
    pub file_type: DocumentType,
    pub file_size: u64,
    pub status: DocumentStatus,
    pub tags: Vec<String>,
    pub chunk_count: usize,
    pub created_at: i64,
    pub updated_at: i64,
}

impl From<&KnowledgeDocument> for DocumentSummary {
    fn from(doc: &KnowledgeDocument) -> Self {
        Self {
            id: doc.id.clone(),
            name: doc.name.clone(),
            file_type: doc.file_type,
            file_size: doc.file_size,
            status: doc.status,
            tags: doc.tags.clone(),
            chunk_count: doc.chunk_count,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        }
    }
}

/// Document filter params
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DocumentFilter {
    pub search: Option<String>,
    pub status: Option<DocumentStatus>,
    pub file_type: Option<DocumentType>,
    pub tags: Option<Vec<String>>,
}

/// Upload request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadDocumentRequest {
    pub knowledge_base_id: String,
    pub name: String,
    pub file_path: String,
    pub file_type: DocumentType,
    pub file_size: u64,
    pub checksum: String,
    pub tags: Vec<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Update document request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDocumentRequest {
    pub name: Option<String>,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
    pub status: Option<DocumentStatus>,
}

impl Default for DocumentFilter {
    fn default() -> Self {
        Self {
            search: None,
            status: None,
            file_type: None,
            tags: None,
        }
    }
}

impl Default for UploadDocumentRequest {
    fn default() -> Self {
        Self {
            knowledge_base_id: String::new(),
            name: String::new(),
            file_path: String::new(),
            file_type: DocumentType::Txt,
            file_size: 0,
            checksum: String::new(),
            tags: vec![],
            metadata: None,
        }
    }
}

impl Default for UpdateDocumentRequest {
    fn default() -> Self {
        Self {
            name: None,
            tags: None,
            metadata: None,
            status: None,
        }
    }
}

/// Document service state
pub struct DocumentService {
    documents: Arc<RwLock<std::collections::HashMap<String, KnowledgeDocument>>>,
    knowledge_base_service: Arc<KnowledgeBaseService>,
}

impl DocumentService {
    pub fn new(knowledge_base_service: Arc<KnowledgeBaseService>) -> Self {
        Self {
            documents: Arc::new(RwLock::new(std::collections::HashMap::new())),
            knowledge_base_service,
        }
    }

    /// Create a user context
    fn make_user_context(user_id: &str, tenant_id: &str) -> UserContext {
        UserContext {
            user_id: user_id.to_string(),
            tenant_id: tenant_id.to_string(),
            department_id: None,
        }
    }

    /// Upload a document to a knowledge base
    pub async fn upload(
        &self,
        user_id: &str,
        tenant_id: &str,
        request: UploadDocumentRequest,
    ) -> Result<Option<KnowledgeDocument>> {
        // Check knowledge base access
        let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
        if let Some(kb) = kb_service.get(&request.knowledge_base_id) {
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

        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp();

        let doc = KnowledgeDocument {
            id: id.clone(),
            knowledge_base_id: request.knowledge_base_id,
            tenant_id: tenant_id.to_string(),
            name: request.name,
            file_path: request.file_path,
            file_type: request.file_type,
            file_size: request.file_size,
            checksum: request.checksum,
            status: DocumentStatus::Pending,
            tags: request.tags,
            metadata: request.metadata.unwrap_or(serde_json::json!({})),
            chunk_count: 0,
            processed_at: None,
            created_at: now,
            updated_at: now,
            created_by: user_id.to_string(),
        };

        let mut docs = self.documents.write().await;
        docs.insert(id, doc.clone());

        Ok(Some(doc))
    }

    /// List documents in a knowledge base
    pub async fn list(
        &self,
        user_id: &str,
        tenant_id: &str,
        knowledge_base_id: &str,
        pagination: crate::knowledge::crud::PaginationParams,
        filter: DocumentFilter,
    ) -> Result<Option<crate::knowledge::crud::PaginatedResult<DocumentSummary>>> {
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

        let docs = self.documents.read().await;

        let mut filtered: Vec<DocumentSummary> = docs
            .values()
            .filter(|d| d.knowledge_base_id == knowledge_base_id)
            .filter(|d| {
                if let Some(ref search) = filter.search {
                    let search_lower = search.to_lowercase();
                    if !d.name.to_lowercase().contains(&search_lower) {
                        return false;
                    }
                }
                if let Some(ref status) = filter.status {
                    if d.status != *status {
                        return false;
                    }
                }
                if let Some(ref file_type) = filter.file_type {
                    if d.file_type != *file_type {
                        return false;
                    }
                }
                if let Some(ref tags) = filter.tags {
                    if !tags.iter().any(|t| d.tags.contains(t)) {
                        return false;
                    }
                }
                true
            })
            .map(DocumentSummary::from)
            .collect();

        filtered.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

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

    /// Get a document by ID
    pub async fn get(
        &self,
        user_id: &str,
        tenant_id: &str,
        id: &str,
    ) -> Result<Option<KnowledgeDocument>> {
        let docs = self.documents.read().await;

        if let Some(doc) = docs.get(id) {
            let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
            if let Some(kb) = kb_service.get(&doc.knowledge_base_id) {
                let user = Self::make_user_context(user_id, tenant_id);
                let result = self.knowledge_base_service
                    .permission_service
                    .check_access(&user, kb, AccessLevel::Read)
                    .await;
                if result.allowed {
                    return Ok(Some(doc.clone()));
                }
            }
        }

        Ok(None)
    }

    /// Update a document
    pub async fn update(
        &self,
        user_id: &str,
        tenant_id: &str,
        id: &str,
        request: UpdateDocumentRequest,
    ) -> Result<Option<KnowledgeDocument>> {
        let mut docs = self.documents.write().await;

        if let Some(doc) = docs.get_mut(id) {
            let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
            if let Some(kb) = kb_service.get(&doc.knowledge_base_id) {
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

            if let Some(name) = request.name {
                doc.name = name;
            }
            if let Some(tags) = request.tags {
                doc.tags = tags;
            }
            if let Some(metadata) = request.metadata {
                doc.metadata = metadata;
            }
            if let Some(status) = request.status {
                doc.status = status;
            }
            doc.updated_at = Utc::now().timestamp();

            return Ok(Some(doc.clone()));
        }

        Ok(None)
    }

    /// Delete a document
    pub async fn delete(
        &self,
        user_id: &str,
        tenant_id: &str,
        id: &str,
    ) -> Result<bool> {
        let docs = self.documents.read().await;

        if let Some(doc) = docs.get(id) {
            let kb_service = self.knowledge_base_service.knowledge_bases.read().await;
            if let Some(kb) = kb_service.get(&doc.knowledge_base_id) {
                let user = Self::make_user_context(user_id, tenant_id);
                let result = self.knowledge_base_service
                    .permission_service
                    .check_access(&user, kb, AccessLevel::Admin)
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
        drop(docs);

        let mut docs = self.documents.write().await;
        docs.remove(id);
        Ok(true)
    }

    /// Batch update document status
    pub async fn batch_update_status(
        &self,
        user_id: &str,
        tenant_id: &str,
        ids: Vec<String>,
        status: DocumentStatus,
    ) -> Result<Vec<String>> {
        let mut updated = Vec::new();

        for id in ids {
            if self.update(user_id, tenant_id, &id, UpdateDocumentRequest {
                status: Some(status),
                ..Default::default()
            }).await?.is_some() {
                updated.push(id);
            }
        }

        Ok(updated)
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Upload a document
#[tauri::command]
pub async fn knowledge_document_upload(
    user_id: String,
    tenant_id: String,
    request: UploadDocumentRequest,
    service: State<'_, Arc<DocumentService>>,
) -> Result<Option<KnowledgeDocument>, String> {
    service
        .upload(&user_id, &tenant_id, request)
        .await
        .map_err(|e| e.to_string())
}

/// List documents in a knowledge base
#[tauri::command]
pub async fn knowledge_document_list(
    user_id: String,
    tenant_id: String,
    knowledge_base_id: String,
    pagination: crate::knowledge::crud::PaginationParams,
    filter: DocumentFilter,
    service: State<'_, Arc<DocumentService>>,
) -> Result<Option<crate::knowledge::crud::PaginatedResult<DocumentSummary>>, String> {
    service
        .list(&user_id, &tenant_id, &knowledge_base_id, pagination, filter)
        .await
        .map_err(|e| e.to_string())
}

/// Get a document by ID
#[tauri::command]
pub async fn knowledge_document_get(
    user_id: String,
    tenant_id: String,
    id: String,
    service: State<'_, Arc<DocumentService>>,
) -> Result<Option<KnowledgeDocument>, String> {
    service
        .get(&user_id, &tenant_id, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Update a document
#[tauri::command]
pub async fn knowledge_document_update(
    user_id: String,
    tenant_id: String,
    id: String,
    request: UpdateDocumentRequest,
    service: State<'_, Arc<DocumentService>>,
) -> Result<Option<KnowledgeDocument>, String> {
    service
        .update(&user_id, &tenant_id, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a document
#[tauri::command]
pub async fn knowledge_document_delete(
    user_id: String,
    tenant_id: String,
    id: String,
    service: State<'_, Arc<DocumentService>>,
) -> Result<bool, String> {
    service
        .delete(&user_id, &tenant_id, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Batch update document status
#[tauri::command]
pub async fn knowledge_document_batch_update_status(
    user_id: String,
    tenant_id: String,
    ids: Vec<String>,
    status: DocumentStatus,
    service: State<'_, Arc<DocumentService>>,
) -> Result<Vec<String>, String> {
    service
        .batch_update_status(&user_id, &tenant_id, ids, status)
        .await
        .map_err(|e| e.to_string())
}
