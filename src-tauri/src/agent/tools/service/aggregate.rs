//! Service Ticket Aggregate 工具 - service_ticket_aggregate

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct ServiceTicketAggregateTool;

impl Tool for ServiceTicketAggregateTool {
    fn name(&self) -> &str { "service_ticket_aggregate" }
    fn description(&self) -> &str { "售后数据聚合统计：按类型/优先级/处理人分组" }
    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities { supports_streaming: false, supports_cancellation: false, requires_permission: true, requires_confirmation: false, is_read_only: true, has_side_effects: false, supports_retry: false, estimated_duration: None }
    }
    fn parameters(&self) -> Vec<ToolParameter> {
        vec![ToolParameter { name: "groupBy".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "分组维度".to_string(), required: true, default: None,
            r#enum: Some(vec!["type".to_string(), "priority".to_string(), "assignee".to_string()]),
            minimum: None, maximum: None, pattern: None, items: None, properties: None }]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("聚合统计结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests { use super::*; #[test] fn test_tool_name() { assert_eq!(ServiceTicketAggregateTool::default().name(), "service_ticket_aggregate"); } }
