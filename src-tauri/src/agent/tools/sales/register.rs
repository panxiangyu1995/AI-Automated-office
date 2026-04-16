//! Sales Subagent 注册器

use crate::agent::subagent::{
    types::{AgentConfig, AgentMode, AgentType, LimitsConfig, ModelConfig, ModelProvider, ToolPermissions, TriggerConfig, TriggerMode},
    SubagentManager,
};

pub struct SalesSubagentConfig {
    pub plugin_id: String,
    pub primary_model: ModelProvider,
    pub light_model: Option<ModelProvider>,
}

impl Default for SalesSubagentConfig {
    fn default() -> Self {
        Self {
            plugin_id: "sales".to_string(),
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
        }
    }
}

impl SalesSubagentConfig {
    pub fn to_agent_config(&self) -> AgentConfig {
        AgentConfig {
            name: "sales".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "销售助手".to_string(),
            description: "处理销售相关任务，包括客户管理、报价、合同等".to_string(),
            models: ModelConfig { primary: self.primary_model.clone(), light: self.light_model.clone(), small: None },
            tools: ToolPermissions {
                allowed: vec![
                    "sales_customer_query".to_string(),
                    "sales_customer_aggregate".to_string(),
                    "sales_customer_mutate".to_string(),
                    "sales_deal_action".to_string(),
                    "sales_report_export".to_string(),
                ],
                denied: vec![],
                constraints: Default::default(),
            },
            trigger: TriggerConfig {
                mode: TriggerMode::Auto,
                keywords: vec![
                    "客户".to_string(), "报价".to_string(), "合同".to_string(),
                    "销售".to_string(), "业绩".to_string(), "漏斗".to_string(),
                ],
                conditions: vec![],
                priority: 7,
            },
            limits: LimitsConfig { max_steps: 20, max_concurrent: 2, timeout_seconds: 180 },
            plugin_id: Some(self.plugin_id.clone()),
            creator_id: None,
        }
    }

    pub fn register(&self, manager: &SubagentManager) -> Result<(), String> {
        let config = self.to_agent_config();
        let loader = manager.department_loader();
        futures::executor::block_on(loader.register(config)).map_err(|e| e.to_string())
    }
}

pub fn init_sales_subagent(manager: &SubagentManager) -> Result<(), String> {
    SalesSubagentConfig::default().register(manager)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sales_config_to_agent_config() {
        let config = SalesSubagentConfig::default();
        let agent_config = config.to_agent_config();
        assert_eq!(agent_config.name, "sales");
        assert_eq!(agent_config.display_name, "销售助手");
        assert!(agent_config.tools.allowed.contains(&"sales_customer_query".to_string()));
        assert!(agent_config.tools.allowed.contains(&"sales_deal_action".to_string()));
        assert_eq!(agent_config.tools.allowed.len(), 5);
    }

    #[test]
    fn test_trigger_keywords() {
        let config = SalesSubagentConfig::default();
        let agent_config = config.to_agent_config();
        assert!(agent_config.trigger.keywords.contains(&"客户".to_string()));
        assert!(agent_config.trigger.keywords.contains(&"销售".to_string()));
    }
}
