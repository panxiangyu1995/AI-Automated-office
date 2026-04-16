//! 群聊 Agent 协作类型定义
//!
//! FR639-FR649 相关的类型集中定义，
//! 供 group_agent.rs 引擎逻辑和外部模块使用。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ============ FR639: Agent 消息标识 ============

/// Agent 消息标识信息
///
/// FR639: Agent 在群聊中的消息必须有 "AI助手" 标识和所属员工
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentMessageBadge {
    /// 是否为 Agent 消息
    pub is_ai_assistant: bool,
    /// Agent 所属员工 ID
    pub owner_user_id: String,
    /// Agent 显示名称（如 "张三的AI助手"）
    pub display_label: String,
}

impl AgentMessageBadge {
    /// 为 Agent 消息创建标识
    pub fn for_agent(owner_user_id: String, owner_name: &str) -> Self {
        Self {
            is_ai_assistant: true,
            owner_user_id: owner_user_id.clone(),
            display_label: format!("{}的AI助手", owner_name),
        }
    }

    /// 人类消息无标识
    pub fn for_human() -> Self {
        Self {
            is_ai_assistant: false,
            owner_user_id: String::new(),
            display_label: String::new(),
        }
    }
}

// ============ FR640: Agent 发言策略 ============

/// Agent 发言模式
///
/// FR640: Agent 默认静默，仅在特定场景发言
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentSpeechMode {
    /// 静默模式 - 仅在被@提及时响应
    Silent,
    /// 主动模式 - 检测到相关事件时主动发言
    Proactive,
    /// 禁言模式 - 不发言
    Muted,
}

impl Default for AgentSpeechMode {
    fn default() -> Self {
        Self::Silent
    }
}

/// Agent 触发场景
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentTriggerScenario {
    /// 被@提及 (FR641)
    Mentioned,
    /// 任务状态变化 (FR642)
    TaskStatusChanged,
    /// 数据补充 (FR643)
    DataSupplement,
    /// 进度汇报 (FR644)
    ProgressReport,
    /// 协作接力 (FR645)
    CollaborationRelay,
}

// ============ FR646: Agent 发言权限 ============

/// Agent 在群内的发言权限
///
/// FR646: Agent 所属员工可设置 Agent 在群内的发言权限
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentSpeechPermission {
    /// 用户 ID
    pub user_id: String,
    /// 群组 ID
    pub group_id: String,
    /// 发言模式
    pub speech_mode: AgentSpeechMode,
    /// 允许的触发场景
    pub allowed_triggers: Vec<AgentTriggerScenario>,
    /// 是否允许主动通知
    pub allow_proactive_notification: bool,
    /// 是否允许数据补充
    pub allow_data_supplement: bool,
    /// 是否允许进度汇报
    pub allow_progress_report: bool,
}

impl AgentSpeechPermission {
    pub fn new(user_id: String, group_id: String) -> Self {
        Self {
            user_id,
            group_id,
            speech_mode: AgentSpeechMode::Silent,
            allowed_triggers: vec![AgentTriggerScenario::Mentioned],
            allow_proactive_notification: false,
            allow_data_supplement: false,
            allow_progress_report: false,
        }
    }

    /// 检查是否允许在指定场景发言
    pub fn can_speak_in_scenario(&self, scenario: AgentTriggerScenario) -> bool {
        if self.speech_mode == AgentSpeechMode::Muted {
            return false;
        }
        self.allowed_triggers.contains(&scenario)
    }

    /// 设置为完全权限（主动模式 + 所有触发场景）
    pub fn with_full_permission(mut self) -> Self {
        self.speech_mode = AgentSpeechMode::Proactive;
        self.allowed_triggers = vec![
            AgentTriggerScenario::Mentioned,
            AgentTriggerScenario::TaskStatusChanged,
            AgentTriggerScenario::DataSupplement,
            AgentTriggerScenario::ProgressReport,
            AgentTriggerScenario::CollaborationRelay,
        ];
        self.allow_proactive_notification = true;
        self.allow_data_supplement = true;
        self.allow_progress_report = true;
        self
    }
}

// ============ FR649: Agent 数据隔离 ============

/// Agent 在群内的数据访问范围
///
/// FR649: Agent 在群内只能访问与任务相关的数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentDataScope {
    /// 群组 ID
    pub group_id: String,
    /// Agent 所属用户 ID
    pub user_id: String,
    /// 允许访问的部门列表
    pub allowed_departments: Vec<String>,
    /// 允许访问的实体类型
    pub allowed_entities: Vec<String>,
    /// 数据范围限制级别
    pub scope_level: DataScopeLevel,
}

/// 数据范围级别
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DataScopeLevel {
    /// 仅任务相关数据
    TaskOnly,
    /// 部门内数据
    Department,
    /// 全公司数据
    Company,
}

impl Default for DataScopeLevel {
    fn default() -> Self {
        Self::TaskOnly
    }
}

impl AgentDataScope {
    pub fn new(group_id: String, user_id: String) -> Self {
        Self {
            group_id,
            user_id,
            allowed_departments: Vec::new(),
            allowed_entities: Vec::new(),
            scope_level: DataScopeLevel::TaskOnly,
        }
    }

    /// 检查是否允许访问指定部门的数据
    pub fn can_access_department(&self, department: &str) -> bool {
        match self.scope_level {
            DataScopeLevel::Company => true,
            DataScopeLevel::Department => self.allowed_departments.contains(&department.to_string()),
            DataScopeLevel::TaskOnly => self.allowed_departments.contains(&department.to_string()),
        }
    }

    /// 检查是否允许访问指定实体类型
    pub fn can_access_entity(&self, entity_type: &str) -> bool {
        match self.scope_level {
            DataScopeLevel::Company => true,
            _ => self.allowed_entities.contains(&entity_type.to_string()),
        }
    }
}

// ============ FR642/643/644/645: Agent 协作事件 ============

/// Agent 协作事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentCollaborationEvent {
    /// 事件 ID
    pub id: String,
    /// 群组 ID
    pub group_id: String,
    /// 事件类型
    pub event_type: CollaborationEventType,
    /// 触发用户 ID
    pub trigger_user_id: String,
    /// 事件内容
    pub content: String,
    /// 关联数据
    pub related_data: Option<serde_json::Value>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
}

/// 协作事件类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CollaborationEventType {
    /// FR642: 任务状态变化
    TaskStatusChanged,
    /// FR643: 数据补充
    DataSupplement,
    /// FR644: 进度汇报
    ProgressReport,
    /// FR645: 协作接力（上游任务完成通知下游）
    CollaborationRelay,
}

// ============ 错误类型 ============

/// 群聊 Agent 协作错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GroupAgentError {
    /// 群组不存在
    GroupNotFound,
    /// 不是群成员
    NotMember,
    /// 无发言权限
    SpeechDenied,
    /// 数据访问被拒绝
    DataAccessDenied,
    /// 无效的触发场景
    InvalidScenario,
}

impl std::fmt::Display for GroupAgentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::GroupNotFound => write!(f, "群组不存在"),
            Self::NotMember => write!(f, "不是群成员"),
            Self::SpeechDenied => write!(f, "Agent 无发言权限"),
            Self::DataAccessDenied => write!(f, "Agent 数据访问被拒绝"),
            Self::InvalidScenario => write!(f, "无效的触发场景"),
        }
    }
}

impl std::error::Error for GroupAgentError {}
