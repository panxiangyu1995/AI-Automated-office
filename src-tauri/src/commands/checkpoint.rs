//! 检查点系统 Tauri 命令
//!
//! 暴露检查点功能给前端

use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::State;

use crate::agent::checkpoint::{
    Checkpoint, CheckpointService, RollbackMode, SessionContext,
};

pub struct CheckpointState(pub Arc<RwLock<CheckpointService>>);

/// 获取会话的检查点列表
#[tauri::command]
pub async fn get_checkpoints(
    state: State<'_, CheckpointState>,
    session_id: String,
) -> Result<Vec<Checkpoint>, String> {
    let service = state.0.read().await;
    Ok(service.get_checkpoints(&session_id).await)
}

/// 获取单个检查点
#[tauri::command]
pub async fn get_checkpoint(
    state: State<'_, CheckpointState>,
    checkpoint_id: String,
) -> Result<Option<Checkpoint>, String> {
    let service = state.0.read().await;
    Ok(service.get_checkpoint(&checkpoint_id).await)
}

/// 回滚到检查点
#[tauri::command]
pub async fn rollback_to_checkpoint(
    state: State<'_, CheckpointState>,
    checkpoint_id: String,
    mode: String,
) -> Result<SessionContext, String> {
    let service = state.0.read().await;
    
    let rollback_mode = match mode.as_str() {
        "conversation_only" => RollbackMode::ConversationOnly,
        "conversation_and_files" => RollbackMode::ConversationAndFiles,
        _ => return Err("无效的回滚模式".to_string()),
    };
    
    service.rollback_to(&checkpoint_id, rollback_mode)
        .await
        .map_err(|e| e.to_string())
}

/// 编辑并重发
#[tauri::command]
pub async fn edit_and_resend(
    state: State<'_, CheckpointState>,
    checkpoint_id: String,
    new_input: String,
) -> Result<(Checkpoint, SessionContext), String> {
    let service = state.0.read().await;
    
    service.edit_and_resend(&checkpoint_id, &new_input)
        .await
        .map_err(|e| e.to_string())
}

/// 创建重要检查点
#[tauri::command]
pub async fn create_important_checkpoint(
    state: State<'_, CheckpointState>,
    session_id: String,
    user_input: String,
    conversation_turn: i32,
    message_ids: Vec<String>,
) -> Result<Checkpoint, String> {
    let service = state.0.read().await;
    
    Ok(service.create_important_checkpoint(
        &session_id,
        &user_input,
        conversation_turn,
        message_ids,
    ).await)
}

/// 标记/取消标记检查点为重要
#[tauri::command]
pub async fn toggle_checkpoint_important(
    state: State<'_, CheckpointState>,
    checkpoint_id: String,
    important: bool,
) -> Result<(), String> {
    let service = state.0.read().await;
    
    service.toggle_important(&checkpoint_id, important)
        .await
        .map_err(|e| e.to_string())
}

/// 删除检查点
#[tauri::command]
pub async fn delete_checkpoint(
    state: State<'_, CheckpointState>,
    checkpoint_id: String,
) -> Result<(), String> {
    let service = state.0.read().await;
    
    service.delete_checkpoint(&checkpoint_id)
        .await
        .map_err(|e| e.to_string())
}

/// 初始化检查点服务
pub fn init_checkpoint_service() -> CheckpointState {
    CheckpointState(Arc::new(RwLock::new(CheckpointService::new())))
}