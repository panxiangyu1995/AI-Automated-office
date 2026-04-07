//! Agent间消息数据类型定义
//!
//! 遵循FR600统一格式：
//! - human:{user_id} - 人类用户
//! - agent:{agent_id} - AI Agent
//! - system:{system_id} - 系统消息
//! - group:{group_id} - 群组

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 参与者类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "id")]
pub enum ParticipantType {
    Human(String),
    Agent(String),
    System(String),
    Group(String),
}

impl ParticipantType {
    pub fn as_str(&self) -> &str {
        match self {
            ParticipantType::Human(_) => "human",
            ParticipantType::Agent(_) => "agent",
            ParticipantType::System(_) => "system",
            ParticipantType::Group(_) => "group",
        }
    }
    
    pub fn id(&self) -> &str {
        match self {
            ParticipantType::Human(id) => id,
            ParticipantType::Agent(id) => id,
            ParticipantType::System(id) => id,
            ParticipantType::Group(id) => id,
        }
    }
}

/// 消息内容类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MessageContent {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "command")]
    Command { command: String, args: Vec<String> },
    #[serde(rename = "file")]
    File { file_id: String, file_name: String, mime_type: String },
    #[serde(rename = "image")]
    Image { image_id: String, alt_text: Option<String> },
    #[serde(rename = "system")]
    System { code: String, message: String },
}

impl MessageContent {
    pub fn text(text: impl Into<String>) -> Self {
        Self::Text { text: text.into() }
    }
    
    pub fn command(command: impl Into<String>, args: Vec<String>) -> Self {
        Self::Command { command: command.into(), args }
    }
    
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text { text } => Some(text),
            _ => None,
        }
    }
}

/// 消息状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessageStatus {
    /// 发送中
    Sending,
    /// 已发送
    Sent,
    /// 已送达
    Delivered,
    /// 已读
    Read,
    /// 发送失败
    Failed,
}

impl Default for MessageStatus {
    fn default() -> Self {
        Self::Sending
    }
}

/// Agent消息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentMessage {
    /// 消息ID (UUID)
    pub id: String,
    /// 发送方类型
    pub sender_type: String,
    /// 发送方ID
    pub sender_id: String,
    /// 接收方类型 (固定为agent)
    pub receiver_type: String,
    /// 接收方Agent ID
    pub receiver_id: String,
    /// 消息内容
    pub content: MessageContent,
    /// 消息状态
    pub status: MessageStatus,
    /// 是否需要确认 (FR60)
    pub requires_confirmation: bool,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 送达时间
    pub delivered_at: Option<DateTime<Utc>>,
    /// 已读时间
    pub read_at: Option<DateTime<Utc>>,
    /// 会话ID (用于会话追踪)
    pub session_id: Option<String>,
    /// 回复的消息ID
    pub reply_to: Option<String>,
    /// 引用计数 (用于循环检测)
    pub hop_count: u8,
}

impl AgentMessage {
    /// 创建新消息
    pub fn new(
        sender_id: String,
        receiver_id: String,
        content: MessageContent,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            sender_type: "agent".to_string(),
            sender_id,
            receiver_type: "agent".to_string(),
            receiver_id,
            content,
            status: MessageStatus::Sending,
            requires_confirmation: false,
            created_at: Utc::now(),
            delivered_at: None,
            read_at: None,
            session_id: None,
            reply_to: None,
            hop_count: 0,
        }
    }
    
    /// 检查是否已送达
    pub fn is_delivered(&self) -> bool {
        matches!(self.status, MessageStatus::Delivered | MessageStatus::Read)
    }
    
    /// 检查是否已读
    pub fn is_read(&self) -> bool {
        matches!(self.status, MessageStatus::Read)
    }
    
    /// 标记为已送达
    pub fn mark_delivered(&mut self) {
        self.status = MessageStatus::Delivered;
        self.delivered_at = Some(Utc::now());
    }
    
    /// 标记为已读
    pub fn mark_read(&mut self) {
        self.status = MessageStatus::Read;
        self.read_at = Some(Utc::now());
    }
}

