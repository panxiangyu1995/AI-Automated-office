//! Sales Report Export 工具 - sales_report_export

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

#[derive(Debug, Clone, Default)]
pub struct SalesReportExportTool;

impl Tool for SalesReportExportTool {
    fn name(&self) -> &str { "sales_report_export" }
    fn description(&self) -> &str { "导出销售报表：业绩/漏斗/客户分析" }
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
                name: "reportType".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "报表类型".to_string(), required: true, default: None,
                r#enum: Some(vec!["performance".to_string(), "funnel".to_string(), "customer_analysis".to_string()]),
                minimum: None, maximum: None, pattern: None, items: None, properties: None,
            },
            ToolParameter {
                name: "format".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "导出格式".to_string(), required: false,
                default: Some(serde_json::json!("xlsx")),
                r#enum: Some(vec!["xlsx".to_string(), "csv".to_string(), "pdf".to_string()]),
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
    fn test_tool_name() { assert_eq!(SalesReportExportTool::default().name(), "sales_report_export"); }
}
