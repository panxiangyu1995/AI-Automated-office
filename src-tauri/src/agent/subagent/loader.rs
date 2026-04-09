//! Subagent 加载器 trait
//!
//! 定义 Subagent 加载器的通用接口

use std::any::Any;
use super::types::{AgentConfig, AgentType, SubagentError, SubagentResult};

/// Subagent 加载器 trait
///
/// 所有 Subagent 加载器必须实现此 trait
pub trait SubagentLoader: Send + Sync + Any {
    /// 加载所有 Subagent
    fn load_all(&self) -> SubagentResult<Vec<AgentConfig>>;

    /// 根据名称加载单个 Subagent
    fn load(&self, name: &str) -> SubagentResult<Option<AgentConfig>>;

    /// 获取 Subagent 类型
    fn get_type(&self) -> AgentType;

    /// 获取加载器名称
    fn name(&self) -> &str {
        "unknown"
    }

    /// As any type for downcasting
    fn as_any(&self) -> &dyn Any;
}

/// Hidden Agent 配置
#[derive(Debug, Clone)]
pub struct HiddenAgentConfig {
    /// Agent 名称
    pub name: String,
    /// 显示名称
    pub display_name: String,
    /// 描述
    pub description: String,
    /// 模型类型
    pub model_type: HiddenModelType,
}

/// Hidden Agent 模型类型
#[derive(Debug, Clone, Copy)]
pub enum HiddenModelType {
    /// 小模型（用于标题、摘要）
    Small,
    /// 主模型（用于上下文压缩）
    Primary,
}

impl HiddenAgentConfig {
    /// 创建 Hidden Agent 配置
    pub fn into_agent_config(self, provider: &super::types::ModelProvider) -> AgentConfig {
        AgentConfig {
            name: self.name,
            agent_type: AgentType::Hidden,
            mode: super::types::AgentMode::Hidden,
            display_name: self.display_name,
            description: self.description,
            models: super::types::ModelConfig {
                primary: provider.clone(),
                light: None,
                small: Some(provider.clone()),
            },
            tools: super::types::ToolPermissions::default(),
            trigger: super::types::TriggerConfig::default(),
            limits: super::types::LimitsConfig::default(),
            plugin_id: None,
            creator_id: None,
        }
    }
}

/// 内置 Hidden Agents
pub fn get_builtin_hidden_agents() -> Vec<HiddenAgentConfig> {
    vec![
        HiddenAgentConfig {
            name: "title".to_string(),
            display_name: "标题生成".to_string(),
            description: "自动生成会话标题".to_string(),
            model_type: HiddenModelType::Small,
        },
        HiddenAgentConfig {
            name: "summary".to_string(),
            display_name: "摘要生成".to_string(),
            description: "生成会话摘要".to_string(),
            model_type: HiddenModelType::Small,
        },
        HiddenAgentConfig {
            name: "compaction".to_string(),
            display_name: "上下文压缩".to_string(),
            description: "压缩会话上下文".to_string(),
            model_type: HiddenModelType::Primary,
        },
    ]
}
