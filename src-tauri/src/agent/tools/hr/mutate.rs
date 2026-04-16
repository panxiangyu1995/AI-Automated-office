//! HR Employee Mutate 工具
//!
//! 员工变更工具，遵循命名: hr_employee_mutate

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

/// 员工变更工具
#[derive(Debug, Clone, Default)]
pub struct HrEmployeeMutateTool;

impl Tool for HrEmployeeMutateTool {
    fn name(&self) -> &str {
        "hr_employee_mutate"
    }

    fn description(&self) -> &str {
        "员工信息变更：创建/更新/删除/调岗/离职"
    }

    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: true,
            is_read_only: false,
            has_side_effects: true,
            supports_retry: false,
            estimated_duration: None,
        }
    }

    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "action".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "操作类型".to_string(),
                required: true,
                default: None,
                r#enum: Some(vec![
                    "create".to_string(),
                    "update".to_string(),
                    "delete".to_string(),
                    "transfer".to_string(),
                    "resign".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "employeeId".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "员工ID (update/delete/transfer/resign时必填)".to_string(),
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
                name: "data".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
                description: "员工数据".to_string(),
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
            description: Some("操作结果".to_string()),
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
        let tool = HrEmployeeMutateTool::default();
        assert_eq!(tool.name(), "hr_employee_mutate");
    }

    #[test]
    fn test_tool_has_side_effects() {
        let tool = HrEmployeeMutateTool::default();
        assert!(tool.capabilities().has_side_effects);
        assert!(tool.capabilities().requires_confirmation);
    }
}
