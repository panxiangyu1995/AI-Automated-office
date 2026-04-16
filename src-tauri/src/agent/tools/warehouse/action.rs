//! Warehouse Stock Action 工具 - warehouse_stock_action

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct WarehouseStockActionTool;

impl Tool for WarehouseStockActionTool {
    fn name(&self) -> &str { "warehouse_stock_action" }
    fn description(&self) -> &str { "库存业务操作：设置预警/创建库位/锁定库存" }
    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities { supports_streaming: false, supports_cancellation: false, requires_permission: true, requires_confirmation: true, is_read_only: false, has_side_effects: true, supports_retry: false, estimated_duration: None }
    }
    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter { name: "action".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "操作类型".to_string(), required: true, default: None,
                r#enum: Some(vec!["set_alert".to_string(), "create_location".to_string(), "lock_stock".to_string(), "unlock_stock".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None },
            ToolParameter { name: "data".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
                description: "操作数据".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None },
        ]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("操作结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests { use super::*; #[test] fn test_tool_name() { assert_eq!(WarehouseStockActionTool::default().name(), "warehouse_stock_action"); } }
