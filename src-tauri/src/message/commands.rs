//! Message 模块 Tauri 命令

use crate::message::types::*;
use crate::message::status::{DeliveryStatus, MessageStatusEntry, StatusChangeEvent, OfflineMessage, MessageStatusService};
use serde::{Deserialize, Serialize};
use std::sync::{Mutex, Arc};
use tauri::State;
use tracing::info;

pub struct MessageState {
    pub messages: Mutex<Vec<Message>>,
    pub unread_counts: Mutex<UnreadCount>,
    pub preferences: Mutex<NotificationPreferences>,
    pub status_service: Arc<MessageStatusService>,
}

impl MessageState {
    pub fn new() -> Self {
        let mut messages = Vec::new();
        messages.push(Message {
            id: "msg-001".to_string(),
            msg_type: MessageType::System,
            title: "欢迎使用AI自动化办公平台".to_string(),
            content: "系统已准备就绪，开始您的数字化办公之旅吧！".to_string(),
            sender: Sender { id: "system".to_string(), name: "系统".to_string(), avatar: None },
            recipient_id: "current_user".to_string(),
            recipient_type: "user".to_string(),
            priority: MessagePriority::Normal,
            status: MessageStatus::Unread,
            action_url: None,
            metadata: None,
            created_at: chrono::Utc::now().timestamp(),
            read_at: None,
            pinned: false,
            pinned_at: None,
            edited: false,
            edited_at: None,
            edit_history: Vec::new(),
            recalled: false,
            recalled_at: None,
            original_content: None,
        });
        messages.push(Message {
            id: "msg-002".to_string(),
            msg_type: MessageType::Approval,
            title: "您有一份待审批申请".to_string(),
            content: "李四提交了请假申请，请及时审批。".to_string(),
            sender: Sender { id: "emp-002".to_string(), name: "李四".to_string(), avatar: None },
            recipient_id: "current_user".to_string(),
            recipient_type: "user".to_string(),
            priority: MessagePriority::High,
            status: MessageStatus::Unread,
            action_url: Some("/approval".to_string()),
            metadata: None,
            created_at: chrono::Utc::now().timestamp(),
            read_at: None,
            pinned: false,
            pinned_at: None,
            edited: false,
            edited_at: None,
            edit_history: Vec::new(),
            recalled: false,
            recalled_at: None,
            original_content: None,
        });

        let unread = UnreadCount { total: 2, system: 1, approval: 1, task: 0, mention: 0, chat: 0 };

        let preferences = NotificationPreferences {
            user_id: "current_user".to_string(),
            do_not_disturb: DoNotDisturb { enabled: false, start_time: None, end_time: None, days: None },
            channels: NotificationChannels { in_app: true, email: false, push: false },
            types: NotificationTypes { system: true, approval: true, task: true, mention: true, chat: true },
        };

        Self {
            messages: Mutex::new(messages),
            unread_counts: Mutex::new(unread),
            preferences: Mutex::new(preferences),
            status_service: Arc::new(MessageStatusService::new()),
        }
    }
}

impl Default for MessageState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn message_send(state: State<'_, MessageState>, request: CreateMessageRequest) -> Result<Message, String> {
    info!("发送消息: {}", request.title);
    let sender_id = "current_user".to_string();
    let recipient_id = request.recipient_id.clone();
    let msg = Message {
        id: uuid::Uuid::new_v4().to_string(),
        msg_type: request.msg_type,
        title: request.title,
        content: request.content,
        sender: Sender { id: sender_id.clone(), name: "当前用户".to_string(), avatar: None },
        recipient_id: recipient_id.clone(),
        recipient_type: request.recipient_type,
        priority: request.priority.unwrap_or_default(),
        status: MessageStatus::Unread,
        action_url: request.action_url,
        metadata: None,
        created_at: chrono::Utc::now().timestamp(),
        read_at: None,
        pinned: false,
        pinned_at: None,
        edited: false,
        edited_at: None,
        edit_history: Vec::new(),
        recalled: false,
        recalled_at: None,
        original_content: None,
    };

    // Create status tracking entry
    state.status_service.create_entry(
        msg.id.clone(),
        sender_id,
        recipient_id,
    ).await;

    // Mark as sent immediately for outgoing messages
    state.status_service.mark_sent(&msg.id).await;

    state.messages.lock().unwrap().push(msg.clone());
    let mut unread = state.unread_counts.lock().unwrap();
    unread.total += 1;
    Ok(msg)
}

