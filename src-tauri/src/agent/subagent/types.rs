//! Subagent 类型定义
//!
//! 实现 ADR-059 中定义的所有 Agent 类型和相关数据结构

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Agent 类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    /// Primary Agent - 主 Agent，负责用户交互和任务编排
    Primary,
    /// Department Subagent - 部门级 Subagent，随插件加载
    Department,
    /// Personal Subagent - 用户级 Subagent，本地存储
    Personal,
    /// Hidden Agent - 系统级 Agent（标题、摘要、压缩）
    Hidden,
}

impl Default for AgentType {
    fn default() -> Self {
        AgentType::Primary
    }
}

/// Agent Mode 枚举（来自 kilocode 启发）
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentMode {
    /// code - 默认主 Agent
    Code,
    /// ask - 纯问答（无写操作）
    Ask,
    /// orchestrator - 复杂任务编排
    Orchestrator,
    /// general - 并行多步骤任务
    General,
    /// department - 部门 Subagent
    Department,
    /// hidden - 系统任务
    Hidden,
}

impl Default for AgentMode {
    fn default() -> Self {
        AgentMode::Code
    }
}

/// 触发模式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TriggerMode {
    /// 手动触发
    Manual,
    /// 自动路由
    Auto,
    /// 混合模式
    Hybrid,
}

impl Default for TriggerMode {
    fn default() -> Self {
        TriggerMode::Manual
    }
}

/// 数据范围
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataScope {
    /// 仅本人数据
    Personal,
    /// 本部门数据
    Department,
    /// 全部数据
    All,
    /// 高管数据范围
    Executive,
}

impl Default for DataScope {
    fn default() -> Self {
        DataScope::Personal
    }
}

/// 输出格式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutputFormat {
    Text,
    Structured,
    Json,
}

impl Default for OutputFormat {
    fn default() -> Self {
        OutputFormat::Text
    }
}

/// 结果状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResultStatus {
    Success,
    PartialFailure,
    Failure,
}

impl Default for ResultStatus {
    fn default() -> Self {
        ResultStatus::Success
    }
}

/// Agent 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    /// Agent 名称（唯一标识）
    pub name: String,
    /// Agent 类型
    #[serde(default)]
    pub agent_type: AgentType,
    /// Agent Mode
    #[serde(default)]
    pub mode: AgentMode,
    /// 显示名称
    pub display_name: String,
    /// 描述
    pub description: String,
    /// 模型配置
    pub models: ModelConfig,
    /// 工具权限
    #[serde(default)]
    pub tools: ToolPermissions,
    /// 触发条件
    #[serde(default)]
    pub trigger: TriggerConfig,
    /// 限制参数
    #[serde(default)]
    pub limits: LimitsConfig,
    /// 插件 ID（Department Subagent 专用）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plugin_id: Option<String>,
    /// 创建者 ID（Personal Subagent 专用）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub creator_id: Option<String>,
}

impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            name: String::new(),
            agent_type: AgentType::Primary,
            mode: AgentMode::Code,
            display_name: String::new(),
            description: String::new(),
            models: ModelConfig::default(),
            tools: ToolPermissions::default(),
            trigger: TriggerConfig::default(),
            limits: LimitsConfig::default(),
            plugin_id: None,
            creator_id: None,
        }
    }
}

/// 模型配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    /// 主模型配置
    pub primary: ModelProvider,
    /// 轻量模型配置（用于 OCR、简单查询）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub light: Option<ModelProvider>,
    /// 小模型配置（用于标题、摘要）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub small: Option<ModelProvider>,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            primary: ModelProvider::default(),
            light: None,
            small: None,
        }
    }
}

/// 模型提供者
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelProvider {
    /// 提供商
    pub provider: String,
    /// 模型 ID
    pub model_id: String,
    /// 温度
    #[serde(default = "default_temperature")]
    pub temperature: f32,
    /// 最大 token 数
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u32,
}

fn default_temperature() -> f32 {
    0.7
}

fn default_max_tokens() -> u32 {
    4096
}

impl Default for ModelProvider {
    fn default() -> Self {
        Self {
            provider: "openai".to_string(),
            model_id: "gpt-4o".to_string(),
            temperature: 0.7,
            max_tokens: 4096,
        }
    }
}

/// 工具权限配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolPermissions {
    /// 允许的工具列表
    #[serde(default)]
    pub allowed: Vec<String>,
    /// 禁止的工具列表
    #[serde(default)]
    pub denied: Vec<String>,
    /// 工具约束
    #[serde(default)]
    pub constraints: HashMap<String, ToolConstraint>,
}

impl Default for ToolPermissions {
    fn default() -> Self {
        Self {
            allowed: Vec::new(),
            denied: Vec::new(),
            constraints: HashMap::new(),
        }
    }
}

/// 工具约束
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolConstraint {
    /// 最大调用次数/天
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_per_day: Option<u32>,
    /// 最大金额限制
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_amount: Option<f64>,
    /// 允许的字段列表
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allowed_fields: Option<Vec<String>>,
    /// 数据范围
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_scope: Option<DataScope>,
}

