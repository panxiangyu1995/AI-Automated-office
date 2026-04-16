//! Sales Deal Action 工具 - sales_deal_action

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct SalesDealActionTool;

impl Tool for SalesDealActionTool {
    fn name(&self) -> &str { "sales_deal_action" }
    fn description(&self) -> &str { "销售业务操作：创建报价/转合同/签约" }
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
                r#enum: Some(vec!["create_quote".to_string(), "accept_quote".to_string(), "create_contract".to_string(), "sign_contract".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "data".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
                description: "业务数据".to_string(), required: false, default: None,
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
    fn test_tool_name() { assert_eq!(SalesDealActionTool::default().name(), "sales_deal_action"); }
}
