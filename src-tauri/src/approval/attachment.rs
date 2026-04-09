//! Approval Attachment Module
//!
//! Implements approval attachments (FR137-FR142) and timeline tracing.
//! - Attachment upload and storage
//! - Attachment preview and download
//! - Timeline trace view
//! - Operation audit trail
//!
//! Story 37.1 - 审批附件与流程追溯

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;

/// Attachment type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AttachmentType {
    Image,
    Document,
    Archive,
    Other,
}

impl Default for AttachmentType {
    fn default() -> Self {
        Self::Other
    }
}

impl AttachmentType {
    /// Get file extension to type mapping
    pub fn from_extension(ext: &str) -> Self {
        match ext.to_lowercase().as_str() {
            "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" => Self::Image,
            "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "txt" => Self::Document,
            "zip" | "rar" | "7z" | "tar" | "gz" => Self::Archive,
            _ => Self::Other,
        }
    }
}

/// Attachment status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AttachmentStatus {
    Pending,
    Uploaded,
    Failed,
    Deleted,
}

impl Default for AttachmentStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// Attachment metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attachment {
    pub id: String,
    pub record_id: String,
    pub file_name: String,
    pub file_type: AttachmentType,
    pub file_size: u64,
    pub mime_type: String,
    pub storage_path: String,
    pub status: AttachmentStatus,
    pub uploaded_by: String,
    pub uploaded_at: i64,
    pub url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

impl Attachment {
    /// Create a new attachment record
    pub fn new(
        record_id: String,
        file_name: String,
        file_size: u64,
        mime_type: String,
        storage_path: String,
        uploaded_by: String,
    ) -> Self {
        let ext = file_name
            .rsplit('.')
            .next()
            .unwrap_or("");
        let file_type = AttachmentType::from_extension(ext);

        Self {
            id: format!("att_{}", uuid::Uuid::new_v4()),
            record_id,
            file_name,
            file_type,
            file_size,
            mime_type,
            storage_path,
            status: AttachmentStatus::Uploaded,
            uploaded_by,
            uploaded_at: Utc::now().timestamp(),
            url: None,
            thumbnail_url: None,
            metadata: HashMap::new(),
        }
    }

    /// Mark attachment as deleted (soft delete)
    pub fn mark_deleted(&mut self) {
        self.status = AttachmentStatus::Deleted;
    }

    /// Set URLs after upload
    pub fn set_urls(&mut self, url: String, thumbnail_url: Option<String>) {
        self.url = Some(url);
        self.thumbnail_url = thumbnail_url;
    }
}

/// Operation audit entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEntry {
    pub id: String,
    pub record_id: String,
    pub operator_id: String,
    pub operator_name: String,
    pub action: AuditAction,
    pub details: String,
    pub timestamp: i64,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub before_state: Option<serde_json::Value>,
    pub after_state: Option<serde_json::Value>,
}

/// Audit actions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuditAction {
    Create,
    Update,
    Delete,
    Approve,
    Reject,
    Cancel,
    Submit,
    Delegate,
    Remind,
    Attach,
    Detach,
    View,
}

impl std::fmt::Display for AuditAction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Create => write!(f, "create"),
            Self::Update => write!(f, "update"),
            Self::Delete => write!(f, "delete"),
            Self::Approve => write!(f, "approve"),
            Self::Reject => write!(f, "reject"),
            Self::Cancel => write!(f, "cancel"),
            Self::Submit => write!(f, "submit"),
            Self::Delegate => write!(f, "delegate"),
            Self::Remind => write!(f, "remind"),
            Self::Attach => write!(f, "attach"),
            Self::Detach => write!(f, "detach"),
            Self::View => write!(f, "view"),
        }
    }
}

impl AuditEntry {
    /// Create a new audit entry
    pub fn new(
        record_id: String,
        operator_id: String,
        operator_name: String,
        action: AuditAction,
        details: String,
    ) -> Self {
        Self {
            id: format!("audit_{}", uuid::Uuid::new_v4()),
            record_id,
            operator_id,
            operator_name,
            action,
            details,
            timestamp: Utc::now().timestamp(),
            ip_address: None,
            user_agent: None,
            before_state: None,
            after_state: None,
        }
    }

    /// Create with state change
    pub fn with_state(
        record_id: String,
        operator_id: String,
        operator_name: String,
        action: AuditAction,
        details: String,
        before_state: serde_json::Value,
        after_state: serde_json::Value,
    ) -> Self {
        Self {
            id: format!("audit_{}", uuid::Uuid::new_v4()),
            record_id,
            operator_id,
            operator_name,
            action,
            details,
            timestamp: Utc::now().timestamp(),
            ip_address: None,
            user_agent: None,
            before_state: Some(before_state),
            after_state: Some(after_state),
        }
    }
}

