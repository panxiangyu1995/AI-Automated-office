//! 审批增强功能 Tauri 命令
//!
//! 暴露委托和催办功能给前端

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::approval::delegation::{
    ApprovalDelegation, DelegationType, DelegationStore, DelegationError,
};
use crate::approval::reminder::{
    ReminderLevel, ReminderSettings, ReminderService, ReminderRecord, ReminderStats,
};

pub struct DelegationState(pub Arc<RwLock<DelegationStore>>);
pub struct ReminderState(pub Arc<RwLock<ReminderService>>);

/// 设置审批委托
#[tauri::command]
pub async fn set_delegation(
    state: State<'_, DelegationState>,
    delegator_id: String,
    delegate_id: String,
    delegation_type: DelegationType,
    start_time: String,
    end_time: Option<String>,
    reason: Option<String>,
) -> Result<ApprovalDelegation, String> {
    let store = state.0.read().await;
    
    let start = chrono::DateTime::parse_from_rfc3339(&start_time)
        .map_err(|e| format!("无效的日期格式: {}", e))?
        .with_timezone(&chrono::Utc);
    
    let end = if let Some(et) = end_time {
        Some(
            chrono::DateTime::parse_from_rfc3339(&et)
                .map_err(|e| format!("无效的日期格式: {}", e))?
                .with_timezone(&chrono::Utc)
        )
    } else {
        None
    };
    
    let delegation = ApprovalDelegation::new(
        delegator_id,
        delegate_id,
        delegation_type,
        start,
        end,
        reason,
    );
    
    store.set_delegation(delegation)
        .await
        .map_err(|e| e.to_string())
}

/// 取消委托
#[tauri::command]
pub async fn cancel_delegation(
    state: State<'_, DelegationState>,
    delegation_id: String,
    user_id: String,
) -> Result<(), String> {
    let store = state.0.read().await;
    
    store.cancel_delegation(&delegation_id, &user_id)
        .await
        .map_err(|e| e.to_string())
}

/// 获取委托
#[tauri::command]
pub async fn get_delegation(
    state: State<'_, DelegationState>,
    user_id: String,
) -> Result<Option<ApprovalDelegation>, String> {
    let store = state.0.read().await;
    
    Ok(store.get_delegation(&user_id).await)
}

/// 获取作为被委托人的委托列表
#[tauri::command]
pub async fn get_delegations_as_delegate(
    state: State<'_, DelegationState>,
    delegate_id: String,
) -> Result<Vec<ApprovalDelegation>, String> {
    let store = state.0.read().await;
    
    Ok(store.get_delegations_as_delegate(&delegate_id).await)
}

/// 发送催办
#[tauri::command]
pub async fn send_approval_reminder(
    state: State<'_, ReminderState>,
    approval_id: String,
    approver_id: String,
    approver_name: String,
    reminder_id: String,
    reminder_name: String,
    level: String,
) -> Result<crate::approval::reminder::ReminderResult, String> {
    let service = state.0.read().await;
    
    let reminder_level = match level.to_lowercase().as_str() {
        "urgent" => ReminderLevel::Urgent,
        "critical" => ReminderLevel::Critical,
        _ => ReminderLevel::Normal,
    };
    
    Ok(service.send_reminder(
        approval_id,
        approver_id,
        approver_name,
        reminder_id,
        reminder_name,
        reminder_level,
    ).await)
}

/// 获取催办记录
#[tauri::command]
pub async fn get_reminder_records(
    state: State<'_, ReminderState>,
    approval_id: String,
) -> Result<Vec<ReminderRecord>, String> {
    let service = state.0.read().await;
    
    Ok(service.get_reminders(&approval_id).await)
}

/// 获取催办统计
#[tauri::command]
pub async fn get_reminder_stats(
    state: State<'_, ReminderState>,
    approver_id: String,
) -> Result<ReminderStats, String> {
    let service = state.0.read().await;
    
    Ok(service.get_reminder_stats(&approver_id).await)
}

/// 设置催办设置
#[tauri::command]
pub async fn set_reminder_settings(
    state: State<'_, ReminderState>,
    user_id: String,
    settings: ReminderSettings,
) -> Result<(), String> {
    let service = state.0.read().await;
    
    service.set_settings(&user_id, settings).await;
    Ok(())
}

/// 获取催办设置
#[tauri::command]
pub async fn get_reminder_settings(
    state: State<'_, ReminderState>,
    user_id: String,
) -> Result<ReminderSettings, String> {
    let service = state.0.read().await;
    
    Ok(service.get_settings(&user_id).await)
}

/// 初始化委托服务
pub fn init_delegation_service() -> DelegationState {
    DelegationState(Arc::new(RwLock::new(DelegationStore::new())))
}

/// 初始化催办服务
pub fn init_reminder_service() -> ReminderState {
    ReminderState(Arc::new(RwLock::new(ReminderService::new())))
}
