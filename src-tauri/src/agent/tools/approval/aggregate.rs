//! Approval Flow Aggregate 工具 - approval_flow_aggregate

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct ApprovalFlowAggregateTool;

impl Tool for ApprovalFlowAggregateTool {
    fn name(&self) -> &str { "approval_flow_aggregate" }
    fn description(&self) -> &str { "审批数据聚合统计：按类型/部门/状态分组" }
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
            name: "groupBy".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "分组维度".to_string(), required: true, default: None,
            r#enum: Some(vec!["type".to_string(), "department".to_string(), "status".to_string()]),
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
    fn test_tool_name() { assert_eq!(ApprovalFlowAggregateTool::default().name(), "approval_flow_aggregate"); }
}