/// Timeline event for approval trace
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimelineEvent {
    pub id: String,
    pub record_id: String,
    pub event_type: TimelineEventType,
    pub title: String,
    pub description: String,
    pub actor_id: String,
    pub actor_name: String,
    pub timestamp: i64,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Timeline event types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TimelineEventType {
    Submitted,
    Approved,
    Rejected,
    Cancelled,
    Delegated,
    Reminded,
    AttachmentAdded,
    AttachmentRemoved,
    CommentAdded,
    StepCompleted,
    Overdue,
}

impl TimelineEventType {
    pub fn to_string(&self) -> &'static str {
        match self {
            Self::Submitted => "已提交",
            Self::Approved => "已批准",
            Self::Rejected => "已拒绝",
            Self::Cancelled => "已取消",
            Self::Delegated => "已委托",
            Self::Reminded => "已催办",
            Self::AttachmentAdded => "已添加附件",
            Self::AttachmentRemoved => "已移除附件",
            Self::CommentAdded => "已添加评论",
            Self::StepCompleted => "步骤完成",
            Self::Overdue => "已逾期",
        }
    }
}

impl TimelineEvent {
    /// Create a new timeline event
    pub fn new(
        record_id: String,
        event_type: TimelineEventType,
        title: String,
        description: String,
        actor_id: String,
        actor_name: String,
    ) -> Self {
        Self {
            id: format!("timeline_{}", uuid::Uuid::new_v4()),
            record_id,
            event_type,
            title,
            description,
            actor_id,
            actor_name,
            timestamp: Utc::now().timestamp(),
            metadata: HashMap::new(),
        }
    }
}

/// Attachment service for managing approval attachments
pub struct AttachmentService {
    attachments: Arc<RwLock<HashMap<String, Attachment>>>,
    audits: Arc<RwLock<Vec<AuditEntry>>>,
    timelines: Arc<RwLock<HashMap<String, Vec<TimelineEvent>>>>,
}