/// Agent通信权限 (FR62, FR65)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentPermission {
    /// Agent ID
    pub agent_id: String,
    /// 是否允许向其他Agent发送消息
    pub can_send_to_agents: bool,
    /// 允许接收的Agent列表 (空=允许所有)
    pub allowed_receivers: Vec<String>,
    /// 禁止接收的Agent列表
    pub blocked_receivers: Vec<String>,
    /// 内容限制关键词
    pub content_restrictions: Vec<String>,
    /// 发送时是否需要用户确认 (FR60)
    pub requires_confirmation: bool,
    /// 是否允许接收外部Agent消息
    pub allow_external: bool,
    /// 最大消息频率 (条/分钟)
    pub max_message_rate: u32,
}

impl Default for AgentPermission {
    fn default() -> Self {
        Self {
            agent_id: String::new(),
            can_send_to_agents: true,
            allowed_receivers: vec![],
            blocked_receivers: vec![],
            content_restrictions: vec![],
            requires_confirmation: false,
            allow_external: false,
            max_message_rate: 60,
        }
    }
}

/// Agent通信配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentIntercomConfig {
    /// 是否启用Agent间通信
    pub enabled: bool,
    /// 是否启用审计日志
    pub audit_enabled: bool,
    /// 是否启用内容审核
    pub content_moderation_enabled: bool,
    /// 循环消息检测阈值
    pub max_hop_count: u8,
    /// 默认权限
    pub default_permission: AgentPermission,
}

impl Default for AgentIntercomConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            audit_enabled: true,
            content_moderation_enabled: true,
            max_hop_count: 3,
            default_permission: AgentPermission::default(),
        }
    }
}

/// Agent间通信错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AgentIntercomError {
    /// A2A_001: 权限不足
    PermissionDenied { reason: String },
    /// A2A_002: 接收方不存在
    ReceiverNotFound { receiver_id: String },
    /// A2A_003: 内容审核失败
    ContentModerationFailed { reason: String },
    /// A2A_004: 消息发送超时
    SendTimeout,
    /// A2A_005: 循环消息检测
    CyclicMessageDetected { message_id: String },
    /// A2A_006: 用户拒绝确认
    UserConfirmationRejected { message_id: String },
    /// A2A_007: 发送方不存在
    SenderNotFound { sender_id: String },
    /// A2A_008: 消息不存在
    MessageNotFound { message_id: String },
    /// A2A_009: 速率限制
    RateLimitExceeded { agent_id: String },
    /// A2A_010: 内部错误
    InternalError { message: String },
}

impl std::fmt::Display for AgentIntercomError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::PermissionDenied { reason } => write!(f, "A2A_001: 权限不足 - {}", reason),
            Self::ReceiverNotFound { receiver_id } => write!(f, "A2A_002: 接收方不存在 - {}", receiver_id),
            Self::ContentModerationFailed { reason } => write!(f, "A2A_003: 内容审核失败 - {}", reason),
            Self::SendTimeout => write!(f, "A2A_004: 消息发送超时"),
            Self::CyclicMessageDetected { message_id } => write!(f, "A2A_005: 循环消息检测 - {}", message_id),
            Self::UserConfirmationRejected { message_id } => write!(f, "A2A_006: 用户拒绝确认 - {}", message_id),
            Self::SenderNotFound { sender_id } => write!(f, "A2A_007: 发送方不存在 - {}", sender_id),
            Self::MessageNotFound { message_id } => write!(f, "A2A_008: 消息不存在 - {}", message_id),
            Self::RateLimitExceeded { agent_id } => write!(f, "A2A_009: 速率限制 - {}", agent_id),
            Self::InternalError { message } => write!(f, "A2A_010: 内部错误 - {}", message),
        }
    }
}

impl std::error::Error for AgentIntercomError {}

/// 审计日志条目
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLogEntry {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub event_type: AuditEventType,
    pub sender_id: Option<String>,
    pub receiver_id: Option<String>,
    pub message_id: Option<String>,
    pub action: String,
    pub result: AuditResult,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AuditEventType {
    Send,
    Receive,
    PermissionCheck,
    StatusChange,
    ConfirmationRequest,
    ConfirmationResponse,
    ContentModeration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AuditResult {
    Success,
    Blocked,
    Failed,
}
