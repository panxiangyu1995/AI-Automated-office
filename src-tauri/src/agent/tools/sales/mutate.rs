//! Sales Customer Mutate 工具 - sales_customer_mutate

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct SalesCustomerMutateTool;

impl Tool for SalesCustomerMutateTool {
    fn name(&self) -> &str { "sales_customer_mutate" }
    fn description(&self) -> &str { "客户信息变更：创建/更新/删除客户" }
    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false, supports_cancellation: false,
            requires_permission: true, requires_confirmation: true,
            is_read_only: false, has_side_effects: true,
            supports_retry: false, estimated_duration: None,
        }
    }
    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "action".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "操作类型".to_string(), required: true, default: None,
                r#enum: Some(vec!["create".to_string(), "update".to_string(), "delete".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "data".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
                description: "客户数据".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
        ]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("操作结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_tool_name() { assert_eq!(SalesCustomerMutateTool::default().name(), "sales_customer_mutate"); }
    #[test]
    fn test_has_side_effects() { assert!(SalesCustomerMutateTool::default().capabilities().has_side_effects); }
}