#[tauri::command]
pub async fn message_list(state: State<'_, MessageState>, status: Option<String>) -> Result<Vec<MessageListItem>, String> {
    let msgs = state.messages.lock().unwrap();
    let status_filter = status.and_then(|s| match s.as_str() {
        "unread" => Some(MessageStatus::Unread),
        "read" => Some(MessageStatus::Read),
        "archived" => Some(MessageStatus::Archived),
        _ => None,
    });
    Ok(msgs.iter().filter(|m| status_filter.map(|s| m.status == s).unwrap_or(true))
        .map(|m| MessageListItem { id: m.id.clone(), msg_type: m.msg_type, title: m.title.clone(),
            sender_name: m.sender.name.clone(), status: m.status, priority: m.priority, created_at: m.created_at })
        .collect())
}

#[tauri::command]
pub async fn message_get(state: State<'_, MessageState>, id: String) -> Result<Message, String> {
    state.messages.lock().unwrap().iter().find(|m| m.id == id).cloned().ok_or("消息不存在".into())
}

#[tauri::command]
pub async fn message_mark_read(state: State<'_, MessageState>, id: String) -> Result<(), String> {
    let mut msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter_mut().find(|m| m.id == id) {
        if msg.status == MessageStatus::Unread {
            msg.status = MessageStatus::Read;
            msg.read_at = Some(chrono::Utc::now().timestamp());
            let mut unread = state.unread_counts.lock().unwrap();
            unread.total = unread.total.saturating_sub(1);
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn message_read_all(state: State<'_, MessageState>) -> Result<(), String> {
    let mut msgs = state.messages.lock().unwrap();
    for msg in msgs.iter_mut() {
        if msg.status == MessageStatus::Unread {
            msg.status = MessageStatus::Read;
            msg.read_at = Some(chrono::Utc::now().timestamp());
        }
    }
    state.unread_counts.lock().unwrap().total = 0;
    Ok(())
}

#[tauri::command]
pub async fn message_delete(state: State<'_, MessageState>, id: String) -> Result<(), String> {
    state.messages.lock().unwrap().retain(|m| m.id != id);
    Ok(())
}

#[tauri::command]
pub async fn message_unread_count(state: State<'_, MessageState>) -> Result<UnreadCount, String> {
    Ok(state.unread_counts.lock().unwrap().clone())
}

#[tauri::command]
pub async fn message_get_preferences(state: State<'_, MessageState>) -> Result<NotificationPreferences, String> {
    Ok(state.preferences.lock().unwrap().clone())
}

#[tauri::command]
pub async fn message_update_preferences(state: State<'_, MessageState>, preferences: NotificationPreferences) -> Result<(), String> {
    *state.preferences.lock().unwrap() = preferences;
    Ok(())
}

// ============================================================================
// Search and Filter Commands (Task 182)
// ============================================================================

/// Search messages with full-text search and filters
#[tauri::command]
pub async fn message_search(
    state: State<'_, MessageState>,
    query: MessageSearchQuery,
) -> Result<MessageSearchResult, String> {
    let msgs = state.messages.lock().unwrap();

    let filtered: Vec<Message> = msgs.iter()
        .filter(|m| {
            // Keyword filter (search in title and content)
            if let Some(ref kw) = query.keyword {
                let keyword_lower = kw.to_lowercase();
                if !m.title.to_lowercase().contains(&keyword_lower)
                    && !m.content.to_lowercase().contains(&keyword_lower) {
                    return false;
                }
            }

            // Type filter
            if let Some(t) = query.msg_type {
                if m.msg_type != t { return false; }
            }

            // Priority filter
            if let Some(p) = query.priority {
                if m.priority != p { return false; }
            }

            // Status filter
            if let Some(s) = query.status {
                if m.status != s { return false; }
            }

            // Sender filter
            if let Some(ref sid) = query.sender_id {
                if m.sender.id != *sid { return false; }
            }

            // Date range filter
            if let Some(start) = query.start_date {
                if m.created_at < start { return false; }
            }
            if let Some(end) = query.end_date {
                if m.created_at > end { return false; }
            }

            // Pinned filter
            if query.pinned_only.unwrap_or(false) {
                if !m.pinned { return false; }
            }

            true
        })
        .cloned()
        .collect();

    let total = filtered.len() as u32;
    let page = query.page.max(1);
    let page_size = query.page_size.max(1);
    let total_pages = (total + page_size - 1) / page_size;

    let start = ((page - 1) * page_size) as usize;
    let end = (start + page_size as usize).min(filtered.len());

    let page_messages: Vec<MessageListItem> = filtered[start..end]
        .iter()
        .map(|m| MessageListItem {
            id: m.id.clone(),
            msg_type: m.msg_type,
            title: m.title.clone(),
            sender_name: m.sender.name.clone(),
            status: m.status,
            priority: m.priority,
            created_at: m.created_at,
        })
        .collect();

    Ok(MessageSearchResult {
        messages: page_messages,
        total,
        page,
        page_size,
        total_pages,
    })
}

/// Filter messages with multi-dimensional filters
#[tauri::command]
pub async fn message_filter(
    state: State<'_, MessageState>,
    filter: MessageFilter,
) -> Result<Vec<MessageListItem>, String> {
    let msgs = state.messages.lock().unwrap();

    let filtered: Vec<MessageListItem> = msgs.iter()
        .filter(|m| {
            if let Some(t) = filter.msg_type {
                if m.msg_type != t { return false; }
            }
            if let Some(p) = filter.priority {
                if m.priority != p { return false; }
            }
            if let Some(s) = filter.status {
                if m.status != s { return false; }
            }
            if let Some(ref sid) = filter.sender_id {
                if m.sender.id != *sid { return false; }
            }
            if let Some(start) = filter.start_date {
                if m.created_at < start { return false; }
            }
            if let Some(end) = filter.end_date {
                if m.created_at > end { return false; }
            }
            if filter.pinned_only && !m.pinned {
                return false;
            }
            if let Some(ref kw) = filter.search_keyword {
                let keyword_lower = kw.to_lowercase();
                if !m.title.to_lowercase().contains(&keyword_lower)
                    && !m.content.to_lowercase().contains(&keyword_lower) {
                    return false;
                }
            }
            true
        })
        .map(|m| MessageListItem {
            id: m.id.clone(),
            msg_type: m.msg_type,
            title: m.title.clone(),
            sender_name: m.sender.name.clone(),
            status: m.status,
            priority: m.priority,
            created_at: m.created_at,
        })
        .collect();

    Ok(filtered)
}

/// Pin a message
#[tauri::command]
pub async fn message_pin(
    state: State<'_, MessageState>,
    id: String,
    reason: Option<String>,
) -> Result<PinnedMessage, String> {
    let mut msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter_mut().find(|m| m.id == id) {
        msg.pinned = true;
        msg.pinned_at = Some(chrono::Utc::now().timestamp());
        info!("Pinned message: {} (reason: {:?})", id, reason);
        Ok(PinnedMessage {
            message_id: id,
            pinned_at: msg.pinned_at.unwrap_or(chrono::Utc::now().timestamp()),
            reason,
        })
    } else {
        Err("消息不存在".into())
    }
}

/// Unpin a message
#[tauri::command]
pub async fn message_unpin(
    state: State<'_, MessageState>,
    id: String,
) -> Result<(), String> {
    let mut msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter_mut().find(|m| m.id == id) {
        msg.pinned = false;
        msg.pinned_at = None;
        info!("Unpinned message: {}", id);
        Ok(())
    } else {
        Err("消息不存在".into())
    }
}

/// Get pinned messages
#[tauri::command]
pub async fn message_list_pinned(
    state: State<'_, MessageState>,
) -> Result<Vec<PinnedMessage>, String> {
    let msgs = state.messages.lock().unwrap();
    let pinned: Vec<PinnedMessage> = msgs.iter()
        .filter(|m| m.pinned)
        .map(|m| PinnedMessage {
            message_id: m.id.clone(),
            pinned_at: m.pinned_at.unwrap_or(m.created_at),
            reason: None,
        })
        .collect();
    Ok(pinned)
}

/// Export messages to specified format
#[tauri::command]
pub async fn message_export(
    state: State<'_, MessageState>,
    request: ExportRequest,
) -> Result<ExportResult, String> {
    let msgs = state.messages.lock().unwrap();

    // Apply filter
    let filtered: Vec<&Message> = msgs.iter()
        .filter(|m| {
            if let Some(t) = request.filter.msg_type {
                if m.msg_type != t { return false; }
            }
            if let Some(p) = request.filter.priority {
                if m.priority != p { return false; }
            }
            if let Some(s) = request.filter.status {
                if m.status != s { return false; }
            }
            if let Some(ref sid) = request.filter.sender_id {
                if m.sender.id != *sid { return false; }
            }
            if let Some(start) = request.filter.start_date {
                if m.created_at < start { return false; }
            }
            if let Some(end) = request.filter.end_date {
                if m.created_at > end { return false; }
            }
            if request.filter.pinned_only && !m.pinned {
                return false;
            }
            true
        })
        .collect();

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let count = filtered.len() as u32;

    match request.format {
        ExportFormat::Json => {
            let data = if request.include_content {
                serde_json::to_string_pretty(&filtered).unwrap_or_default()
            } else {
                let simplified: Vec<_> = filtered.iter().map(|m| {
                    serde_json::json!({
                        "id": m.id,
                        "type": m.msg_type,
                        "title": m.title,
                        "sender": m.sender.name,
                        "status": m.status,
                        "priority": m.priority,
                        "createdAt": m.created_at
                    })
                }).collect();
                serde_json::to_string_pretty(&simplified).unwrap_or_default()
            };
            Ok(ExportResult {
                format: ExportFormat::Json,
                filename: format!("messages_export_{}.json", timestamp),
                data,
                message_count: count,
            })
        },
        ExportFormat::Csv => {
            let mut csv_data = String::from("ID,Type,Title,Sender,Status,Priority,CreatedAt");
            if request.include_content {
                csv_data.push_str(",Content");
            }
            csv_data.push('\n');

            for m in filtered {
                csv_data.push_str(&format!(
                    "{},{:?},\"{}\",\"{}\",{:?},{:?},{}\n",
                    m.id,
                    m.msg_type,
                    m.title.replace('"', "\"\""),
                    m.sender.name,
                    m.status,
                    m.priority,
                    m.created_at
                ));
                if request.include_content {
                    csv_data.push_str(&format!(
                        ",\"{}\"\n",
                        m.content.replace('"', "\"\"")
                    ));
                }
            }
            Ok(ExportResult {
                format: ExportFormat::Csv,
                filename: format!("messages_export_{}.csv", timestamp),
                data: csv_data,
                message_count: count,
            })
        },
        ExportFormat::Txt => {
            let mut txt_data = String::new();
            for m in filtered {
                txt_data.push_str(&format!("=== {} ===\n", m.title));
                txt_data.push_str(&format!("Type: {:?}\n", m.msg_type));
                txt_data.push_str(&format!("From: {}\n", m.sender.name));
                txt_data.push_str(&format!("Status: {:?}\n", m.status));
                txt_data.push_str(&format!("Priority: {:?}\n", m.priority));
                if request.include_content {
                    txt_data.push_str(&format!("Content:\n{}\n", m.content));
                }
                txt_data.push_str(&format!("Created: {}\n", m.created_at));
                txt_data.push_str("---\n\n");
            }
            Ok(ExportResult {
                format: ExportFormat::Txt,
                filename: format!("messages_export_{}.txt", timestamp),
                data: txt_data,
                message_count: count,
            })
        },
    }
}

// ============================================================================
// Message Status Tracking Commands (Task 192 - FR622-FR626)
// ============================================================================

/// Get message delivery status
#[tauri::command]
pub async fn get_message_delivery_status(
    state: State<'_, MessageState>,
    message_id: String,
) -> Result<Option<MessageStatusEntry>, String> {
    Ok(state.status_service.get_entry(&message_id).await)
}

/// Mark message as delivered
#[tauri::command]
pub async fn mark_message_delivered(
    state: State<'_, MessageState>,
    message_id: String,
) -> Result<Option<StatusChangeEvent>, String> {
    Ok(state.status_service.mark_delivered(&message_id).await)
}

/// Mark message as read
#[tauri::command]
pub async fn mark_message_read(
    state: State<'_, MessageState>,
    message_id: String,
    reader_id: Option<String>,
) -> Result<Option<StatusChangeEvent>, String> {
    Ok(state.status_service.mark_read(&message_id, reader_id).await)
}

/// Batch mark messages as read
#[tauri::command]
pub async fn batch_mark_messages_read(
    state: State<'_, MessageState>,
    message_ids: Vec<String>,
    reader_id: Option<String>,
) -> Result<Vec<StatusChangeEvent>, String> {
    Ok(state.status_service.batch_mark_read(&message_ids, reader_id).await)
}

/// Get all delivery status entries for a recipient
#[tauri::command]
pub async fn get_recipient_delivery_status(
    state: State<'_, MessageState>,
    recipient_id: String,
) -> Result<Vec<MessageStatusEntry>, String> {
    Ok(state.status_service.get_recipient_entries(&recipient_id).await)
}

/// Get unread delivery count for a recipient
#[tauri::command]
pub async fn get_delivery_unread_count(
    state: State<'_, MessageState>,
    recipient_id: String,
) -> Result<i64, String> {
    Ok(state.status_service.get_unread_count(&recipient_id).await)
}

/// Queue offline messages for sync
#[tauri::command]
pub async fn queue_offline_messages(
    state: State<'_, MessageState>,
    messages: Vec<OfflineMessage>,
) -> Result<(), String> {
    for msg in messages {
        state.status_service.queue_offline(msg).await;
    }
    Ok(())
}

/// Sync offline messages (mark as delivered)
#[tauri::command]
pub async fn sync_offline_messages(
    state: State<'_, MessageState>,
    recipient_id: String,
) -> Result<Vec<StatusChangeEvent>, String> {
    Ok(state.status_service.sync_offline_messages(&recipient_id).await)
}

/// Get pending status entries
#[tauri::command]
pub async fn get_pending_delivery_entries(
    state: State<'_, MessageState>,
) -> Result<Vec<MessageStatusEntry>, String> {
    Ok(state.status_service.get_entries_by_status(DeliveryStatus::Pending).await)
}

// ============================================================================
// Message Recall and Edit Commands (Task 200 - FR628, FR629)
// ============================================================================

/// Recall deadline in seconds (2 minutes)
const RECALL_DEADLINE_SECONDS: i64 = 120;

/// Edit message request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditMessageRequest {
    pub new_content: String,
}

/// Recall result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecallResult {
    pub success: bool,
    pub message_id: String,
    pub recalled_at: i64,
    pub reason: Option<String>,
}

/// Edit result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditResult {
    pub success: bool,
    pub message_id: String,
    pub edited_at: i64,
    pub old_content: String,
    pub new_content: String,
}

