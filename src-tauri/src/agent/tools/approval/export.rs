//! Approval Report Export 工具 - approval_report_export

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct ApprovalReportExportTool;

impl Tool for ApprovalReportExportTool {
    fn name(&self) -> &str { "approval_report_export" }
    fn description(&self) -> &str { "导出审批报表：审批统计/效率分析" }
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
                name: "reportType".to_string(), param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "报表类型".to_string(), required: true, default: None,
                r#enum: Some(vec!["statistics".to_string(), "efficiency".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
        ]
    }
    fn return_type(&self) -> ToolReturnType {
        ToolReturnType { return_type: ToolParameterType::Object, description: Some("报表导出结果".to_string()), items: None, properties: None }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_tool_name() { assert_eq!(ApprovalReportExportTool::default().name(), "approval_report_export"); }
}
