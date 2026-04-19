//! HR 模块 Tauri 命令
//!
//! 提供 HR 管理的 IPC 命令接口

use crate::auth::{AuthService, verify_and_check, Permission};
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

/// 创建员工 (Write)
#[tauri::command]
pub async fn hr_create_employee(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateEmployeeRequest,
) -> Result<Employee, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建员工: {}", request.name);
    state.db.create_employee(request)
}

/// 获取员工列表 (Read)
#[tauri::command]
pub async fn hr_list_employees(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    params: Option<EmployeeQueryParams>,
) -> Result<PagedResult<EmployeeListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    let params = params.unwrap_or_default();
    Ok(state.db.list_employees(&params))
}

/// 获取员工详情 (Read)
#[tauri::command]
pub async fn hr_get_employee(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<EmployeeDetail, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    info!("获取员工详情: {}", id);
    state
        .db
        .get_employee(&id)
        .ok_or_else(|| "员工不存在".to_string())
}

/// 更新员工 (Write)
#[tauri::command]
pub async fn hr_update_employee(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    request: UpdateEmployeeRequest,
) -> Result<Employee, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("更新员工: {}", id);
    state.db.update_employee(&id, request)
}

/// 删除员工 (Admin)
#[tauri::command]
pub async fn hr_delete_employee(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    info!("删除员工: {}", id);
    state.db.delete_employee(&id)
}

// ==================== 部门命令 ====================

/// 创建部门 (Write)
#[tauri::command]
pub async fn hr_create_department(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateDepartmentRequest,
) -> Result<HrDepartment, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建部门: {}", request.name);
    state.db.create_department(request)
}

/// 获取部门树 (Read)
#[tauri::command]
pub async fn hr_get_department_tree(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<DepartmentTreeNode>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.get_department_tree())
}

/// 获取部门详情 (Read)
#[tauri::command]
pub async fn hr_get_department(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<HrDepartment, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    info!("获取部门详情: {}", id);
    state
        .db
        .get_department(&id)
        .ok_or_else(|| "部门不存在".to_string())
}

/// 更新部门 (Write)
#[tauri::command]
pub async fn hr_update_department(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    request: UpdateDepartmentRequest,
) -> Result<HrDepartment, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("更新部门: {}", id);
    state.db.update_department(&id, request)
}

/// 删除部门 (Admin)
#[tauri::command]
pub async fn hr_delete_department(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    info!("删除部门: {}", id);
    state.db.delete_department(&id)
}

// ==================== 岗位命令 ====================

/// 创建岗位 (Write)
#[tauri::command]
pub async fn hr_create_position(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreatePositionRequest,
) -> Result<Position, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建岗位: {}", request.name);
    state.db.create_position(request)
}

/// 获取岗位列表 (Read)
#[tauri::command]
pub async fn hr_list_positions(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<PositionListItem>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_positions())
}

/// 获取岗位详情 (Read)
#[tauri::command]
pub async fn hr_get_position(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<Position, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    info!("获取岗位详情: {}", id);
    state
        .db
        .get_position(&id)
        .ok_or_else(|| "岗位不存在".to_string())
}

/// 更新岗位 (Write)
#[tauri::command]
pub async fn hr_update_position(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
    request: UpdatePositionRequest,
) -> Result<Position, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("更新岗位: {}", id);
    state.db.update_position(&id, request)
}

/// 删除岗位 (Admin)
#[tauri::command]
pub async fn hr_delete_position(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    info!("删除岗位: {}", id);
    state.db.delete_position(&id)
}

// ==================== 批量操作命令 ====================

/// 批量创建员工 (Write)
#[tauri::command]
pub async fn hr_batch_create_employees(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    requests: Vec<CreateEmployeeRequest>,
) -> Result<BatchOperationResult<Employee>, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    let total = requests.len();
    info!("批量创建员工: {}条", total);
    
    let mut results = Vec::with_capacity(total);
    let mut success_count = 0;
    let mut fail_count = 0;
    
    for request in requests {
        match state.db.create_employee(request) {
            Ok(employee) => {
                success_count += 1;
                results.push(Ok(employee));
            }
            Err(e) => {
                fail_count += 1;
                results.push(Err(e));
            }
        }
    }
    
    Ok(BatchOperationResult {
        total,
        success_count,
        fail_count,
        results,
    })
}

/// 批量更新员工 (Write)
#[tauri::command]
pub async fn hr_batch_update_employees(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    updates: Vec<BatchUpdateItem>,
) -> Result<BatchOperationResult<Employee>, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    let total = updates.len();
    info!("批量更新员工: {}条", total);
    
    let mut results = Vec::with_capacity(total);
    let mut success_count = 0;
    let mut fail_count = 0;
    
    for update in updates {
        match state.db.update_employee(&update.id, update.data) {
            Ok(employee) => {
                success_count += 1;
                results.push(Ok(employee));
            }
            Err(e) => {
                fail_count += 1;
                results.push(Err(e));
            }
        }
    }
    
    Ok(BatchOperationResult {
        total,
        success_count,
        fail_count,
        results,
    })
}

/// 批量删除员工 (Admin)
#[tauri::command]
pub async fn hr_batch_delete_employees(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    ids: Vec<String>,
) -> Result<BatchDeleteResult, String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    let total = ids.len();
    info!("批量删除员工: {}条", total);
    
    let mut success_count = 0;
    let mut fail_count = 0;
    let mut failed_ids = Vec::new();
    
    for id in ids {
        match state.db.delete_employee(&id) {
            Ok(()) => {
                success_count += 1;
            }
            Err(_) => {
                fail_count += 1;
                failed_ids.push(id);
            }
        }
    }
    
    Ok(BatchDeleteResult {
        total,
        success_count,
        fail_count,
        failed_ids,
    })
}

/// 批量创建部门 (Write)
#[tauri::command]
pub async fn hr_batch_create_departments(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    requests: Vec<CreateDepartmentRequest>,
) -> Result<BatchOperationResult<HrDepartment>, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    let total = requests.len();
    info!("批量创建部门: {}条", total);
    
    let mut results = Vec::with_capacity(total);
    let mut success_count = 0;
    let mut fail_count = 0;
    
    for request in requests {
        match state.db.create_department(request) {
            Ok(dept) => {
                success_count += 1;
                results.push(Ok(dept));
            }
            Err(e) => {
                fail_count += 1;
                results.push(Err(e));
            }
        }
    }
    
    Ok(BatchOperationResult {
        total,
        success_count,
        fail_count,
        results,
    })
}

/// 批量创建岗位 (Write)
#[tauri::command]
pub async fn hr_batch_create_positions(
    state: State<'_, HrState>,
    auth_service: State<'_, AuthService>,
    token: String,
    requests: Vec<CreatePositionRequest>,
) -> Result<BatchOperationResult<Position>, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    let total = requests.len();
    info!("批量创建岗位: {}条", total);
    
    let mut results = Vec::with_capacity(total);
    let mut success_count = 0;
    let mut fail_count = 0;
    
    for request in requests {
        match state.db.create_position(request) {
            Ok(position) => {
                success_count += 1;
                results.push(Ok(position));
            }
            Err(e) => {
                fail_count += 1;
                results.push(Err(e));
            }
        }
    }
    
    Ok(BatchOperationResult {
        total,
        success_count,
        fail_count,
        results,
    })
}
