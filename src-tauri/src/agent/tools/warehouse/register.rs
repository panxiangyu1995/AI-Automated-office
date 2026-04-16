//! Warehouse Subagent 注册器

use crate::agent::subagent::{
    types::{AgentConfig, AgentMode, AgentType, LimitsConfig, ModelConfig, ModelProvider, ToolPermissions, TriggerConfig, TriggerMode},
    SubagentManager,
};

pub struct WarehouseSubagentConfig {
    pub plugin_id: String,
    pub primary_model: ModelProvider,
    pub light_model: Option<ModelProvider>,
}

impl Default for WarehouseSubagentConfig {
    fn default() -> Self {
        Self {
            plugin_id: "warehouse".to_string(),
            primary_model: ModelProvider { provider: "anthropic".to_string(), model_id: "claude-sonnet-4-20250514".to_string(), temperature: 0.7, max_tokens: 8192 },
            light_model: Some(ModelProvider { provider: "anthropic".to_string(), model_id: "claude-haiku-4-20250711".to_string(), temperature: 0.3, max_tokens: 4096 }),
        }
    }
}

impl WarehouseSubagentConfig {
    pub fn to_agent_config(&self) -> AgentConfig {
        AgentConfig {
            name: "warehouse".to_string(), agent_type: AgentType::Department, mode: AgentMode::Department,
            display_name: "仓储助手".to_string(), description: "处理仓储相关任务，包括库存管理、出入库、盘点等".to_string(),
            models: ModelConfig { primary: self.primary_model.clone(), light: self.light_model.clone(), small: None },
            tools: ToolPermissions {
                allowed: vec!["warehouse_inventory_query".to_string(), "warehouse_inventory_aggregate".to_string(), "warehouse_inventory_mutate".to_string(), "warehouse_stock_action".to_string(), "warehouse_report_export".to_string()],
                denied: vec![], constraints: Default::default(),
            },
            trigger: TriggerConfig { mode: TriggerMode::Auto, keywords: vec!["库存".to_string(), "入库".to_string(), "出库".to_string(), "盘点".to_string(), "调拨".to_string(), "库位".to_string()], conditions: vec![], priority: 6 },
            limits: LimitsConfig { max_steps: 20, max_concurrent: 2, timeout_seconds: 180 },
            plugin_id: Some(self.plugin_id.clone()), creator_id: None,
        }
    }
    pub fn register(&self, manager: &SubagentManager) -> Result<(), String> {
        futures::executor::block_on(manager.department_loader().register(self.to_agent_config())).map_err(|e| e.to_string())
    }
}

pub fn init_warehouse_subagent(manager: &SubagentManager) -> Result<(), String> { WarehouseSubagentConfig::default().register(manager) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_warehouse_config() {
        let ac = WarehouseSubagentConfig::default().to_agent_config();
        assert_eq!(ac.name, "warehouse");
        assert_eq!(ac.display_name, "仓储助手");
        assert_eq!(ac.tools.allowed.len(), 5);
    }
}
