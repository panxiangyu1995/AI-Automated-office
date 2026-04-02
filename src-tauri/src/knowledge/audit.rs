//! Knowledge audit logging module.
//!
//! Implements audit logging for all knowledge base operations.

use crate::knowledge::crud::KnowledgeBaseService;
use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Audit action types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuditAction {
    Create,
    Update,
    Delete,
    Upload,
    Download,
    Share,
    PermissionChange,
}

/// Audit entity types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuditEntityType {
    KnowledgeBase,
    Document,
    Segment,
    Member,
}

/// Audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub action: AuditAction,
    pub entity_type: AuditEntityType,
    pub entity_id: String,
    pub entity_name: Option<String>,
    pub details: serde_json::Value,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Audit log filter
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AuditLogFilter {
    pub entity_type: Option<AuditEntityType>,
    pub entity_id: Option<String>,
    pub action: Option<AuditAction>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub user_id: Option<String>,
}

/// Pagination result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedAuditLogs {
    pub items: Vec<AuditLog>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
}

/// Audit service
pub struct AuditService {
    logs: Arc<RwLock<Vec<AuditLog>>>,
    knowledge_base_service: Arc<KnowledgeBaseService>,
}

impl AuditService {
    pub fn new(knowledge_base_service: Arc<KnowledgeBaseService>) -> Self {
        Self {
            logs: Arc::new(RwLock::new(Vec::new())),
            knowledge_base_service,
        }
    }

