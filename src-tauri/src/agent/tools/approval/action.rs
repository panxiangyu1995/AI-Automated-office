//! Approval Task Action 工具 - approval_task_action

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct ApprovalTaskActionTool;

impl Tool for ApprovalTaskActionTool {
    fn name(&self) -> &str { "approval_task_action" }
    fn description(&self) -> &str { "审批任务操作：批准/拒绝/转审/加签" }
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
                name: "taskId".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "审批任务ID".to_string(), required: true, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "action".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "操作类型".to_string(), required: true, default: None,
                r#enum: Some(vec!["approve".to_string(), "reject".to_string(), "transfer".to_string(), "add_signer".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "comment".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "审批意见".to_string(), required: false, default: None,
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
    fn test_tool_name() { assert_eq!(ApprovalTaskActionTool::default().name(), "approval_task_action"); }
}
