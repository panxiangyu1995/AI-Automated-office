//! HR 模块数据类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 员工状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum EmployeeStatus {
    /// 正式员工
    Active,
    /// 离职
    Inactive,
    /// 试用期
    Probation,
}

impl Default for EmployeeStatus {
    fn default() -> Self {
        Self::Probation
    }
}

impl std::fmt::Display for EmployeeStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Active => write!(f, "active"),
            Self::Inactive => write!(f, "inactive"),
            Self::Probation => write!(f, "probation"),
        }
    }
}

/// 员工
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Employee {
    /// 员工 ID
    pub id: String,
    /// 工号
    pub employee_code: String,
    /// 姓名
    pub name: String,
    /// 邮箱
    pub email: String,
    /// 手机号
    pub phone: Option<String>,
    /// 所属部门 ID
    pub department_id: String,
    /// 岗位 ID
    pub position_id: String,
    /// 直接主管 ID
    pub manager_id: Option<String>,
    /// 入职日期
    pub hire_date: i64,
    /// 员工状态
    pub status: EmployeeStatus,
    /// 头像 URL
    pub avatar: Option<String>,
    /// 元数据
    pub metadata: HashMap<String, serde_json::Value>,
    /// 创建时间
    pub created_at: i64,
    /// 更新时间
    pub updated_at: i64,
}

impl Default for Employee {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            employee_code: String::new(),
            name: String::new(),
            email: String::new(),
            phone: None,
            department_id: String::new(),
            position_id: String::new(),
            manager_id: None,
            hire_date: now,
            status: EmployeeStatus::Probation,
            avatar: None,
            metadata: HashMap::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

/// 部门
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HrDepartment {
    /// 部门 ID
    pub id: String,
    /// 部门代码
    pub code: String,
    /// 部门名称
    pub name: String,
    /// 上级部门 ID
    pub parent_id: Option<String>,
    /// 部门负责人 ID
    pub manager_id: Option<String>,
    /// 层级
    pub level: i32,
    /// 排序
    pub sort_order: i32,
    /// 子部门
    #[serde(default)]
    pub children: Vec<HrDepartment>,
    /// 创建时间
    pub created_at: i64,
    /// 更新时间
    pub updated_at: i64,
}

impl Default for HrDepartment {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            code: String::new(),
            name: String::new(),
            parent_id: None,
            manager_id: None,
            level: 1,
            sort_order: 0,
            children: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

/// 岗位
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    /// 岗位 ID
    pub id: String,
    /// 岗位代码
    pub code: String,
    /// 岗位名称
    pub name: String,
    /// 职级
    pub level: i32,
    /// 所属部门 ID
    pub department_id: Option<String>,
    /// 权限列表
    pub permissions: Vec<String>,
    /// 创建时间
    pub created_at: i64,
    /// 更新时间
    pub updated_at: i64,
}

impl Default for Position {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            code: String::new(),
            name: String::new(),
            level: 1,
            department_id: None,
            permissions: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

/// 创建员工请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEmployeeRequest {
    /// 工号
    pub employee_code: String,
    /// 姓名
    pub name: String,
    /// 邮箱
    pub email: String,
    /// 手机号
    pub phone: Option<String>,
    /// 所属部门 ID
    pub department_id: String,
    /// 岗位 ID
    pub position_id: String,
    /// 直接主管 ID
    pub manager_id: Option<String>,
    /// 入职日期
    pub hire_date: Option<i64>,
    /// 员工状态
    pub status: Option<EmployeeStatus>,
}

/// 更新员工请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEmployeeRequest {
    /// 姓名
    pub name: Option<String>,
    /// 邮箱
    pub email: Option<String>,
    /// 手机号
    pub phone: Option<String>,
    /// 所属部门 ID
    pub department_id: Option<String>,
    /// 岗位 ID
    pub position_id: Option<String>,
    /// 直接主管 ID
    pub manager_id: Option<String>,
    /// 入职日期
    pub hire_date: Option<i64>,
    /// 员工状态
    pub status: Option<EmployeeStatus>,
}

/// 创建部门请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDepartmentRequest {
    /// 部门代码
    pub code: String,
    /// 部门名称
    pub name: String,
    /// 上级部门 ID
    pub parent_id: Option<String>,
    /// 部门负责人 ID
    pub manager_id: Option<String>,
    /// 排序
    pub sort_order: Option<i32>,
}

/// 更新部门请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDepartmentRequest {
    /// 部门名称
    pub name: Option<String>,
    /// 上级部门 ID
    pub parent_id: Option<String>,
    /// 部门负责人 ID
    pub manager_id: Option<String>,
    /// 排序
    pub sort_order: Option<i32>,
}