/// Recall a message within 2 minutes of sending
#[tauri::command]
pub async fn recall_message(
    state: State<'_, MessageState>,
    message_id: String,
    user_id: Option<String>,
) -> Result<RecallResult, String> {
    let mut msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter_mut().find(|m| m.id == message_id) {
        // Check if already recalled
        if msg.recalled {
            return Err("消息已被撤回".into());
        }

        // Check if user is the sender
        let current_user = user_id.unwrap_or_else(|| "current_user".to_string());
        if msg.sender.id != current_user {
            return Err("只能撤回自己发送的消息".into());
        }

        // Check recall deadline (2 minutes)
        let now = chrono::Utc::now().timestamp();
        let elapsed = now - msg.created_at;
        if elapsed > RECALL_DEADLINE_SECONDS {
            return Ok(RecallResult {
                success: false,
                message_id: message_id.clone(),
                recalled_at: now,
                reason: Some("超过2分钟撤回时限".to_string()),
            });
        }

        // Mark as recalled
        msg.recalled = true;
        msg.recalled_at = Some(now);

        info!("Recalled message: {} by user: {}", message_id, current_user);

        Ok(RecallResult {
            success: true,
            message_id,
            recalled_at: now,
            reason: None,
        })
    } else {
        Err("消息不存在".into())
    }
}

