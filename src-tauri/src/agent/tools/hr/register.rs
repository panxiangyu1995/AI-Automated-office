//! HR Subagent 注册器
//!
//! 将HR工具注册到 SubagentManager

use crate::agent::subagent::{
    types::{
        AgentConfig, AgentMode, AgentType, LimitsConfig, ModelConfig, ModelProvider,
        ToolPermissions, TriggerConfig, TriggerMode,
    },
    SubagentManager,
};

/// HR Subagent 配置
pub struct HrSubagentConfig {
    pub plugin_id: String,
    pub primary_model: ModelProvider,
    pub light_model: Option<ModelProvider>,
    pub small_model: Option<ModelProvider>,
}

impl Default for HrSubagentConfig {
    fn default() -> Self {
        Self {
            plugin_id: "hr".to_string(),
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
            small_model: None,
        }
    }
}

impl HrSubagentConfig {
    /// 转换为 AgentConfig
    pub fn to_agent_config(&self) -> AgentConfig {
        AgentConfig {
            name: "hr".to_string(),
            agent_type: AgentType::Department,
            mode: AgentMode::Department,
            display_name: "人事助手".to_string(),
            description: "处理人事相关任务，包括员工管理、部门管理、岗位管理等".to_string(),
            models: ModelConfig {
                primary: self.primary_model.clone(),
                light: self.light_model.clone(),
                small: self.small_model.clone(),
            },
            tools: ToolPermissions {
                allowed: vec![
                    "hr_employee_query".to_string(),
                    "hr_employee_aggregate".to_string(),
                    "hr_employee_mutate".to_string(),
                    "hr_department_action".to_string(),
                    "hr_report_export".to_string(),
                ],
                denied: vec![],
                constraints: Default::default(),
            },
            trigger: TriggerConfig {
                mode: TriggerMode::Auto,
                keywords: vec![
                    "员工".to_string(),
                    "入职".to_string(),
                    "离职".to_string(),
                    "部门".to_string(),
                    "岗位".to_string(),
                    "调岗".to_string(),
                    "花名册".to_string(),
                    "考勤".to_string(),
                ],
                conditions: vec![],
                priority: 7,
            },
            limits: LimitsConfig {
                max_steps: 20,
                max_concurrent: 2,
                timeout_seconds: 180,
            },
            plugin_id: Some(self.plugin_id.clone()),
            creator_id: None,
        }
    }

    /// 注册到 SubagentManager
    pub fn register(&self, manager: &SubagentManager) -> Result<(), String> {
        let config = self.to_agent_config();
        let loader = manager.department_loader();
        futures::executor::block_on(loader.register(config)).map_err(|e| e.to_string())
    }
}

/// 初始化 HR Subagent
pub fn init_hr_subagent(manager: &SubagentManager) -> Result<(), String> {
    let config = HrSubagentConfig::default();
    config.register(manager)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hr_config_to_agent_config() {
        let config = HrSubagentConfig::default();
        let agent_config = config.to_agent_config();

        assert_eq!(agent_config.name, "hr");
        assert_eq!(agent_config.agent_type, AgentType::Department);
        assert_eq!(agent_config.display_name, "人事助手");

        // 验证5个工具已注册
        assert!(agent_config.tools.allowed.contains(&"hr_employee_query".to_string()));
        assert!(agent_config.tools.allowed.contains(&"hr_employee_aggregate".to_string()));
        assert!(agent_config.tools.allowed.contains(&"hr_employee_mutate".to_string()));
        assert!(agent_config.tools.allowed.contains(&"hr_department_action".to_string()));
        assert!(agent_config.tools.allowed.contains(&"hr_report_export".to_string()));
        assert_eq!(agent_config.tools.allowed.len(), 5);
    }

    #[test]
    fn test_trigger_keywords() {
        let config = HrSubagentConfig::default();
        let agent_config = config.to_agent_config();

        assert!(agent_config.trigger.keywords.contains(&"员工".to_string()));
        assert!(agent_config.trigger.keywords.contains(&"入职".to_string()));
        assert!(agent_config.trigger.keywords.contains(&"部门".to_string()));
    }
}
