//! HR Department Action 工具
//!
//! 部门操作工具，遵循命名: hr_department_action

use crate::agent::tools::descriptor::{
    Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType,
};

/// 部门操作工具
#[derive(Debug, Clone, Default)]
pub struct HrDepartmentActionTool;

impl Tool for HrDepartmentActionTool {
    fn name(&self) -> &str {
        "hr_department_action"
    }

    fn description(&self) -> &str {
        "部门操作：创建/更新/删除部门，管理岗位"
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
                    "create_department".to_string(),
                    "update_department".to_string(),
                    "delete_department".to_string(),
                    "create_position".to_string(),
                    "update_position".to_string(),
                    "delete_position".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "data".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
                description: "部门/岗位数据".to_string(),
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
        let tool = HrDepartmentActionTool::default();
        assert_eq!(tool.name(), "hr_department_action");
    }

    #[test]
    fn test_tool_has_side_effects() {
        let tool = HrDepartmentActionTool::default();
        assert!(tool.capabilities().has_side_effects);
    }
}
