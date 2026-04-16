//! WorkCard Tauri 命令
//!
//! 暴露工作卡片相关功能给前端

use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

use crate::workcard::{
    ActionResult, CardAction, CardField, CardPriority, CardStatus, CardActionType,
    WorkCard, WorkCardService, WorkCardTemplate, TemplateContext,
};

/// WorkCard State wrapper
pub struct WorkCardState(pub Arc<RwLock<WorkCardService>>);

impl Default for WorkCardState {
    fn default() -> Self {
        Self(Arc::new(RwLock::new(WorkCardService::new())))
    }
}

// ============================================================================
// Card CRUD Commands
// ============================================================================

/// 创建工作卡片
#[tauri::command]
pub async fn create_work_card(
    state: State<'_, WorkCardState>,
    title: String,
    card_type: String,
    priority: CardPriority,
    sender_id: String,
    sender_name: String,
    fields: Vec<CardField>,
    actions: Vec<CardAction>,
) -> Result<WorkCard, String> {
    let service = state.0.read().await;

    let card = WorkCard::new(
        title,
        card_type,
        priority,
        sender_id,
        sender_name,
        fields,
        actions,
    );

    service.create_card(card).await
}

/// 获取工作卡片
#[tauri::command]
pub async fn get_work_card(
    state: State<'_, WorkCardState>,
    card_id: String,
) -> Result<Option<WorkCard>, String> {
    let service = state.0.read().await;
    service.get_card(&card_id).await
}

/// 列出所有工作卡片
#[tauri::command]
pub async fn list_work_cards(
    state: State<'_, WorkCardState>,
) -> Result<Vec<WorkCard>, String> {
    let service = state.0.read().await;
    service.list_cards().await
}

/// 删除工作卡片
#[tauri::command]
pub async fn delete_work_card(
    state: State<'_, WorkCardState>,
    card_id: String,
) -> Result<bool, String> {
    let service = state.0.read().await;
    service.delete_card(&card_id).await
}

// ============================================================================
// Action Commands
// ============================================================================

/// 执行卡片操作
#[tauri::command]
pub async fn execute_card_action(
    state: State<'_, WorkCardState>,
    card_id: String,
    action_id: String,
    actor_id: String,
    actor_name: String,
) -> Result<ActionResult, String> {
    let service = state.0.read().await;
    service.execute_action(&card_id, &action_id, &actor_id, &actor_name).await
}

// ============================================================================
// Template Commands
// ============================================================================

/// 从模板生成工作卡片
#[tauri::command]
pub async fn generate_card_from_template(
    state: State<'_, WorkCardState>,
    template_id: String,
    title: String,
    sender_id: String,
    sender_name: String,
    context: TemplateContext,
) -> Result<WorkCard, String> {
    let service = state.0.read().await;
    service.generate_from_template(&template_id, title, sender_id, sender_name, context).await
}

/// 列出所有卡片模板
#[tauri::command]
pub async fn list_card_templates(
    state: State<'_, WorkCardState>,
) -> Result<Vec<WorkCardTemplate>, String> {
    let service = state.0.read().await;
    service.list_templates().await
}

// ============================================================================
// Utility Commands
// ============================================================================

/// 获取卡片状态列表
#[tauri::command]
pub fn get_card_statuses() -> Vec<CardStatus> {
    vec![
        CardStatus::Pending,
        CardStatus::InProgress,
        CardStatus::Completed,
        CardStatus::Failed,
        CardStatus::Cancelled,
    ]
}

/// 获取卡片优先级列表
#[tauri::command]
pub fn get_card_priorities() -> Vec<CardPriority> {
    vec![
        CardPriority::Low,
        CardPriority::Normal,
        CardPriority::High,
        CardPriority::Urgent,
    ]
}

/// 获取卡片操作类型列表
#[tauri::command]
pub fn get_card_action_types() -> Vec<CardActionType> {
    vec![
        CardActionType::Approve,
        CardActionType::Reject,
        CardActionType::Edit,
        CardActionType::Delete,
        CardActionType::Confirm,
        CardActionType::Cancel,
        CardActionType::Custom,
    ]
}
