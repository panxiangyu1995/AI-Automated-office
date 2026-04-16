//! Warehouse Inventory Aggregate 工具 - warehouse_inventory_aggregate

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct WarehouseInventoryAggregateTool;

impl Tool for WarehouseInventoryAggregateTool {
    fn name(&self) -> &str { "warehouse_inventory_aggregate" }
    fn description(&self) -> &str { "库存聚合统计：按仓库/品类/库龄分组" }
    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities { supports_streaming: false, supports_cancellation: false, requires_permission: true, requires_confirmation: false, is_read_only: true, has_side_effects: false, supports_retry: false, estimated_duration: None }
    }
    fn parameters(&self) -> Vec<ToolParameter> {
        vec![ToolParameter { name: "groupBy".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "分组维度".to_string(), required: true, default: None,
            r#enum: Some(vec!["warehouse".to_string(), "category".to_string(), "age".to_string()]),
            minimum: None, maximum: None, pattern: None, items: None, properties: None }]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("聚合统计结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests { use super::*; #[test] fn test_tool_name() { assert_eq!(WarehouseInventoryAggregateTool::default().name(), "warehouse_inventory_aggregate"); } }