/// 触发配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TriggerConfig {
    /// 触发模式
    #[serde(default)]
    pub mode: TriggerMode,
    /// 触发关键词
    #[serde(default)]
    pub keywords: Vec<String>,
    /// 触发条件
    #[serde(default)]
    pub conditions: Vec<TriggerCondition>,
    /// 优先级（1-10）
    #[serde(default = "default_priority")]
    pub priority: u8,
}

fn default_priority() -> u8 {
    5
}

impl Default for TriggerConfig {
    fn default() -> Self {
        Self {
            mode: TriggerMode::Manual,
            keywords: Vec::new(),
            conditions: Vec::new(),
            priority: 5,
        }
    }
}

/// 触发条件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TriggerCondition {
    /// 意图类型
    pub intent: String,
    /// 实体类型
    #[serde(default)]
    pub entities: Vec<String>,
}

/// 限制配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LimitsConfig {
    /// 最大步数
    #[serde(default = "default_max_steps")]
    pub max_steps: u32,
    /// 最大并发数
    #[serde(default = "default_max_concurrent")]
    pub max_concurrent: u32,
    /// 超时时间（秒）
    #[serde(default = "default_timeout")]
    pub timeout_seconds: u32,
}

fn default_max_steps() -> u32 {
    20
}

fn default_max_concurrent() -> u32 {
    1
}

fn default_timeout() -> u32 {
    300
}

impl Default for LimitsConfig {
    fn default() -> Self {
        Self {
            max_steps: 20,
            max_concurrent: 1,
            timeout_seconds: 300,
        }
    }
}

/// 委派协议（Delegation Contract）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DelegationContract {
    /// 委派目标
    pub target: DelegationTarget,
    /// 权限约束
    pub constraints: DelegationConstraints,
    /// 上下文传递
    pub context: DelegationContext,
    /// 输出契约
    #[serde(default)]
    pub output: OutputContract,
}

/// 委派目标
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DelegationTarget {
    /// Subagent 名称
    pub subagent: String,
    /// 可选的意图限定
    #[serde(skip_serializing_if = "Option::is_none")]
    pub intent: Option<String>,
}

/// 委派约束
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DelegationConstraints {
    /// 允许的工具白名单
    #[serde(default)]
    pub allowed_tools: Vec<String>,
    /// 禁止的工具黑名单
    #[serde(default)]
    pub denied_tools: Vec<String>,
    /// 数据范围
    #[serde(default)]
    pub data_scope: DataScope,
    /// 最大步数限制
    #[serde(default = "default_constraint_max_steps")]
    pub max_steps: u32,
    /// 超时时间（毫秒）
    #[serde(default = "default_constraint_timeout")]
    pub timeout: u64,
}

fn default_constraint_max_steps() -> u32 {
    50
}

fn default_constraint_timeout() -> u64 {
    300000
}

impl Default for DelegationConstraints {
    fn default() -> Self {
        Self {
            allowed_tools: Vec::new(),
            denied_tools: Vec::new(),
            data_scope: DataScope::Personal,
            max_steps: 50,
            timeout: 300000,
        }
    }
}

/// 委派上下文
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DelegationContext {
    /// 原始用户消息
    pub user_message: String,
    /// 提取的实体
    #[serde(default)]
    pub extracted_entities: HashMap<String, serde_json::Value>,
    /// 前置 Subagent 的结果
    #[serde(skip_serializing_if = "Option::is_none")]
    pub previous_results: Option<Vec<SubagentExecutionResult>>,
}

/// 输出契约
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutputContract {
    /// 输出格式
    #[serde(default)]
    pub format: OutputFormat,
    /// 期望的结构化输出 schema
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<serde_json::Value>,
}

impl Default for OutputContract {
    fn default() -> Self {
        Self {
            format: OutputFormat::Text,
            schema: None,
        }
    }
}

/// Subagent 执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubagentExecutionResult {
    /// Subagent 名称
    pub subagent: String,
    /// 执行状态
    #[serde(default)]
    pub status: ResultStatus,
    /// 输出内容
    pub output: String,
    /// 错误信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// 执行耗时（毫秒）
    pub elapsed_ms: u64,
}

/// Subagent 错误
#[derive(Debug, Error)]
pub enum SubagentError {
    #[error("Subagent not found: {0}")]
    NotFound(String),

    #[error("Load failed: {0}")]
    LoadFailed(String),

    #[error("Config invalid: {0}")]
    ConfigInvalid(String),

    #[error("Storage error: {0}")]
    Storage(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Execution failed: {0}")]
    Execution(String),
}

impl From<rusqlite::Error> for SubagentError {
    fn from(err: rusqlite::Error) -> Self {
        SubagentError::Storage(err.to_string())
    }
}

impl From<serde_json::Error> for SubagentError {
    fn from(err: serde_json::Error) -> Self {
        SubagentError::ConfigInvalid(err.to_string())
    }
}

pub type SubagentResult<T> = Result<T, SubagentError>;
