//! Service Subagent 注册器

use crate::agent::subagent::{
    types::{AgentConfig, AgentMode, AgentType, LimitsConfig, ModelConfig, ModelProvider, ToolPermissions, TriggerConfig, TriggerMode},
    SubagentManager,
};

pub struct ServiceSubagentConfig {
    pub plugin_id: String,
    pub primary_model: ModelProvider,
    pub light_model: Option<ModelProvider>,
}

impl Default for ServiceSubagentConfig {
    fn default() -> Self {
        Self {
            plugin_id: "service".to_string(),
            primary_model: ModelProvider { provider: "anthropic".to_string(), model_id: "claude-sonnet-4-20250514".to_string(), temperature: 0.7, max_tokens: 8192 },
            light_model: Some(ModelProvider { provider: "anthropic".to_string(), model_id: "claude-haiku-4-20250711".to_string(), temperature: 0.3, max_tokens: 4096 }),
        }
    }
}

impl ServiceSubagentConfig {
    pub fn to_agent_config(&self) -> AgentConfig {
        AgentConfig {
            name: "service".to_string(), agent_type: AgentType::Department, mode: AgentMode::Department,
            display_name: "售后助手".to_string(), description: "处理售后服务相关任务，包括工单管理、派单、SLA跟踪等".to_string(),
            models: ModelConfig { primary: self.primary_model.clone(), light: self.light_model.clone(), small: None },
            tools: ToolPermissions {
                allowed: vec!["service_ticket_query".to_string(), "service_ticket_aggregate".to_string(), "service_ticket_mutate".to_string(), "service_dispatch_action".to_string(), "service_report_export".to_string()],
                denied: vec![], constraints: Default::default(),
            },
            trigger: TriggerConfig { mode: TriggerMode::Auto, keywords: vec!["售后".to_string(), "工单".to_string(), "派单".to_string(), "客服".to_string(), "投诉".to_string(), "SLA".to_string()], conditions: vec![], priority: 6 },
            limits: LimitsConfig { max_steps: 20, max_concurrent: 2, timeout_seconds: 180 },
            plugin_id: Some(self.plugin_id.clone()), creator_id: None,
        }
    }
    pub fn register(&self, manager: &SubagentManager) -> Result<(), String> {
        futures::executor::block_on(manager.department_loader().register(self.to_agent_config())).map_err(|e| e.to_string())
    }
}

pub fn init_service_subagent(manager: &SubagentManager) -> Result<(), String> { ServiceSubagentConfig::default().register(manager) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_service_config() {
        let ac = ServiceSubagentConfig::default().to_agent_config();
        assert_eq!(ac.name, "service");
        assert_eq!(ac.display_name, "售后助手");
        assert_eq!(ac.tools.allowed.len(), 5);
    }
}
