//! Agent间通信 Tauri 命令
//!
//! 暴露 Agent 间通信服务给前端

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::agent::intercom::{
    types::{AgentMessage, AgentPermission, MessageContent, MessageStatus},
    service::AgentIntercomService,
};
use crate::agent::AgentState;

pub struct IntercomServiceState(pub Arc<RwLock<Option<AgentIntercomService>>>);

/// 发送Agent间消息
#[tauri::command]
pub async fn send_agent_message(
    state: State<'_, IntercomServiceState>,
    agent_state: State<'_, Arc<RwLock<AgentState>>>,
    sender_id: String,
    receiver_id: String,
    content: String,
) -> Result<AgentMessage, String> {
    let service = state.0.read().await;
    
    if let Some(svc) = service.as_ref() {
        let content = MessageContent::text(content);
        svc.send_message(&sender_id, &receiver_id, content)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Agent通信服务未初始化".to_string())
    }
}

/// 获取Agent消息列表
#[tauri::command]
pub async fn get_agent_messages(
    state: State<'_, IntercomServiceState>,
    agent_id: String,
    limit: Option<usize>,
) -> Result<Vec<AgentMessage>, String> {
    let service = state.0.read().await;
    
    if let Some(svc) = service.as_ref() {
        svc.get_messages(&agent_id, limit)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Agent通信服务未初始化".to_string())
    }
}

/// 更新消息状态
#[tauri::command]
pub async fn update_agent_message_status(
    state: State<'_, IntercomServiceState>,
    message_id: String,
    status: String,
) -> Result<(), String> {
    let service = state.0.read().await;
    
    if let Some(svc) = service.as_ref() {
        let status = match status.as_str() {
            "sending" => MessageStatus::Sending,
            "sent" => MessageStatus::Sent,
            "delivered" => MessageStatus::Delivered,
            "read" => MessageStatus::Read,
            "failed" => MessageStatus::Failed,
            _ => return Err("无效的消息状态".to_string()),
        };
        
        svc.update_message_status(&message_id, status)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Agent通信服务未初始化".to_string())
    }
}

/// 确认消息发送 (FR60)
#[tauri::command]
pub async fn confirm_agent_message(
    state: State<'_, IntercomServiceState>,
    message_id: String,
    approved: bool,
) -> Result<AgentMessage, String> {
    let service = state.0.read().await;
    
    if let Some(svc) = service.as_ref() {
        svc.confirm_message(&message_id, approved)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Agent通信服务未初始化".to_string())
    }
}

/// 设置Agent权限 (FR62)
#[tauri::command]
pub async fn set_agent_permission(
    state: State<'_, IntercomServiceState>,
    agent_id: String,
    permission: AgentPermission,
) -> Result<(), String> {
    let service = state.0.read().await;

    if let Some(svc) = service.as_ref() {
        let mut perm = permission;
        perm.agent_id = agent_id.clone();
        svc.set_permission(&agent_id, perm)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Agent通信服务未初始化".to_string())
    }
}

/// 获取Agent权限
#[tauri::command]
pub async fn get_agent_permission(
    state: State<'_, IntercomServiceState>,
    agent_id: String,
) -> Result<AgentPermission, String> {
    let service = state.0.read().await;
    
    if let Some(svc) = service.as_ref() {
        svc.get_permission(&agent_id)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Agent通信服务未初始化".to_string())
    }
}

/// 撤回消息 (FR63)
#[tauri::command]
pub async fn recall_agent_message(
    state: State<'_, IntercomServiceState>,
    message_id: String,
    sender_id: String,
) -> Result<(), String> {
    let service = state.0.read().await;
    
    if let Some(svc) = service.as_ref() {
        svc.recall_message(&message_id, &sender_id)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Agent通信服务未初始化".to_string())
    }
}

/// 初始化Agent通信服务
pub fn init_intercom_service() -> IntercomServiceState {
    use crate::agent::intercom::service::AgentIntercomServiceBuilder;
    use crate::agent::intercom::types::AgentIntercomConfig;
    
    let service = AgentIntercomServiceBuilder::new()
        .enabled(true)
        .audit_enabled(true)
        .content_moderation_enabled(true)
        .max_hop_count(3)
        .build();
    
    IntercomServiceState(Arc::new(RwLock::new(Some(service))))
}
