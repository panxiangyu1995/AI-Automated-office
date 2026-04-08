//! Message 模块数据类型

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessageType { System, Approval, Task, Mention, Chat }
impl Default for MessageType { fn default() -> Self { Self::System } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessagePriority { Low, Normal, High, Urgent }
impl Default for MessagePriority { fn default() -> Self { Self::Normal } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessageStatus { Unread, Read, Archived }
impl Default for MessageStatus { fn default() -> Self { Self::Unread } }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Sender {
    pub id: String,
    pub name: String,
    pub avatar: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub msg_type: MessageType,
    pub title: String,
    pub content: String,
    pub sender: Sender,
    pub recipient_id: String,
    pub recipient_type: String,
    pub priority: MessagePriority,
    pub status: MessageStatus,
    pub action_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: i64,
    pub read_at: Option<i64>,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub pinned_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DoNotDisturb {
    pub enabled: bool,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub days: Option<Vec<i32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationPreferences {
    pub user_id: String,
    pub do_not_disturb: DoNotDisturb,
    pub channels: NotificationChannels,
    pub types: NotificationTypes,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationChannels {
    pub in_app: bool,
    pub email: bool,
    pub push: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationTypes {
    pub system: bool,
    pub approval: bool,
    pub task: bool,
    pub mention: bool,
    pub chat: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMessageRequest {
    pub msg_type: MessageType,
    pub title: String,
    pub content: String,
    pub recipient_id: String,
    pub recipient_type: String,
    pub priority: Option<MessagePriority>,
    pub action_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageListItem {
    pub id: String,
    pub msg_type: MessageType,
    pub title: String,
    pub sender_name: String,
    pub status: MessageStatus,
    pub priority: MessagePriority,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnreadCount {
    pub total: i64,
    pub system: i64,
    pub approval: i64,
    pub task: i64,
    pub mention: i64,
    pub chat: i64,
}

// ============================================================================
// Search and Filter Types (Task 182)
// ============================================================================

/// Search query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageSearchQuery {
    pub keyword: Option<String>,
    pub msg_type: Option<MessageType>,
    pub priority: Option<MessagePriority>,
    pub status: Option<MessageStatus>,
    pub sender_id: Option<String>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub pinned_only: Option<bool>,
    #[serde(default)]
    pub page: u32,
    #[serde(default = "default_page_size")]
    pub page_size: u32,
}

fn default_page_size() -> u32 { 20 }

/// Search result with highlighted matches
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageSearchResult {
    pub messages: Vec<MessageListItem>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
    pub total_pages: u32,
}

/// Filter criteria for message listing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageFilter {
    pub msg_type: Option<MessageType>,
    pub priority: Option<MessagePriority>,
    pub status: Option<MessageStatus>,
    pub sender_id: Option<String>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub pinned_only: bool,
    pub search_keyword: Option<String>,
}

/// Pinned message info
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PinnedMessage {
    pub message_id: String,
    pub pinned_at: i64,
    pub reason: Option<String>,
}

/// Export format for messages
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat { Csv, Json,Txt }

/// Export request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRequest {
    pub filter: MessageFilter,
    pub format: ExportFormat,
    pub include_content: bool,
}

/// Export result with download URL or data
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub format: ExportFormat,
    pub filename: String,
    pub data: String,
    pub message_count: u32,
}
