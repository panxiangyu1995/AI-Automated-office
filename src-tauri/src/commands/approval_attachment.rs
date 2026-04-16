//! Approval Attachment Commands
//!
//! Tauri commands for attachment management, audit trail, and timeline tracking
//! FR137-FR142: Attachment upload, preview, download, timeline trace, audit

use tauri::State;
use std::sync::Arc;
use crate::auth::{AuthService, verify_and_check, Permission};
use crate::approval::attachment::{
    AttachmentService, AuditAction, TimelineEventType,
};

/// Create and add a new attachment (Write)
#[tauri::command]
pub async fn add_attachment(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
    file_name: String,
    file_size: u64,
    mime_type: String,
    storage_path: String,
    uploaded_by: String,
) -> Result<crate::approval::attachment::Attachment, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    Ok(service
        .add_attachment(record_id, file_name, file_size, mime_type, storage_path, uploaded_by)
        .await)
}

/// Get attachment by ID (Read)
#[tauri::command]
pub async fn get_attachment(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    attachment_id: String,
) -> Result<Option<crate::approval::attachment::Attachment>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_attachment(&attachment_id).await)
}

/// Get all attachments for a record (Read)
#[tauri::command]
pub async fn get_record_attachments(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
) -> Result<Vec<crate::approval::attachment::Attachment>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_record_attachments(&record_id).await)
}

/// Delete attachment (soft delete) (Admin)
#[tauri::command]
pub async fn delete_attachment(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    attachment_id: String,
    deleted_by: String,
) -> Result<bool, String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    Ok(service.delete_attachment(&attachment_id, deleted_by).await)
}

/// Add audit entry (Write)
#[tauri::command]
pub async fn add_audit_entry(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
    operator_id: String,
    operator_name: String,
    action: String,
    details: String,
) -> Result<crate::approval::attachment::AuditEntry, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    let action = match action.as_str() {
        "create" => AuditAction::Create,
        "update" => AuditAction::Update,
        "delete" => AuditAction::Delete,
        "approve" => AuditAction::Approve,
        "reject" => AuditAction::Reject,
        "cancel" => AuditAction::Cancel,
        "submit" => AuditAction::Submit,
        "delegate" => AuditAction::Delegate,
        "remind" => AuditAction::Remind,
        "attach" => AuditAction::Attach,
        "detach" => AuditAction::Detach,
        "view" => AuditAction::View,
        _ => return Err(format!("Unknown audit action: {}", action)),
    };
    Ok(service
        .add_audit(record_id, operator_id, operator_name, action, details)
        .await)
}

/// Add audit entry with state change (Write)
#[tauri::command]
pub async fn add_audit_with_state(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
    operator_id: String,
    operator_name: String,
    action: String,
    details: String,
    before_state: String,
    after_state: String,
) -> Result<crate::approval::attachment::AuditEntry, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    let action = match action.as_str() {
        "create" => AuditAction::Create,
        "update" => AuditAction::Update,
        "delete" => AuditAction::Delete,
        "approve" => AuditAction::Approve,
        "reject" => AuditAction::Reject,
        "cancel" => AuditAction::Cancel,
        "submit" => AuditAction::Submit,
        "delegate" => AuditAction::Delegate,
        "remind" => AuditAction::Remind,
        "attach" => AuditAction::Attach,
        "detach" => AuditAction::Detach,
        "view" => AuditAction::View,
        _ => return Err(format!("Unknown audit action: {}", action)),
    };
    let before_state: serde_json::Value = serde_json::from_str(&before_state)
        .map_err(|e| format!("Invalid before_state JSON: {}", e))?;
    let after_state: serde_json::Value = serde_json::from_str(&after_state)
        .map_err(|e| format!("Invalid after_state JSON: {}", e))?;
    Ok(service
        .add_audit_with_state(record_id, operator_id, operator_name, action, details, before_state, after_state)
        .await)
}

/// Get audit entries for a record (Read)
#[tauri::command]
pub async fn get_record_audits(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
) -> Result<Vec<crate::approval::attachment::AuditEntry>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_record_audits(&record_id).await)
}

/// Get all audit entries (Read)
#[tauri::command]
pub async fn get_all_audits(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<crate::approval::attachment::AuditEntry>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_all_audits().await)
}

/// Query audits with filters (Read)
#[tauri::command]
pub async fn query_audits(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: Option<String>,
    operator_id: Option<String>,
    action: Option<String>,
    start_time: Option<i64>,
    end_time: Option<i64>,
) -> Result<Vec<crate::approval::attachment::AuditEntry>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    let action = match action.as_ref().map(|a| a.as_str()) {
        Some("create") => Some(AuditAction::Create),
        Some("update") => Some(AuditAction::Update),
        Some("delete") => Some(AuditAction::Delete),
        Some("approve") => Some(AuditAction::Approve),
        Some("reject") => Some(AuditAction::Reject),
        Some("cancel") => Some(AuditAction::Cancel),
        Some("submit") => Some(AuditAction::Submit),
        Some("delegate") => Some(AuditAction::Delegate),
        Some("remind") => Some(AuditAction::Remind),
        Some("attach") => Some(AuditAction::Attach),
        Some("detach") => Some(AuditAction::Detach),
        Some("view") => Some(AuditAction::View),
        Some(a) => return Err(format!("Unknown audit action: {}", a)),
        None => None,
    };
    Ok(service.query_audits(record_id, operator_id, action, start_time, end_time).await)
}

/// Add timeline event (Write)
#[tauri::command]
pub async fn add_timeline_event(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
    event_type: String,
    title: String,
    description: String,
    actor_id: String,
    actor_name: String,
) -> Result<crate::approval::attachment::TimelineEvent, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    let event_type = match event_type.as_str() {
        "submitted" => TimelineEventType::Submitted,
        "approved" => TimelineEventType::Approved,
        "rejected" => TimelineEventType::Rejected,
        "cancelled" => TimelineEventType::Cancelled,
        "delegated" => TimelineEventType::Delegated,
        "reminded" => TimelineEventType::Reminded,
        "attachment_added" => TimelineEventType::AttachmentAdded,
        "attachment_removed" => TimelineEventType::AttachmentRemoved,
        "comment_added" => TimelineEventType::CommentAdded,
        "step_completed" => TimelineEventType::StepCompleted,
        "overdue" => TimelineEventType::Overdue,
        _ => return Err(format!("Unknown timeline event type: {}", event_type)),
    };
    Ok(service
        .add_timeline_event(record_id, event_type, title, description, actor_id, actor_name)
        .await)
}

/// Get timeline for a record (Read)
#[tauri::command]
pub async fn get_record_timeline(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
) -> Result<Vec<crate::approval::attachment::TimelineEvent>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.get_record_timeline(&record_id).await)
}

/// Check if timeline exists for record (Read)
#[tauri::command]
pub async fn has_timeline(
    service: State<'_, Arc<AttachmentService>>,
    auth_service: State<'_, AuthService>,
    token: String,
    record_id: String,
) -> Result<bool, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(service.has_timeline(&record_id).await)
}