/// 创建岗位请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePositionRequest {
    /// 岗位代码
    pub code: String,
    /// 岗位名称
    pub name: String,
    /// 职级
    pub level: Option<i32>,
    /// 所属部门 ID
    pub department_id: Option<String>,
    /// 权限列表
    pub permissions: Option<Vec<String>>,
}

/// 更新岗位请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePositionRequest {
    /// 岗位名称
    pub name: Option<String>,
    /// 职级
    pub level: Option<i32>,
    /// 所属部门 ID
    pub department_id: Option<String>,
    /// 权限列表
    pub permissions: Option<Vec<String>>,
}

/// 员工列表项（精简版）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployeeListItem {
    /// 员工 ID
    pub id: String,
    /// 工号
    pub employee_code: String,
    /// 姓名
    pub name: String,
    /// 邮箱
    pub email: String,
    /// 部门名称
    pub department_name: Option<String>,
    /// 岗位名称
    pub position_name: Option<String>,
    /// 主管姓名
    pub manager_name: Option<String>,
    /// 入职日期
    pub hire_date: i64,
    /// 状态
    pub status: EmployeeStatus,
}

/// 员工详情
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployeeDetail {
    /// 员工信息
    pub employee: Employee,
    /// 部门信息
    pub department: Option<HrDepartment>,
    /// 岗位信息
    pub position: Option<Position>,
    /// 主管信息
    pub manager: Option<Employee>,
    /// 下属列表
    pub subordinates: Vec<EmployeeListItem>,
}

/// 部门树节点
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentTreeNode {
    /// 部门信息
    pub department: HrDepartment,
    /// 直接下属数量
    pub employee_count: usize,
    /// 子部门
    pub children: Vec<DepartmentTreeNode>,
}

/// 岗位列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositionListItem {
    /// 岗位 ID
    pub id: String,
    /// 岗位代码
    pub code: String,
    /// 岗位名称
    pub name: String,
    /// 职级
    pub level: i32,
    /// 部门名称
    pub department_name: Option<String>,
    /// 员工数量
    pub employee_count: usize,
}

/// 员工查询参数
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EmployeeQueryParams {
    /// 搜索关键字
    pub keyword: Option<String>,
    /// 部门 ID
    pub department_id: Option<String>,
    /// 岗位 ID
    pub position_id: Option<String>,
    /// 状态
    pub status: Option<EmployeeStatus>,
    /// 页码
    pub page: Option<i32>,
    /// 每页数量
    pub page_size: Option<i32>,
}

/// 分页结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    /// 数据列表
    pub items: Vec<T>,
    /// 总数
    pub total: i64,
    /// 页码
    pub page: i32,
    /// 每页数量
    pub page_size: i32,
    /// 总页数
    pub total_pages: i32,
}

impl<T> PagedResult<T> {
    pub fn new(items: Vec<T>, total: i64, page: i32, page_size: i32) -> Self {
        let total_pages = if page_size > 0 {
            ((total as f64) / (page_size as f64)).ceil() as i32
        } else {
            0
        };
        Self {
            items,
            total,
            page,
            page_size,
            total_pages,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_employee_status_display() {
        assert_eq!(EmployeeStatus::Active.to_string(), "active");
        assert_eq!(EmployeeStatus::Inactive.to_string(), "inactive");
        assert_eq!(EmployeeStatus::Probation.to_string(), "probation");
    }

    #[test]
    fn test_employee_default() {
        let emp = Employee::default();
        assert!(!emp.id.is_empty());
        assert_eq!(emp.status, EmployeeStatus::Probation);
    }

    #[test]
    fn test_department_default() {
        let dept = HrDepartment::default();
        assert!(!dept.id.is_empty());
        assert_eq!(dept.level, 1);
        assert!(dept.children.is_empty());
    }

    #[test]
    fn test_position_default() {
        let pos = Position::default();
        assert!(!pos.id.is_empty());
        assert_eq!(pos.level, 1);
    }

    #[test]
    fn test_paged_result() {
        let items = vec![1, 2, 3];
        let result = PagedResult::new(items, 10, 1, 3);
        assert_eq!(result.items.len(), 3);
        assert_eq!(result.total, 10);
        assert_eq!(result.total_pages, 4);
    }

    #[test]
    fn test_employee_query_params_default() {
        let params = EmployeeQueryParams::default();
        assert!(params.keyword.is_none());
        assert!(params.department_id.is_none());
    }

    #[test]
    fn test_employee_status_serde_roundtrip() {
        let status = EmployeeStatus::Active;
        let json = serde_json::to_string(&status).unwrap();
        let deserialized: EmployeeStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(status, deserialized);
    }
}
