//! Sales Customer Aggregate 工具 - sales_customer_aggregate

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct SalesCustomerAggregateTool;

impl Tool for SalesCustomerAggregateTool {
    fn name(&self) -> &str { "sales_customer_aggregate" }
    fn description(&self) -> &str { "销售数据聚合统计：按客户等级/区域/产品分组" }
    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false, supports_cancellation: false,
            requires_permission: true, requires_confirmation: false,
            is_read_only: true, has_side_effects: false,
            supports_retry: false, estimated_duration: None,
        }
    }
    fn parameters(&self) -> Vec<ToolParameter> {
        vec![ToolParameter {
            name: "groupBy".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "分组维度: level/region/product".to_string(), required: true, default: None,
            r#enum: Some(vec!["level".to_string(), "region".to_string(), "product".to_string()]),
            minimum: None, maximum: None, pattern: None, items: None, properties: None,
        }]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("聚合统计结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_tool_name() { assert_eq!(SalesCustomerAggregateTool::default().name(), "sales_customer_aggregate"); }
}