impl AttachmentService {
    pub fn new() -> Self {
        Self {
            attachments: Arc::new(RwLock::new(HashMap::new())),
            audits: Arc::new(RwLock::new(Vec::new())),
            timelines: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // ============ Attachment Operations ============

    /// Add attachment to a record
    pub async fn add_attachment(
        &self,
        record_id: String,
        file_name: String,
        file_size: u64,
        mime_type: String,
        storage_path: String,
        uploaded_by: String,
    ) -> Attachment {
        let attachment = Attachment::new(
            record_id.clone(),
            file_name,
            file_size,
            mime_type,
            storage_path,
            uploaded_by,
        );

        let att = attachment.clone();
        let mut attachments = self.attachments.write().await;
        attachments.insert(att.id.clone(), att.clone());

        // Add timeline event
        drop(attachments);
        self.add_timeline_event(
            record_id,
            TimelineEventType::AttachmentAdded,
            format!("添加附件: {}", att.file_name),
            format!("文件大小: {} bytes", att.file_size),
            att.uploaded_by.clone(),
            "system".to_string(),
        ).await;

        att
    }

    /// Get attachment by ID
    pub async fn get_attachment(&self, attachment_id: &str) -> Option<Attachment> {
        let attachments = self.attachments.read().await;
        attachments.get(attachment_id).cloned()
    }

    /// Get attachments for a record
    pub async fn get_record_attachments(&self, record_id: &str) -> Vec<Attachment> {
        let attachments = self.attachments.read().await;
        attachments.values()
            .filter(|a| a.record_id == record_id && a.status != AttachmentStatus::Deleted)
            .cloned()
            .collect()
    }

    /// Delete attachment (soft delete)
    pub async fn delete_attachment(
        &self,
        attachment_id: &str,
        deleted_by: String,
    ) -> bool {
        let mut attachments = self.attachments.write().await;
        if let Some(attachment) = attachments.get_mut(attachment_id) {
            let record_id = attachment.record_id.clone();
            let file_name = attachment.file_name.clone();
            attachment.mark_deleted();

            // Add timeline event
            drop(attachments);
            self.add_timeline_event(
                record_id,
                TimelineEventType::AttachmentRemoved,
                format!("移除附件: {}", file_name),
                "附件已移除".to_string(),
                deleted_by,
                "system".to_string(),
            ).await;

            return true;
        }
        false
    }

    // ============ Audit Operations ============

    /// Add audit entry
    pub async fn add_audit(
        &self,
        record_id: String,
        operator_id: String,
        operator_name: String,
        action: AuditAction,
        details: String,
    ) -> AuditEntry {
        let entry = AuditEntry::new(record_id, operator_id, operator_name, action, details);
        let e = entry.clone();
        let mut audits = self.audits.write().await;
        audits.push(e.clone());
        e
    }

    /// Add audit entry with state change
    pub async fn add_audit_with_state(
        &self,
        record_id: String,
        operator_id: String,
        operator_name: String,
        action: AuditAction,
        details: String,
        before_state: serde_json::Value,
        after_state: serde_json::Value,
    ) -> AuditEntry {
        let entry = AuditEntry::with_state(
            record_id, operator_id, operator_name, action, details,
            before_state, after_state,
        );
        let e = entry.clone();
        let mut audits = self.audits.write().await;
        audits.push(e.clone());
        e
    }

    /// Get audit entries for a record
    pub async fn get_record_audits(&self, record_id: &str) -> Vec<AuditEntry> {
        let audits = self.audits.read().await;
        audits.iter()
            .filter(|a| a.record_id == record_id)
            .cloned()
            .collect()
    }

    /// Get all audit entries
    pub async fn get_all_audits(&self) -> Vec<AuditEntry> {
        let audits = self.audits.read().await;
        audits.clone()
    }

    /// Query audits with filters
    pub async fn query_audits(
        &self,
        record_id: Option<String>,
        operator_id: Option<String>,
        action: Option<AuditAction>,
        start_time: Option<i64>,
        end_time: Option<i64>,
    ) -> Vec<AuditEntry> {
        let audits = self.audits.read().await;
        audits.iter()
            .filter(|a| {
                if let Some(ref rid) = record_id {
                    if &a.record_id != rid { return false; }
                }
                if let Some(ref oid) = operator_id {
                    if &a.operator_id != oid { return false; }
                }
                if let Some(act) = action {
                    if a.action != act { return false; }
                }
                if let Some(start) = start_time {
                    if a.timestamp < start { return false; }
                }
                if let Some(end) = end_time {
                    if a.timestamp > end { return false; }
                }
                true
            })
            .cloned()
            .collect()
    }

    // ============ Timeline Operations ============

    /// Add timeline event
    pub async fn add_timeline_event(
        &self,
        record_id: String,
        event_type: TimelineEventType,
        title: String,
        description: String,
        actor_id: String,
        actor_name: String,
    ) -> TimelineEvent {
        let event = TimelineEvent::new(
            record_id.clone(),
            event_type,
            title,
            description,
            actor_id,
            actor_name,
        );

        let e = event.clone();
        let mut timelines = self.timelines.write().await;
        let events = timelines.entry(record_id).or_insert_with(Vec::new);
        events.push(e.clone());
        e
    }

    /// Get timeline for a record (sorted by timestamp)
    pub async fn get_record_timeline(&self, record_id: &str) -> Vec<TimelineEvent> {
        let timelines = self.timelines.read().await;
        let mut events = timelines.get(record_id).cloned().unwrap_or_default();
        events.sort_by_key(|e| e.timestamp);
        events
    }

    /// Check if timeline exists for record
    pub async fn has_timeline(&self, record_id: &str) -> bool {
        let timelines = self.timelines.read().await;
        timelines.contains_key(record_id)
    }
}

impl Default for AttachmentService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_attachment_lifecycle() {
        let service = AttachmentService::new();

        // Add attachment
        let att = service.add_attachment(
            "record-001".to_string(),
            "test.pdf".to_string(),
            1024,
            "application/pdf".to_string(),
            "/storage/att_001.pdf".to_string(),
            "user-001".to_string(),
        ).await;

        assert_eq!(att.file_name, "test.pdf");
        assert_eq!(att.status, AttachmentStatus::Uploaded);

        // Get attachment
        let retrieved = service.get_attachment(&att.id).await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().file_name, "test.pdf");

        // Get record attachments
        let attachments = service.get_record_attachments("record-001").await;
        assert_eq!(attachments.len(), 1);
    }

    #[tokio::test]
    async fn test_audit_trail() {
        let service = AttachmentService::new();

        // Add audit entry
        service.add_audit(
            "record-001".to_string(),
            "user-001".to_string(),
            "张三".to_string(),
            AuditAction::Approve,
            "批准了申请".to_string(),
        ).await;

        // Query audits
        let audits = service.get_record_audits("record-001").await;
        assert_eq!(audits.len(), 1);
        assert_eq!(audits[0].action, AuditAction::Approve);
    }

    #[tokio::test]
    async fn test_timeline() {
        let service = AttachmentService::new();

        // Add timeline events
        service.add_timeline_event(
            "record-001".to_string(),
            TimelineEventType::Submitted,
            "已提交".to_string(),
            "申请已提交".to_string(),
            "user-001".to_string(),
            "张三".to_string(),
        ).await;

        service.add_timeline_event(
            "record-001".to_string(),
            TimelineEventType::Approved,
            "已批准".to_string(),
            "申请已批准".to_string(),
            "user-002".to_string(),
            "李四".to_string(),
        ).await;

        // Get timeline
        let timeline = service.get_record_timeline("record-001").await;
        assert_eq!(timeline.len(), 2);
        assert_eq!(timeline[0].event_type, TimelineEventType::Submitted);
        assert_eq!(timeline[1].event_type, TimelineEventType::Approved);
    }
}
