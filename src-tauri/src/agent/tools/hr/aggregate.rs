//! HR Employee Aggregate 工具
//!
//! 员工聚合统计工具，遵循命名: hr_employee_aggregate

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

/// 员工聚合统计工具
#[derive(Debug, Clone, Default)]
pub struct HrEmployeeAggregateTool;

impl Tool for HrEmployeeAggregateTool {
    fn name(&self) -> &str {
        "hr_employee_aggregate"
    }

    fn description(&self) -> &str {
        "员工数据聚合统计：按部门/岗位/状态分组统计人数"
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
                name: "groupBy".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "分组维度: department/position/status".to_string(),
                required: true,
                default: None,
                r#enum: Some(vec![
                    "department".to_string(),
                    "position".to_string(),
                    "status".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "departmentId".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "限定部门范围".to_string(),
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
            description: Some("聚合统计结果".to_string()),
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
        let tool = HrEmployeeAggregateTool::default();
        assert_eq!(tool.name(), "hr_employee_aggregate");
    }

    #[test]
    fn test_tool_is_read_only() {
        let tool = HrEmployeeAggregateTool::default();
        assert!(tool.capabilities().is_read_only);
    }
}
