//! HR 模块 Tauri 命令
//!
//! 提供 HR 管理的 IPC 命令接口

use crate::hr::db::HrDatabase;
use crate::hr::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// HR 状态
pub struct HrState {
    pub db: Arc<HrDatabase>,
}

impl HrState {
    pub fn new() -> Self {
        let db = Arc::new(HrDatabase::new());
        db.init_defaults();
        Self { db }
    }
}

impl Default for HrState {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== 员工命令 ====================

/// 创建员工
#[tauri::command]
pub async fn hr_create_employee(
    state: State<'_, HrState>,
    request: CreateEmployeeRequest,
) -> Result<Employee, String> {
    info!("创建员工: {}", request.name);
    state.db.create_employee(request)
}

/// 获取员工列表
#[tauri::command]
pub async fn hr_list_employees(
    state: State<'_, HrState>,
    params: Option<EmployeeQueryParams>,
) -> Result<PagedResult<EmployeeListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_employees(&params))
}

/// 获取员工详情
#[tauri::command]
pub async fn hr_get_employee(
    state: State<'_, HrState>,
    id: String,
) -> Result<EmployeeDetail, String> {
    info!("获取员工详情: {}", id);
    state
        .db
        .get_employee(&id)
        .ok_or_else(|| "员工不存在".to_string())
}

/// 更新员工
#[tauri::command]
pub async fn hr_update_employee(
    state: State<'_, HrState>,
    id: String,
    request: UpdateEmployeeRequest,
) -> Result<Employee, String> {
    info!("更新员工: {}", id);
    state.db.update_employee(&id, request)
}

/// 删除员工
#[tauri::command]
pub async fn hr_delete_employee(
    state: State<'_, HrState>,
    id: String,
) -> Result<(), String> {
    info!("删除员工: {}", id);
    state.db.delete_employee(&id)
}

// ==================== 部门命令 ====================

/// 创建部门
#[tauri::command]
pub async fn hr_create_department(
    state: State<'_, HrState>,
    request: CreateDepartmentRequest,
) -> Result<HrDepartment, String> {
    info!("创建部门: {}", request.name);
    state.db.create_department(request)
}

/// 获取部门树
#[tauri::command]
pub async fn hr_get_department_tree(
    state: State<'_, HrState>,
) -> Result<Vec<DepartmentTreeNode>, String> {
    Ok(state.db.get_department_tree())
}

/// 获取部门详情
#[tauri::command]
pub async fn hr_get_department(
    state: State<'_, HrState>,
    id: String,
) -> Result<HrDepartment, String> {
    info!("获取部门详情: {}", id);
    state
        .db
        .get_department(&id)
        .ok_or_else(|| "部门不存在".to_string())
}

/// 更新部门
#[tauri::command]
pub async fn hr_update_department(
    state: State<'_, HrState>,
    id: String,
    request: UpdateDepartmentRequest,
) -> Result<HrDepartment, String> {
    info!("更新部门: {}", id);
    state.db.update_department(&id, request)
}

/// 删除部门
#[tauri::command]
pub async fn hr_delete_department(
    state: State<'_, HrState>,
    id: String,
) -> Result<(), String> {
    info!("删除部门: {}", id);
    state.db.delete_department(&id)
}

// ==================== 岗位命令 ====================

/// 创建岗位
#[tauri::command]
pub async fn hr_create_position(
    state: State<'_, HrState>,
    request: CreatePositionRequest,
) -> Result<Position, String> {
    info!("创建岗位: {}", request.name);
    state.db.create_position(request)
}

/// 获取岗位列表
#[tauri::command]
pub async fn hr_list_positions(
    state: State<'_, HrState>,
) -> Result<Vec<PositionListItem>, String> {
    Ok(state.db.list_positions())
}

/// 获取岗位详情
#[tauri::command]
pub async fn hr_get_position(
    state: State<'_, HrState>,
    id: String,
) -> Result<Position, String> {
    info!("获取岗位详情: {}", id);
    state
        .db
        .get_position(&id)
        .ok_or_else(|| "岗位不存在".to_string())
}

/// 更新岗位
#[tauri::command]
pub async fn hr_update_position(
    state: State<'_, HrState>,
    id: String,
    request: UpdatePositionRequest,
) -> Result<Position, String> {
    info!("更新岗位: {}", id);
    state.db.update_position(&id, request)
}

/// 删除岗位
#[tauri::command]
pub async fn hr_delete_position(
    state: State<'_, HrState>,
    id: String,
) -> Result<(), String> {
    info!("删除岗位: {}", id);
    state.db.delete_position(&id)
}
