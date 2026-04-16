//! HR Report Export 工具
//!
//! HR报表导出工具，遵循命名: hr_report_export

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

/// HR报表导出工具
#[derive(Debug, Clone, Default)]
pub struct HrReportExportTool;

impl Tool for HrReportExportTool {
    fn name(&self) -> &str {
        "hr_report_export"
    }

    fn description(&self) -> &str {
        "导出HR报表：花名册/部门人员/入离职统计"
    }

    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: false,
            estimated_duration: None,
        }
    }

    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "reportType".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "报表类型".to_string(),
                required: true,
                default: None,
                r#enum: Some(vec![
                    "roster".to_string(),
                    "department_headcount".to_string(),
                    "turnover".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "format".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "导出格式".to_string(),
                required: false,
                default: Some(serde_json::json!("xlsx")),
                r#enum: Some(vec![
                    "xlsx".to_string(),
                    "csv".to_string(),
                    "pdf".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
        ]
    }

    fn return_type(&self) -> ToolReturnType {
        ToolReturnType {
            return_type: ToolParameterType::Object,
            description: Some("报表导出结果".to_string()),
            items: None,
            properties: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tool_name() {
        let tool = HrReportExportTool::default();
        assert_eq!(tool.name(), "hr_report_export");
    }

    #[test]
    fn test_tool_is_read_only() {
        let tool = HrReportExportTool::default();
        assert!(tool.capabilities().is_read_only);
    }
}
