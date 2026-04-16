//! Sales Customer Query 工具 - sales_customer_query

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct SalesCustomerQueryTool;

impl Tool for SalesCustomerQueryTool {
    fn name(&self) -> &str { "sales_customer_query" }
    fn description(&self) -> &str { "查询客户/报价/合同信息" }
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
            ToolParameter {
                name: "customerId".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "客户ID".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "type".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "查询类型".to_string(), required: false, default: None,
                r#enum: Some(vec!["customer".to_string(), "quote".to_string(), "contract".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "keyword".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "关键词搜索".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
        ]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("查询结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_tool_name() { assert_eq!(SalesCustomerQueryTool::default().name(), "sales_customer_query"); }
    #[test]
    fn test_is_read_only() { assert!(SalesCustomerQueryTool::default().capabilities().is_read_only); }
}
