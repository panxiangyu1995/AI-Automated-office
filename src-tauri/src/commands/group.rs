//! 群组管理 Tauri 命令
//!
//! 暴露群聊功能给前端

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::message::group::{Group, GroupMember, GroupType, MemberRole, GroupStore, GroupError};
use crate::message::group_message::{GroupMessage, GroupMessageStore};

pub struct GroupServiceState(pub Arc<RwLock<GroupStore>>);
pub struct GroupMessageServiceState(pub Arc<RwLock<GroupMessageStore>>);

/// 创建群组
#[tauri::command]
pub async fn create_group(
    state: State<'_, GroupServiceState>,
    name: String,
    owner_id: String,
    group_type: String,
) -> Result<Group, String> {
    let store = state.0.read().await;
    
    let gt = match group_type.to_lowercase().as_str() {
        "private" => GroupType::Private,
        _ => GroupType::Public,
    };
    
    store.create_group(name, owner_id, gt)
        .await
        .map_err(|e| e.to_string())
}

/// 更新群组
#[tauri::command]
pub async fn update_group(
    state: State<'_, GroupServiceState>,
    group_id: String,
    name: Option<String>,
    announcement: Option<String>,
    updater_id: String,
) -> Result<Group, String> {
    let store = state.0.read().await;
    
    store.update_group(&group_id, name, announcement, &updater_id)
        .await
        .map_err(|e| e.to_string())
}

/// 删除群组
#[tauri::command]
pub async fn delete_group(
    state: State<'_, GroupServiceState>,
    group_id: String,
    user_id: String,
) -> Result<(), String> {
    let store = state.0.read().await;
    
    store.delete_group(&group_id, &user_id)
        .await
        .map_err(|e| e.to_string())
}

/// 获取群组详情
#[tauri::command]
pub async fn get_group(
    state: State<'_, GroupServiceState>,
    group_id: String,
) -> Result<Group, String> {
    let store = state.0.read().await;
    
    store.get_group(&group_id)
        .await
        .map_err(|e| e.to_string())
}

/// 获取用户的群组列表
#[tauri::command]
pub async fn get_user_groups(
    state: State<'_, GroupServiceState>,
    user_id: String,
) -> Result<Vec<Group>, String> {
    let store = state.0.read().await;
    
    Ok(store.get_user_groups(&user_id).await)
}

/// 邀请成员
#[tauri::command]
pub async fn invite_member(
    state: State<'_, GroupServiceState>,
    group_id: String,
    user_id: String,
    inviter_id: String,
) -> Result<GroupMember, String> {
    let store = state.0.read().await;
    
    store.add_member(&group_id, user_id, MemberRole::Member, &inviter_id)
        .await
        .map_err(|e| e.to_string())
}

/// 移除成员
#[tauri::command]
pub async fn remove_member(
    state: State<'_, GroupServiceState>,
    group_id: String,
    user_id: String,
    remover_id: String,
) -> Result<(), String> {
    let store = state.0.read().await;
    
    store.remove_member(&group_id, &user_id, &remover_id)
        .await
        .map_err(|e| e.to_string())
}

/// 设置管理员
#[tauri::command]
pub async fn set_group_admin(
    state: State<'_, GroupServiceState>,
    group_id: String,
    user_id: String,
    is_admin: bool,
    setter_id: String,
) -> Result<(), String> {
    let store = state.0.read().await;
    
    store.set_admin(&group_id, &user_id, is_admin, &setter_id)
        .await
        .map_err(|e| e.to_string())
}

/// 设置Agent自动入群
#[tauri::command]
pub async fn set_agent_auto_join(
    state: State<'_, GroupServiceState>,
    group_id: String,
    user_id: String,
    enabled: bool,
    setter_id: String,
) -> Result<(), String> {
    let store = state.0.read().await;
    
    store.set_agent_auto_join(&group_id, &user_id, enabled, &setter_id)
        .await
        .map_err(|e| e.to_string())
}

/// 获取群成员列表
#[tauri::command]
pub async fn get_group_members(
    state: State<'_, GroupServiceState>,
    group_id: String,
) -> Result<Vec<GroupMember>, String> {
    let store = state.0.read().await;
    
    store.get_members(&group_id)
        .await
        .map_err(|e| e.to_string())
}

/// 发送群消息
#[tauri::command]
pub async fn send_group_message(
    msg_state: State<'_, GroupMessageServiceState>,
    group_state: State<'_, GroupServiceState>,
    group_id: String,
    sender_id: String,
    sender_type: String,
    content: String,
) -> Result<GroupMessage, String> {
    // 验证用户是群成员
    let group_store = group_state.0.read().await;
    let group = group_store.get_group(&group_id)
        .await
        .map_err(|e| e.to_string())?;
    
    if !group.is_member(&sender_id) {
        return Err("不是群成员，无法发送消息".to_string());
    }
    drop(group_store);
    
    // 创建并保存消息
    let msg_store = msg_state.0.read().await;
    let message = GroupMessage::new(group_id, sender_id, sender_type, content);
    
    Ok(msg_store.send_message(message).await)
}

/// 获取群消息
#[tauri::command]
pub async fn get_group_messages(
    state: State<'_, GroupMessageServiceState>,
    group_id: String,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<GroupMessage>, String> {
    let store = state.0.read().await;
    
    Ok(store.get_messages(&group_id, limit, offset).await)
}

/// 获取被@提及的消息
#[tauri::command]
pub async fn get_mentioned_messages(
    state: State<'_, GroupMessageServiceState>,
    user_id: String,
) -> Result<Vec<GroupMessage>, String> {
    let store = state.0.read().await;
    
    Ok(store.get_mentions(&user_id).await)
}

/// 初始化群组服务
pub fn init_group_service() -> GroupServiceState {
    GroupServiceState(Arc::new(RwLock::new(GroupStore::new())))
}

/// 初始化群消息服务
pub fn init_group_message_service() -> GroupMessageServiceState {
    GroupMessageServiceState(Arc::new(RwLock::new(GroupMessageStore::new())))
}
