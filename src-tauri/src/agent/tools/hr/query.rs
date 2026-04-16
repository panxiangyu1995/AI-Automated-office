//! HR Employee Query 工具
//!
//! 员工查询工具，遵循 {plugin}_{entity}_{action} 命名: hr_employee_query

use serde::Deserialize;

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

/// 员工查询参数
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HrEmployeeQueryParams {
    pub employee_id: Option<String>,
    pub department_id: Option<String>,
    pub position_id: Option<String>,
    pub status: Option<String>,
    pub keyword: Option<String>,
    #[serde(default = "default_page")]
    pub page: usize,
    #[serde(default = "default_page_size")]
    pub page_size: usize,
}

fn default_page() -> usize { 1 }
fn default_page_size() -> usize { 20 }

/// 员工查询工具
#[derive(Debug, Clone, Default)]
pub struct HrEmployeeQueryTool;

impl Tool for HrEmployeeQueryTool {
    fn name(&self) -> &str {
        "hr_employee_query"
    }

    fn description(&self) -> &str {
        "查询员工信息，支持按部门、岗位、状态筛选"
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
                name: "employeeId".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "员工ID".to_string(),
                required: false,
                default: None,
                r#enum: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "departmentId".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "部门ID".to_string(),
                required: false,
                default: None,
                r#enum: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "status".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "员工状态".to_string(),
                required: false,
                default: None,
                r#enum: Some(vec![
                    "active".to_string(),
                    "inactive".to_string(),
                    "probation".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "keyword".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "关键词搜索".to_string(),
                required: false,
                default: None,
                r#enum: None,
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
            description: Some("员工查询结果".to_string()),
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
        let tool = HrEmployeeQueryTool::default();
        assert_eq!(tool.name(), "hr_employee_query");
    }

    #[test]
    fn test_tool_is_read_only() {
        let tool = HrEmployeeQueryTool::default();
        assert!(tool.capabilities().is_read_only);
    }

    #[test]
    fn test_tool_requires_permission() {
        let tool = HrEmployeeQueryTool::default();
        assert!(tool.capabilities().requires_permission);
    }
}
