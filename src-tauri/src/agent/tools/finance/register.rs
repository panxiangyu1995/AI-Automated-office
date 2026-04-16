//! Finance Subagent 注册器
//!
//! 将财务工具注册到 SubagentManager


use crate::agent::subagent::{
    types::{AgentConfig, AgentMode, AgentType, LimitsConfig, ModelConfig, ModelProvider, ToolPermissions, TriggerConfig, TriggerMode},
    SubagentManager,
};

/// 财务 Subagent 配置
pub struct FinanceSubagentConfig {
    /// 插件 ID
    pub plugin_id: String,
    /// 主模型配置
    pub primary_model: ModelProvider,
    /// 轻量模型配置（用于 OCR）
    pub light_model: Option<ModelProvider>,
    /// 小模型配置（用于简单查询）
    pub small_model: Option<ModelProvider>,
}

impl Default for FinanceSubagentConfig {
    fn default() -> Self {
        Self {
            plugin_id: "finance".to_string(),
            primary_model: ModelProvider {
                provider: "anthropic".to_string(),
                model_id: "claude-sonnet-4-20250514".to_string(),
                temperature: 0.7,
                max_tokens: 8192,
            },
            light_model: Some(ModelProvider {
                provider: "anthropic".to_string(),
                model_id: "claude-haiku-4-20250711".to_string(),
                temperature: 0.3,
                max_tokens: 4096,
            }),
            small_model: Some(ModelProvider {
                provider: "openai".to_string(),
                model_id: "gpt-4o-mini".to_string(),
                temperature: 0.5,
                max_tokens: 1024,
            }),
        }
    }
}

impl FinanceSubagentConfig {
    /// 转换为 AgentConfig
    pub fn to_agent_config(&self) -> AgentConfig {
        AgentConfig {
            name: "finance".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "财务助手".to_string(),
            description: "处理财务相关任务，包括发票识别、报销审核、财务查询等".to_string(),
            models: ModelConfig {
                primary: self.primary_model.clone(),
                light: self.light_model.clone(),
                small: self.small_model.clone(),
            },
            tools: ToolPermissions {
                allowed: vec![
                    "finance_query".to_string(),
                    "finance_ocr".to_string(),
                    "finance_mutate".to_string(),
                    "finance_aggregate".to_string(),
                    "finance_export".to_string(),
                    "finance_report".to_string(),
                    "finance_dashboard".to_string(),
                ],
                denied: vec![
                    "finance_forecast".to_string(), // 只有 Executive 可以使用
                ],
                constraints: Default::default(),
            },
            trigger: TriggerConfig {
                mode: TriggerMode::Auto,
                keywords: vec![
                    "报销".to_string(),
                    "发票".to_string(),
                    "财务".to_string(),
                    "对账".to_string(),
                    "账单".to_string(),
                    "付款".to_string(),
                    "收款".to_string(),
                    "预算".to_string(),
                    "成本".to_string(),
                    "利润".to_string(),
                ],
                conditions: vec![
                    crate::agent::subagent::types::TriggerCondition {
                        intent: "finance.ocr".to_string(),
                        entities: vec![
                            "invoice".to_string(),
                            "发票".to_string(),
                            "收据".to_string(),
                        ],
                    },
                    crate::agent::subagent::types::TriggerCondition {
                        intent: "finance.query".to_string(),
                        entities: vec![
                            "expense".to_string(),
                            "报销".to_string(),
                            "查询".to_string(),
                        ],
                    },
                    crate::agent::subagent::types::TriggerCondition {
                        intent: "finance.report".to_string(),
                        entities: vec![
                            "report".to_string(),
                            "报表".to_string(),
                            "统计".to_string(),
                        ],
                    },
                ],
                priority: 8,
            },
            limits: LimitsConfig {
                max_steps: 30,
                max_concurrent: 2,
                timeout_seconds: 300,
            },
            plugin_id: Some(self.plugin_id.clone()),
            creator_id: None,
        }
    }

    /// 注册到 SubagentManager
    pub fn register(&self, manager: &SubagentManager) -> Result<(), String> {
        let config = self.to_agent_config();
        let loader = manager.department_loader();

        futures::executor::block_on(loader.register(config))
            .map_err(|e| e.to_string())
    }
}

/// 获取默认的财务 Subagent 配置
pub fn get_default_finance_config() -> FinanceSubagentConfig {
    FinanceSubagentConfig::default()
}

/// 初始化财务 Subagent
pub fn init_finance_subagent(manager: &SubagentManager) -> Result<(), String> {
    let config = get_default_finance_config();
    config.register(manager)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_finance_config_to_agent_config() {
        let config = FinanceSubagentConfig::default();
        let agent_config = config.to_agent_config();

        assert_eq!(agent_config.name, "finance");
        assert_eq!(agent_config.agent_type, AgentType::Department);
        assert_eq!(agent_config.display_name, "财务助手");
        
        // 工具列表应该包含主要工具
        assert!(agent_config.tools.allowed.contains(&"finance_query".to_string()));
        assert!(agent_config.tools.allowed.contains(&"finance_ocr".to_string()));
        assert!(agent_config.tools.allowed.contains(&"finance_mutate".to_string()));
        
        // forecast 应该是禁止的
        assert!(agent_config.tools.denied.contains(&"finance_forecast".to_string()));
    }

    #[test]
    fn test_trigger_keywords() {
        let config = FinanceSubagentConfig::default();
        let agent_config = config.to_agent_config();

        assert!(agent_config.trigger.keywords.contains(&"报销".to_string()));
        assert!(agent_config.trigger.keywords.contains(&"发票".to_string()));
        assert!(agent_config.trigger.keywords.contains(&"财务".to_string()));
    }
}
