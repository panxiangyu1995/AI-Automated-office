//! Service Dispatch Action 工具 - service_dispatch_action

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct ServiceDispatchActionTool;

impl Tool for ServiceDispatchActionTool {
    fn name(&self) -> &str { "service_dispatch_action" }
    fn description(&self) -> &str { "售后派单操作：分配/转派/升级/催办" }
    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities { supports_streaming: false, supports_cancellation: false, requires_permission: true, requires_confirmation: true, is_read_only: false, has_side_effects: true, supports_retry: false, estimated_duration: None }
    }
    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter { name: "ticketId".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "工单ID".to_string(), required: true, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None },
            ToolParameter { name: "action".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "操作类型".to_string(), required: true, default: None,
                r#enum: Some(vec!["assign".to_string(), "transfer".to_string(), "escalate".to_string(), "remind".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None },
            ToolParameter { name: "assigneeId".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "处理人ID".to_string(), required: false, default: None,
                r#enum: None, minimum: None, maximum: None, pattern: None, items: None, properties: None },
        ]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("操作结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests { use super::*; #[test] fn test_tool_name() { assert_eq!(ServiceDispatchActionTool::default().name(), "service_dispatch_action"); } }
