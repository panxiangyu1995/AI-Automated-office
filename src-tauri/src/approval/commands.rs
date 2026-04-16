//! Approval 模块 Tauri 命令

use crate::auth::{AuthService, verify_and_check, Permission};
use crate::approval::db::ApprovalDatabase;
use crate::approval::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

pub struct ApprovalState {
    pub db: Arc<ApprovalDatabase>,
}

impl ApprovalState {
    pub fn new() -> Self {
        let db = Arc::new(ApprovalDatabase::new());
        db.init_defaults();
        Self { db }
    }
}

impl Default for ApprovalState {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== 流程命令 ====================

#[tauri::command]
pub async fn approval_create_flow(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateFlowRequest,
    created_by: String,
) -> Result<ApprovalFlow, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建审批流程: {}", request.name);
    state.db.create_flow(request, created_by)
}

#[tauri::command]
pub async fn approval_list_flows(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<FlowListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_flows())
}

#[tauri::command]
pub async fn approval_get_flow(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<ApprovalFlow, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_flow(&id).ok_or("流程不存在".to_string())
}

#[tauri::command]
pub async fn approval_update_flow(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    request: UpdateFlowRequest,
) -> Result<ApprovalFlow, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("更新审批流程: {}", id);
    state.db.update_flow(&id, request)
}

#[tauri::command]
pub async fn approval_delete_flow(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    info!("删除审批流程: {}", id);
    state.db.delete_flow(&id)
}

// ==================== 记录命令 ====================

#[tauri::command]
pub async fn approval_create_record(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateRecordRequest,
) -> Result<ApprovalRecord, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("发起审批: {}", request.flow_id);
    state.db.create_record(request)
}

#[tauri::command]
pub async fn approval_list_records(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    status: Option<String>,
) -> Result<Vec<RecordListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    let status = status.and_then(|s| match s.as_str() {
        "pending" => Some(RecordStatus::Pending),
        "approved" => Some(RecordStatus::Approved),
        "rejected" => Some(RecordStatus::Rejected),
        _ => None,
    });
    Ok(state.db.list_records(status))
}

#[tauri::command]
pub async fn approval_get_record(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<ApprovalRecord, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    state.db.get_record(&id).ok_or("记录不存在".to_string())
}

#[tauri::command]
pub async fn approval_approve(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    request: ApproveRequest,
) -> Result<ApprovalRecord, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("审批通过: {}", id);
    state.db.approve_record(&id, request)
}

#[tauri::command]
pub async fn approval_reject(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    request: ApproveRequest,
) -> Result<ApprovalRecord, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("审批驳回: {}", id);
    state.db.reject_record(&id, request)
}

#[tauri::command]
pub async fn approval_cancel(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<ApprovalRecord, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("取消审批: {}", id);
    state.db.cancel_record(&id)
}

#[tauri::command]
pub async fn approval_get_stats(
    state: State<'_, ApprovalState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<ApprovalStats, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.get_stats())
}
