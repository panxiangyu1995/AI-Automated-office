//! Approval Flow Query 工具 - approval_flow_query

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct ApprovalFlowQueryTool;

impl Tool for ApprovalFlowQueryTool {
    fn name(&self) -> &str { "approval_flow_query" }
    fn description(&self) -> &str { "查询审批流程/任务/记录" }
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
                name: "flowId".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "审批流ID".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "status".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "审批状态".to_string(), required: false, default: None,
                r#enum: Some(vec!["pending".to_string(), "approved".to_string(), "rejected".to_string(), "cancelled".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "applicantId".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "申请人ID".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
        ]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("审批查询结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_tool_name() { assert_eq!(ApprovalFlowQueryTool::default().name(), "approval_flow_query"); }
}
