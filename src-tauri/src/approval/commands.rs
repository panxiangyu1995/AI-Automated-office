//! Approval 模块 Tauri 命令

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
    request: CreateFlowRequest,
    created_by: String,
) -> Result<ApprovalFlow, String> {
    info!("创建审批流程: {}", request.name);
    state.db.create_flow(request, created_by)
}

#[tauri::command]
pub async fn approval_list_flows(
    state: State<'_, ApprovalState>,
) -> Result<Vec<FlowListItem>, String> {
    Ok(state.db.list_flows())
}

#[tauri::command]
pub async fn approval_get_flow(
    state: State<'_, ApprovalState>,
    id: String,
) -> Result<ApprovalFlow, String> {
    state.db.get_flow(&id).ok_or("流程不存在".to_string())
}

#[tauri::command]
pub async fn approval_update_flow(
    state: State<'_, ApprovalState>,
    id: String,
    request: UpdateFlowRequest,
) -> Result<ApprovalFlow, String> {
    info!("更新审批流程: {}", id);
    state.db.update_flow(&id, request)
}

#[tauri::command]
pub async fn approval_delete_flow(
    state: State<'_, ApprovalState>,
    id: String,
) -> Result<(), String> {
    info!("删除审批流程: {}", id);
    state.db.delete_flow(&id)
}

// ==================== 记录命令 ====================

#[tauri::command]
pub async fn approval_create_record(
    state: State<'_, ApprovalState>,
    request: CreateRecordRequest,
) -> Result<ApprovalRecord, String> {
    info!("发起审批: {}", request.flow_id);
    state.db.create_record(request)
}

#[tauri::command]
pub async fn approval_list_records(
    state: State<'_, ApprovalState>,
    status: Option<String>,
) -> Result<Vec<RecordListItem>, String> {
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
    id: String,
) -> Result<ApprovalRecord, String> {
    state.db.get_record(&id).ok_or("记录不存在".to_string())
}

#[tauri::command]
pub async fn approval_approve(
    state: State<'_, ApprovalState>,
    id: String,
    request: ApproveRequest,
) -> Result<ApprovalRecord, String> {
    info!("审批通过: {}", id);
    state.db.approve_record(&id, request)
}

#[tauri::command]
pub async fn approval_reject(
    state: State<'_, ApprovalState>,
    id: String,
    request: ApproveRequest,
) -> Result<ApprovalRecord, String> {
    info!("审批驳回: {}", id);
    state.db.reject_record(&id, request)
}

#[tauri::command]
pub async fn approval_cancel(
    state: State<'_, ApprovalState>,
    id: String,
) -> Result<ApprovalRecord, String> {
    info!("取消审批: {}", id);
    state.db.cancel_record(&id)
}

#[tauri::command]
pub async fn approval_get_stats(
    state: State<'_, ApprovalState>,
) -> Result<ApprovalStats, String> {
    Ok(state.db.get_stats())
}
