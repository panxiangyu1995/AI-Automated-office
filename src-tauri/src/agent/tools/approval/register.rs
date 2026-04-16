//! Approval Subagent 注册器

use crate::agent::subagent::{
    types::{AgentConfig, AgentMode, AgentType, LimitsConfig, ModelConfig, ModelProvider, ToolPermissions, TriggerConfig, TriggerMode},
    SubagentManager,
};

pub struct ApprovalSubagentConfig {
    pub plugin_id: String,
    pub primary_model: ModelProvider,
    pub light_model: Option<ModelProvider>,
}

impl Default for ApprovalSubagentConfig {
    fn default() -> Self {
        Self {
            plugin_id: "approval".to_string(),
            primary_model: ModelProvider {
                provider: "anthropic".to_string(), model_id: "claude-sonnet-4-20250514".to_string(),
                temperature: 0.7, max_tokens: 8192,
            },
            light_model: Some(ModelProvider {
                provider: "anthropic".to_string(), model_id: "claude-haiku-4-20250711".to_string(),
                temperature: 0.3, max_tokens: 4096,
            }),
        }
    }
}

impl ApprovalSubagentConfig {
    pub fn to_agent_config(&self) -> AgentConfig {
        AgentConfig {
            name: "approval".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "审批助手".to_string(),
            description: "处理审批相关任务，包括发起审批、审批操作、流程查询等".to_string(),
            models: ModelConfig { primary: self.primary_model.clone(), light: self.light_model.clone(), small: None },
            tools: ToolPermissions {
                allowed: vec![
                    "approval_flow_query".to_string(), "approval_flow_aggregate".to_string(),
                    "approval_flow_mutate".to_string(), "approval_task_action".to_string(),
                    "approval_report_export".to_string(),
                ],
                denied: vec![], constraints: Default::default(),
            },
            trigger: TriggerConfig {
                mode: TriggerMode::Auto,
                keywords: vec!["审批".to_string(), "批准".to_string(), "拒绝".to_string(), "转审".to_string(), "加签".to_string()],
                conditions: vec![], priority: 8,
            },
            limits: LimitsConfig { max_steps: 15, max_concurrent: 1, timeout_seconds: 120 },
            plugin_id: Some(self.plugin_id.clone()), creator_id: None,
        }
    }

    pub fn register(&self, manager: &SubagentManager) -> Result<(), String> {
        let config = self.to_agent_config();
        futures::executor::block_on(manager.department_loader().register(config)).map_err(|e| e.to_string())
    }
}

pub fn init_approval_subagent(manager: &SubagentManager) -> Result<(), String> {
    ApprovalSubagentConfig::default().register(manager)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_approval_config() {
        let config = ApprovalSubagentConfig::default();
        let ac = config.to_agent_config();
        assert_eq!(ac.name, "approval");
        assert_eq!(ac.display_name, "审批助手");
        assert!(ac.tools.allowed.contains(&"approval_flow_query".to_string()));
        assert!(ac.tools.allowed.contains(&"approval_task_action".to_string()));
        assert_eq!(ac.tools.allowed.len(), 5);
    }
}