    /// Log an audit event
    pub async fn log(
        &self,
        tenant_id: &str,
        user_id: &str,
        action: AuditAction,
        entity_type: AuditEntityType,
        entity_id: &str,
        entity_name: Option<&str>,
        details: serde_json::Value,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> Result<AuditLog> {
        let log = AuditLog {
            id: Uuid::new_v4().to_string(),
            tenant_id: tenant_id.to_string(),
            user_id: user_id.to_string(),
            action,
            entity_type,
            entity_id: entity_id.to_string(),
            entity_name: entity_name.map(String::from),
            details,
            ip_address: ip_address.map(String::from),
            user_agent: user_agent.map(String::from),
            created_at: Utc::now(),
        };

        let mut logs = self.logs.write().await;
        logs.push(log.clone());

        Ok(log)
    }

    /// Log knowledge base creation
    pub async fn log_kb_create(
        &self,
        tenant_id: &str,
        user_id: &str,
        kb_id: &str,
        kb_name: &str,
    ) -> Result<AuditLog> {
        self.log(
            tenant_id,
            user_id,
            AuditAction::Create,
            AuditEntityType::KnowledgeBase,
            kb_id,
            Some(kb_name),
            serde_json::json!({ "name": kb_name }),
            None,
            None,
        ).await
    }

    /// Log knowledge base update
    pub async fn log_kb_update(
        &self,
        tenant_id: &str,
        user_id: &str,
        kb_id: &str,
        kb_name: &str,
        changes: serde_json::Value,
    ) -> Result<AuditLog> {
        self.log(
            tenant_id,
            user_id,
            AuditAction::Update,
            AuditEntityType::KnowledgeBase,
            kb_id,
            Some(kb_name),
            changes,
            None,
            None,
        ).await
    }

    /// Log knowledge base deletion
    pub async fn log_kb_delete(
        &self,
        tenant_id: &str,
        user_id: &str,
        kb_id: &str,
        kb_name: &str,
    ) -> Result<AuditLog> {
        self.log(
            tenant_id,
            user_id,
            AuditAction::Delete,
            AuditEntityType::KnowledgeBase,
            kb_id,
            Some(kb_name),
            serde_json::json!({ "name": kb_name }),
            None,
            None,
        ).await
    }

    /// Log document upload
    pub async fn log_document_upload(
        &self,
        tenant_id: &str,
        user_id: &str,
        doc_id: &str,
        doc_name: &str,
        kb_id: &str,
    ) -> Result<AuditLog> {
        self.log(
            tenant_id,
            user_id,
            AuditAction::Upload,
            AuditEntityType::Document,
            doc_id,
            Some(doc_name),
            serde_json::json!({ "name": doc_name, "knowledge_base_id": kb_id }),
            None,
            None,
        ).await
    }

    /// Log document deletion
    pub async fn log_document_delete(
        &self,
        tenant_id: &str,
        user_id: &str,
        doc_id: &str,
        doc_name: &str,
    ) -> Result<AuditLog> {
        self.log(
            tenant_id,
            user_id,
            AuditAction::Delete,
            AuditEntityType::Document,
            doc_id,
            Some(doc_name),
            serde_json::json!({ "name": doc_name }),
            None,
            None,
        ).await
    }

    /// Log permission change
    pub async fn log_permission_change(
        &self,
        tenant_id: &str,
        user_id: &str,
        kb_id: &str,
        target_user_id: &str,
        old_level: &str,
        new_level: &str,
    ) -> Result<AuditLog> {
        self.log(
            tenant_id,
            user_id,
            AuditAction::PermissionChange,
            AuditEntityType::Member,
            target_user_id,
            None,
            serde_json::json!({
                "knowledge_base_id": kb_id,
                "target_user_id": target_user_id,
                "old_level": old_level,
                "new_level": new_level
            }),
            None,
            None,
        ).await
    }

    /// Query audit logs
    pub async fn query(
        &self,
        tenant_id: &str,
        pagination: crate::knowledge::crud::PaginationParams,
        filter: AuditLogFilter,
    ) -> Result<PaginatedAuditLogs> {
        let logs = self.logs.read().await;

        let mut filtered: Vec<&AuditLog> = logs
            .iter()
            .filter(|log| log.tenant_id == tenant_id)
            .filter(|log| {
                if let Some(ref entity_type) = filter.entity_type {
                    if log.entity_type != *entity_type {
                        return false;
                    }
                }

                if let Some(ref entity_id) = filter.entity_id {
                    if &log.entity_id != entity_id {
                        return false;
                    }
                }

                if let Some(ref action) = filter.action {
                    if log.action != *action {
                        return false;
                    }
                }

                if let Some(ref user_id) = filter.user_id {
                    if &log.user_id != user_id {
                        return false;
                    }
                }

                if let Some(start) = filter.start_date {
                    let start_dt = DateTime::from_timestamp(start, 0)
                        .unwrap_or_else(|| Utc::now());
                    if log.created_at < start_dt {
                        return false;
                    }
                }

                if let Some(end) = filter.end_date {
                    let end_dt = DateTime::from_timestamp(end, 0)
                        .unwrap_or_else(|| Utc::now());
                    if log.created_at > end_dt {
                        return false;
                    }
                }

                true
            })
            .collect();

        // Sort by created_at descending
        filtered.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        let total = filtered.len();
        let start = (pagination.page - 1) * pagination.page_size;
        let end = (start + pagination.page_size).min(total);

        let items: Vec<AuditLog> = if start < total {
            filtered[start..end].iter().map(|l| (*l).clone()).collect()
        } else {
            vec![]
        };

        let total_pages = if total == 0 {
            0
        } else {
            (total + pagination.page_size - 1) / pagination.page_size
        };

        Ok(PaginatedAuditLogs {
            items,
            total,
            page: pagination.page,
            page_size: pagination.page_size,
            total_pages,
        })
    }
}

impl Default for AuditService {
    fn default() -> Self {
        Self::new(Arc::new(KnowledgeBaseService::new()))
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Query audit logs
#[tauri::command]
pub async fn audit_log_query(
    tenant_id: String,
    pagination: crate::knowledge::crud::PaginationParams,
    filter: AuditLogFilter,
    service: State<'_, Arc<AuditService>>,
) -> Result<PaginatedAuditLogs, String> {
    service
        .query(&tenant_id, pagination, filter)
        .await
        .map_err(|e| e.to_string())
}
