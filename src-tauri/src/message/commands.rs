//! Message 模块 Tauri 命令

use crate::message::types::*;
use std::sync::Mutex;
use tauri::State;
use tracing::info;

pub struct MessageState {
    pub messages: Mutex<Vec<Message>>,
    pub unread_counts: Mutex<UnreadCount>,
    pub preferences: Mutex<NotificationPreferences>,
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
            action_url: Some("/approval"),
            metadata: None,
            created_at: chrono::Utc::now().timestamp(),
            read_at: None,
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
        }
    }
}

impl Default for MessageState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn message_send(state: State<'_, MessageState>, request: CreateMessageRequest) -> Result<Message, String> {
    info!("发送消息: {}", request.title);
    let msg = Message {
        id: uuid::Uuid::new_v4().to_string(),
        msg_type: request.msg_type,
        title: request.title,
        content: request.content,
        sender: Sender { id: "current_user".to_string(), name: "当前用户".to_string(), avatar: None },
        recipient_id: request.recipient_id,
        recipient_type: request.recipient_type,
        priority: request.priority.unwrap_or_default(),
        status: MessageStatus::Unread,
        action_url: request.action_url,
        metadata: None,
        created_at: chrono::Utc::now().timestamp(),
        read_at: None,
    };
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
