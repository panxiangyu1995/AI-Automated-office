//! Delivery Strategy Commands
//!
//! Tauri commands for dynamic delivery strategy (ADR-060)
//! FR48: Dynamic delivery based on urgency and user preferences

use tauri::State;
use std::sync::Arc;
use crate::agent::delivery::{
    DeliveryStrategyService, DeliveryItem, DeliveryPreference, DeliveryChannel, TaskType, TaskContext, BatchEntry,
};
use chrono::Utc;
use std::collections::HashMap;

/// Evaluate delivery strategy for a single item
#[tauri::command]
pub async fn evaluate_delivery_strategy(
    service: State<'_, Arc<DeliveryStrategyService>>,
    task_type: String,
    title: String,
    content: String,
    is_overdue: bool,
    has_alert: bool,
    is_interactive: bool,
    user_id: String,
) -> Result<crate::agent::delivery::DeliveryStrategy, String> {
    let task_type = match task_type.as_str() {
        "approval" => TaskType::Approval,
        "cron" => TaskType::Cron,
        "user_request" => TaskType::UserRequest,
        "sync" => TaskType::Sync,
        "system" => TaskType::System,
        _ => return Err(format!("Unknown task type: {}", task_type)),
    };

    let context = TaskContext {
        is_overdue,
        has_alert,
        is_interactive,
        priority_override: None,
        metadata: HashMap::new(),
    };

    let item = DeliveryItem {
        id: format!("item_{}", uuid::Uuid::new_v4()),
        task_type,
        title,
        content,
        context,
        created_at: Utc::now().timestamp(),
    };

    Ok(service.evaluate(&item, &user_id).await)
}

/// Set user delivery preferences
#[tauri::command]
pub async fn set_delivery_preference(
    service: State<'_, Arc<DeliveryStrategyService>>,
    user_id: String,
    quiet_hours_enabled: bool,
    quiet_hours_start: String,
    quiet_hours_end: String,
    quiet_hours_fallback: String,
    channel_overrides: HashMap<String, String>,
    batch_enabled: bool,
    batch_window_minutes: u32,
    batch_min_items: u32,
) -> Result<(), String> {
    let fallback = match quiet_hours_fallback.as_str() {
        "notification" => DeliveryChannel::Notification,
        "chat" => DeliveryChannel::Chat,
        "list" => DeliveryChannel::List,
        "workbench" => DeliveryChannel::Workbench,
        _ => return Err(format!("Invalid fallback channel: {}", quiet_hours_fallback)),
    };

    let overrides = channel_overrides
        .into_iter()
        .filter_map(|(k, v)| {
            let channel = match v.as_str() {
                "notification" => Some(DeliveryChannel::Notification),
                "chat" => Some(DeliveryChannel::Chat),
                "list" => Some(DeliveryChannel::List),
                "workbench" => Some(DeliveryChannel::Workbench),
                _ => None,
            };
            channel.map(|c| (k, c))
        })
        .collect();

    let pref = DeliveryPreference {
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        quiet_hours_fallback: fallback,
        channel_overrides: overrides,
        batch_enabled,
        batch_window_minutes,
        batch_min_items,
    };

    service.set_preference(user_id, pref).await;
    Ok(())
}

/// Get user delivery preferences
#[tauri::command]
pub async fn get_delivery_preference(
    service: State<'_, Arc<DeliveryStrategyService>>,
    user_id: String,
) -> Result<DeliveryPreference, String> {
    Ok(service.get_preference(&user_id).await)
}

/// Evaluate multiple delivery items
#[tauri::command]
pub async fn evaluate_delivery_batch(
    service: State<'_, Arc<DeliveryStrategyService>>,
    items: Vec<DeliveryItemInput>,
    user_id: String,
) -> Result<Vec<DeliveryStrategyOutput>, String> {
    let items: Vec<DeliveryItem> = items
        .into_iter()
        .map(|i| {
            let task_type = match i.task_type.as_str() {
                "approval" => TaskType::Approval,
                "cron" => TaskType::Cron,
                "user_request" => TaskType::UserRequest,
                "sync" => TaskType::Sync,
                "system" => TaskType::System,
                _ => TaskType::System,
            };
            DeliveryItem {
                id: i.id.unwrap_or_else(|| format!("item_{}", uuid::Uuid::new_v4())),
                task_type,
                title: i.title,
                content: i.content,
                context: TaskContext {
                    is_overdue: i.is_overdue.unwrap_or(false),
                    has_alert: i.has_alert.unwrap_or(false),
                    is_interactive: i.is_interactive.unwrap_or(false),
                    priority_override: None,
                    metadata: HashMap::new(),
                },
                created_at: i.created_at.unwrap_or_else(|| Utc::now().timestamp()),
            }
        })
        .collect();

    let results = service.evaluate_batch(items, &user_id).await;

    Ok(results
        .into_iter()
        .map(|(item, strategy)| DeliveryStrategyOutput {
            item_id: item.id,
            urgency: format!("{:?}", strategy.urgency).to_lowercase(),
            channel: format!("{}", strategy.channel),
            can_interrupt: strategy.can_interrupt,
            require_ack: strategy.require_ack,
            reason: strategy.reason,
        })
        .collect())
}

/// Get ready batch entries
#[tauri::command]
pub async fn get_ready_batches(
    service: State<'_, Arc<DeliveryStrategyService>>,
    user_id: String,
) -> Result<Vec<BatchEntry>, String> {
    Ok(service.get_ready_batches(&user_id).await)
}

/// Input struct for batch evaluation
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryItemInput {
    pub id: Option<String>,
    pub task_type: String,
    pub title: String,
    pub content: String,
    pub is_overdue: Option<bool>,
    pub has_alert: Option<bool>,
    pub is_interactive: Option<bool>,
    pub created_at: Option<i64>,
}

/// Output struct for delivery strategy
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryStrategyOutput {
    pub item_id: String,
    pub urgency: String,
    pub channel: String,
    pub can_interrupt: bool,
    pub require_ack: bool,
    pub reason: String,
}

/// Get available urgency levels
#[tauri::command]
pub fn get_urgency_levels() -> Vec<String> {
    vec![
        "critical".to_string(),
        "high".to_string(),
        "normal".to_string(),
        "low".to_string(),
    ]
}

/// Get available delivery channels
#[tauri::command]
pub fn get_delivery_channels() -> Vec<String> {
    vec![
        "notification".to_string(),
        "chat".to_string(),
        "list".to_string(),
        "workbench".to_string(),
    ]
}
