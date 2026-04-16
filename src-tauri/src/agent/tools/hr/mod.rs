//! HR 工具模块
//!
//! 实现 ADR-017 命名规范: {plugin}_{entity}_{action}
//! 实现 ADR-025 每部门最多5个核心工具

pub mod query;
pub mod aggregate;
pub mod mutate;
pub mod action;
pub mod export;
pub mod register;

use serde::{Deserialize, Serialize};

/// HR 角色
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HrRole {
    Staff,
    HrSpecialist,
    HrManager,
    Executive,
}

impl Default for HrRole {
    fn default() -> Self {
        HrRole::Staff
    }
}

impl std::fmt::Display for HrRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HrRole::Staff => write!(f, "staff"),
            HrRole::HrSpecialist => write!(f, "hr_specialist"),
            HrRole::HrManager => write!(f, "hr_manager"),
            HrRole::Executive => write!(f, "executive"),
        }
    }
}

/// HR 工具枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HrTool {
    EmployeeQuery,
    EmployeeAggregate,
    EmployeeMutate,
    DepartmentAction,
    ReportExport,
}

impl std::fmt::Display for HrTool {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HrTool::EmployeeQuery => write!(f, "hr_employee_query"),
            HrTool::EmployeeAggregate => write!(f, "hr_employee_aggregate"),
            HrTool::EmployeeMutate => write!(f, "hr_employee_mutate"),
            HrTool::DepartmentAction => write!(f, "hr_department_action"),
            HrTool::ReportExport => write!(f, "hr_report_export"),
        }
    }
}
