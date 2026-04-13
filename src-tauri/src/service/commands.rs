//! Service 模块 Tauri 命令
//!
//! 提供售后管理的 IPC 命令接口

use crate::service::db::ServiceDatabase;
use crate::service::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// Service 状态
pub struct ServiceState {
    pub db: Arc<ServiceDatabase>,
}

impl ServiceState {
    pub fn new() -> Self {
        let db = Arc::new(ServiceDatabase::new());
        db.init_defaults();
        Self { db }
    }
}

impl Default for ServiceState {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== 工单命令 ====================

/// 创建工单
#[tauri::command]
pub async fn service_create_ticket(
    state: State<'_, ServiceState>,
    request: CreateTicketRequest,
    tenant_id: Option<String>,
) -> Result<ServiceTicket, String> {
    info!("创建工单: {}", request.title);
    
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    
    let ticket = ServiceTicket::new(
        request.title,
        request.description,
        request.ticket_type,
        request.priority,
        request.customer_name,
        request.customer_contact,
        request.customer_email,
        tenant_id,
    );
    
    state.db.create_ticket(ticket).map_err(|e| e.message)
}

/// 获取工单
#[tauri::command]
pub async fn service_get_ticket(
    state: State<'_, ServiceState>,
    id: String,
) -> Result<ServiceTicket, String> {
    info!("获取工单: {}", id);
    state
        .db
        .get_ticket(&id)
        .ok_or_else(|| "工单不存在".to_string())
}

/// 查询工单列表
#[tauri::command]
pub async fn service_list_tickets(
    state: State<'_, ServiceState>,
    params: Option<QueryTicketsParams>,
) -> Result<PagedResult<TicketListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_tickets(&params))
}

/// 更新工单
#[tauri::command]
pub async fn service_update_ticket(
    state: State<'_, ServiceState>,
    id: String,
    request: UpdateTicketRequest,
) -> Result<ServiceTicket, String> {
    info!("更新工单: {}", id);
    state.db.update_ticket(&id, request).map_err(|e| e.message)
}

/// 删除工单
#[tauri::command]
pub async fn service_delete_ticket(
    state: State<'_, ServiceState>,
    id: String,
) -> Result<(), String> {
    info!("删除工单: {}", id);
    state.db.delete_ticket(&id).map_err(|e| e.message)
}

/// 更新工单状态
#[tauri::command]
pub async fn service_update_ticket_status(
    state: State<'_, ServiceState>,
    id: String,
    request: UpdateTicketStatusRequest,
) -> Result<ServiceTicket, String> {
    info!("更新工单状态: {} -> {:?}", id, request.status);
    state.db.update_ticket_status(&id, request.status).map_err(|e| e.message)
}

/// 分配工单
#[tauri::command]
pub async fn service_assign_ticket(
    state: State<'_, ServiceState>,
    id: String,
    request: AssignTicketRequest,
) -> Result<ServiceTicket, String> {
    info!("分配工单: {} -> {}", id, request.assigned_name);
    state.db.assign_ticket(&id, request.assigned_to, request.assigned_name).map_err(|e| e.message)
}

// ==================== 服务人员命令 ====================

/// 创建服务人员
#[tauri::command]
pub async fn service_create_personnel(
    state: State<'_, ServiceState>,
    user_id: String,
    user_name: String,
    tenant_id: Option<String>,
) -> Result<ServicePersonnel, String> {
    info!("创建服务人员: {}", user_name);
    
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    
    let personnel = ServicePersonnel::new(user_id, user_name, tenant_id);
    state.db.create_personnel(personnel).map_err(|e| e.message)
}

/// 获取服务人员
#[tauri::command]
pub async fn service_get_personnel(
    state: State<'_, ServiceState>,
    id: String,
) -> Result<ServicePersonnel, String> {
    info!("获取服务人员: {}", id);
    state
        .db
        .get_personnel(&id)
        .ok_or_else(|| "服务人员不存在".to_string())
}

/// 查询服务人员列表
#[tauri::command]
pub async fn service_list_personnel(
    state: State<'_, ServiceState>,
    params: Option<QueryPersonnelParams>,
) -> Result<PagedResult<PersonnelListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_personnel(&params))
}

/// 更新服务人员
#[tauri::command]
pub async fn service_update_personnel(
    state: State<'_, ServiceState>,
    id: String,
    request: UpdatePersonnelRequest,
) -> Result<ServicePersonnel, String> {
    info!("更新服务人员: {}", id);
    state.db.update_personnel(&id, request).map_err(|e| e.message)
}

/// 更新服务人员状态
#[tauri::command]
pub async fn service_update_personnel_status(
    state: State<'_, ServiceState>,
    id: String,
    request: UpdatePersonnelStatusRequest,
) -> Result<ServicePersonnel, String> {
    info!("更新服务人员状态: {} -> {:?}", id, request.status);
    state.db.update_personnel_status(&id, request.status).map_err(|e| e.message)
}

/// 删除服务人员
#[tauri::command]
pub async fn service_delete_personnel(
    state: State<'_, ServiceState>,
    id: String,
) -> Result<(), String> {
    info!("删除服务人员: {}", id);
    state.db.delete_personnel(&id).map_err(|e| e.message)
}

/// 获取可用的服务人员（用于工单分配）
#[tauri::command]
pub async fn service_get_available_personnel(
    state: State<'_, ServiceState>,
) -> Result<Vec<PersonnelListItem>, String> {
    let params = QueryPersonnelParams {
        status: Some(PersonnelStatus::Available),
        ..Default::default()
    };
    let result = state.db.list_personnel(&params);
    Ok(result.items)
}