/// Edit a text message
#[tauri::command]
pub async fn edit_message(
    state: State<'_, MessageState>,
    message_id: String,
    request: EditMessageRequest,
    user_id: Option<String>,
) -> Result<EditResult, String> {
    let mut msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter_mut().find(|m| m.id == message_id) {
        // Check if already recalled
        if msg.recalled {
            return Err("消息已被撤回，无法编辑".into());
        }

        // Check if user is the sender
        let current_user = user_id.unwrap_or_else(|| "current_user".to_string());
        if msg.sender.id != current_user {
            return Err("只能编辑自己发送的消息".into());
        }

        // Check edit deadline (2 minutes like recall)
        let now = chrono::Utc::now().timestamp();
        let elapsed = now - msg.created_at;
        if elapsed > RECALL_DEADLINE_SECONDS {
            return Err("超过2分钟编辑时限".into());
        }

        // Only chat messages can be edited
        if msg.msg_type != MessageType::Chat {
            return Err("仅聊天消息可编辑".into());
        }

        // Store original content if first edit
        if msg.original_content.is_none() {
            msg.original_content = Some(msg.content.clone());
        }

        // Create edit history entry
        let edit_entry = EditHistoryEntry {
            edited_at: now,
            old_content: msg.content.clone(),
            new_content: request.new_content.clone(),
            edited_by: current_user.clone(),
        };
        msg.edit_history.push(edit_entry);

        // Update content
        msg.content = request.new_content.clone();
        msg.edited = true;
        msg.edited_at = Some(now);

        info!("Edited message: {} by user: {}", message_id, current_user);

        Ok(EditResult {
            success: true,
            message_id,
            edited_at: now,
            old_content: msg.content.clone(),
            new_content: request.new_content,
        })
    } else {
        Err("消息不存在".into())
    }
}

