//! Resource Security Management Tauri Commands
//!
//! Commands for:
//! - Security validation
//! - Security scanning
//! - Approval workflow
//! - Audit logging
//! - Policy management

use tauri::State;

use crate::agent::resource_security::{
    ApprovalRequest, ApprovalStatus, ResourceSecurityService, SecurityAuditEntry,
    SecurityPolicy, SecurityScan, SecurityValidation, ResourceSecurityStats,
};

/// Resource security service state
#[derive(Clone)]
pub struct ResourceSecurityState {
    pub service: std::sync::Arc<ResourceSecurityService>,
}

impl Default for ResourceSecurityState {
    fn default() -> Self {
        Self {
            service: std::sync::Arc::new(ResourceSecurityService::new()),
        }
    }
}

impl ResourceSecurityState {
    pub fn new() -> Self {
        Self::default()
    }
}

/// Initialize the resource security service with mock data
#[tauri::command]
pub async fn init_resource_security(state: State<'_, ResourceSecurityState>) -> Result<(), String> {
    state.service.initialize_mock_data().await;
    tracing::info!("Resource security service initialized with mock data");
    Ok(())
}

/// Get all security validations
#[tauri::command]
pub async fn get_security_validations(
    state: State<'_, ResourceSecurityState>,
) -> Result<Vec<SecurityValidation>, String> {
    Ok(state.service.get_validations().await)
}

/// Get security validation by ID
#[tauri::command]
pub async fn get_security_validation(
    id: String,
    state: State<'_, ResourceSecurityState>,
) -> Result<Option<SecurityValidation>, String> {
    Ok(state.service.get_validation(&id).await)
}

/// Get all security scans
#[tauri::command]
pub async fn get_security_scans(
    state: State<'_, ResourceSecurityState>,
) -> Result<Vec<SecurityScan>, String> {
    Ok(state.service.get_scans().await)
}

/// Get security scan by ID
#[tauri::command]
pub async fn get_security_scan(
    id: String,
    state: State<'_, ResourceSecurityState>,
) -> Result<Option<SecurityScan>, String> {
    Ok(state.service.get_scan(&id).await)
}

/// Get pending approval requests
#[tauri::command]
pub async fn get_pending_security_approvals(
    state: State<'_, ResourceSecurityState>,
) -> Result<Vec<ApprovalRequest>, String> {
    Ok(state.service.get_pending_approvals().await)
}

/// Get approval request by ID
#[tauri::command]
pub async fn get_security_approval(
    id: String,
    state: State<'_, ResourceSecurityState>,
) -> Result<Option<ApprovalRequest>, String> {
    Ok(state.service.get_approval(&id).await)
}

/// Add approval request
#[tauri::command]
pub async fn add_security_approval(
    approval: ApprovalRequest,
    state: State<'_, ResourceSecurityState>,
) -> Result<(), String> {
    state.service.add_approval(approval).await;
    Ok(())
}

/// Update approval status (approve/reject)
#[tauri::command]
pub async fn update_security_approval_status(
    id: String,
    status: ApprovalStatus,
    reviewed_by: String,
    comment: Option<String>,
    state: State<'_, ResourceSecurityState>,
) -> Result<Option<ApprovalRequest>, String> {
    Ok(state
        .service
        .update_approval_status(&id, status, reviewed_by, comment)
        .await)
}

/// Get audit log entries
#[tauri::command]
pub async fn get_security_audit_log(
    limit: Option<u32>,
    state: State<'_, ResourceSecurityState>,
) -> Result<Vec<SecurityAuditEntry>, String> {
    Ok(state.service.get_audit_log(limit).await)
}

/// Add audit entry
#[tauri::command]
pub async fn add_security_audit_entry(
    entry: SecurityAuditEntry,
    state: State<'_, ResourceSecurityState>,
) -> Result<(), String> {
    state.service.add_audit_entry(entry).await;
    Ok(())
}

/// Get security policy
#[tauri::command]
pub async fn get_security_policy(
    state: State<'_, ResourceSecurityState>,
) -> Result<SecurityPolicy, String> {
    Ok(state.service.get_policy().await)
}

/// Update security policy
#[tauri::command]
pub async fn update_security_policy(
    policy: SecurityPolicy,
    state: State<'_, ResourceSecurityState>,
) -> Result<SecurityPolicy, String> {
    Ok(state.service.update_policy(policy).await)
}

/// Get resource security statistics
#[tauri::command]
pub async fn get_resource_security_stats(
    state: State<'_, ResourceSecurityState>,
) -> Result<ResourceSecurityStats, String> {
    Ok(state.service.get_stats().await)
}
