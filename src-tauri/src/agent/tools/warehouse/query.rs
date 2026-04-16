//! Warehouse Inventory Query 工具 - warehouse_inventory_query

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct WarehouseInventoryQueryTool;

impl Tool for WarehouseInventoryQueryTool {
    fn name(&self) -> &str { "warehouse_inventory_query" }
    fn description(&self) -> &str { "查询库存/库位/出入库记录" }
    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false, supports_cancellation: false,
            requires_permission: true, requires_confirmation: false,
            is_read_only: true, has_side_effects: false,
            supports_retry: false, estimated_duration: None,
        }
    }
    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter { name: "sku".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "SKU编号".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None },
            ToolParameter { name: "locationId".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "库位ID".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None },
            ToolParameter { name: "keyword".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "关键词搜索".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None },
        ]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("库存查询结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests { use super::*; #[test] fn test_tool_name() { assert_eq!(WarehouseInventoryQueryTool::default().name(), "warehouse_inventory_query"); } }