/// Get edit history of a message
#[tauri::command]
pub async fn get_message_edit_history(
    state: State<'_, MessageState>,
    message_id: String,
) -> Result<Vec<EditHistoryEntry>, String> {
    let msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter().find(|m| m.id == message_id) {
        Ok(msg.edit_history.clone())
    } else {
        Err("消息不存在".into())
    }
}

/// Check if a message can be recalled (within 2 minutes)
#[tauri::command]
pub async fn can_recall_message(
    state: State<'_, MessageState>,
    message_id: String,
    user_id: Option<String>,
) -> Result<bool, String> {
    let msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter().find(|m| m.id == message_id) {
        let current_user = user_id.unwrap_or_else(|| "current_user".to_string());
        let is_sender = msg.sender.id == current_user;
        let is_within_deadline = (chrono::Utc::now().timestamp() - msg.created_at) <= RECALL_DEADLINE_SECONDS;
        let not_already_recalled = !msg.recalled;
        Ok(is_sender && is_within_deadline && not_already_recalled)
    } else {
        Err("消息不存在".into())
    }
}

/// Check if a message can be edited (within 2 minutes, chat type only)
#[tauri::command]
pub async fn can_edit_message(
    state: State<'_, MessageState>,
    message_id: String,
    user_id: Option<String>,
) -> Result<bool, String> {
    let msgs = state.messages.lock().unwrap();
    if let Some(msg) = msgs.iter().find(|m| m.id == message_id) {
        let current_user = user_id.unwrap_or_else(|| "current_user".to_string());
        let is_sender = msg.sender.id == current_user;
        let is_within_deadline = (chrono::Utc::now().timestamp() - msg.created_at) <= RECALL_DEADLINE_SECONDS;
        let is_chat_type = msg.msg_type == MessageType::Chat;
        let not_recalled = !msg.recalled;
        Ok(is_sender && is_within_deadline && is_chat_type && not_recalled)
    } else {
        Err("消息不存在".into())
    }
}
