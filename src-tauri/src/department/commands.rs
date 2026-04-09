//! 部门模块 Tauri 命令
//!
//! 提供部门管理的 IPC 命令接口

use crate::department::loader::DepartmentLoader;
use crate::department::message::DepartmentMessageBus;
use crate::department::registry::DepartmentRegistry;
use crate::department::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::{error, info};

/// 部门管理状态
pub struct DepartmentState {
    pub registry: Arc<DepartmentRegistry>,
    pub loader: Arc<DepartmentLoader>,
    pub message_bus: Arc<DepartmentMessageBus>,
}

impl DepartmentState {
    pub fn new() -> Self {
        Self {
            registry: Arc::new(DepartmentRegistry::new()),
            loader: Arc::new(DepartmentLoader::new()),
            message_bus: Arc::new(DepartmentMessageBus::new()),
        }
    }

    /// 初始化默认部门
    pub fn init_defaults(&self) {
        self.registry.register_defaults();
        info!("部门模块默认部门初始化完成");
    }
}

impl Default for DepartmentState {
    fn default() -> Self {
        Self::new()
    }
}

/// 创建部门
#[tauri::command]
pub async fn department_create(
    state: State<'_, DepartmentState>,
    request: CreateDepartmentRequest,
) -> Result<DepartmentPackage, String> {
    info!("创建部门: {:?}", request.code);

    let package = DepartmentPackage {
        id: uuid::Uuid::new_v4().to_string(),
        code: request.code.clone(),
        name: request.name.clone(),
        version: request.version.unwrap_or_else(|| "1.0.0".to_string()),
        description: request.description.unwrap_or_default(),
        dependencies: request.dependencies.unwrap_or_default(),
        capabilities: Vec::new(),
        tools: Vec::new(),
        skills: Vec::new(),
        routes: Vec::new(),
        entry_points: Vec::new(),
        status: DepartmentStatus::Inactive,
        loaded_at: None,
        created_at: chrono::Utc::now().timestamp(),
        updated_at: chrono::Utc::now().timestamp(),
    };

    state
        .registry
        .register(package)
        .map(|id| state.registry.get_by_id(&id).unwrap())
        .map_err(|e| e.1)
}

/// 获取部门列表
#[tauri::command]
pub async fn department_list(
    state: State<'_, DepartmentState>,
) -> Result<Vec<DepartmentListItem>, String> {
    info!("获取部门列表");
    Ok(state.registry.list())
}

/// 获取部门详情
#[tauri::command]
pub async fn department_get(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<DepartmentDetailResponse, String> {
    info!("获取部门详情: {}", id);

    let department = state
        .registry
        .get_by_id(&id)
        .ok_or_else(|| format!("部门 {} 不存在", id))?;

    Ok(DepartmentDetailResponse {
        department: department.clone(),
        capabilities: department.capabilities,
        tools: department.tools,
        skills: department.skills,
        routes: department.routes,
    })
}

/// 更新部门
#[tauri::command]
pub async fn department_update(
    state: State<'_, DepartmentState>,
    id: String,
    request: UpdateDepartmentRequest,
) -> Result<DepartmentPackage, String> {
    info!("更新部门: {}", id);
    state.registry.update(&id, request).map_err(|e| e.1)
}

/// 删除部门
#[tauri::command]
pub async fn department_delete(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<(), String> {
    info!("删除部门: {}", id);
    state.registry.unregister(&id).map_err(|e| e.1)
}

/// 启用部门
#[tauri::command]
pub async fn department_enable(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<DepartmentPackage, String> {
    info!("启用部门: {}", id);

    // 先加载部门
    state
        .loader
        .load(&state.registry, &id)
        .map_err(|e| e.1)?;

    // 更新状态
    state
        .registry
        .update_status(&id, DepartmentStatus::Active)
        .map_err(|e| e.1)?;

    state
        .registry
        .get_by_id(&id)
        .ok_or_else(|| "部门不存在".to_string())
}

/// 禁用部门
#[tauri::command]
pub async fn department_disable(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<DepartmentPackage, String> {
    info!("禁用部门: {}", id);

    // 先卸载部门
    if let Err(e) = state.loader.unload(&state.registry, &id) {
        error!("卸载部门失败: {}", e.1);
    }

    // 更新状态
    state
        .registry
        .update_status(&id, DepartmentStatus::Inactive)
        .map_err(|e| e.1)?;

    state
        .registry
        .get_by_id(&id)
        .ok_or_else(|| "部门不存在".to_string())
}

/// 获取部门能力列表
#[tauri::command]
pub async fn department_capabilities(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<Vec<Capability>, String> {
    info!("获取部门能力: {}", id);

    let department = state
        .registry
        .get_by_id(&id)
        .ok_or_else(|| format!("部门 {} 不存在", id))?;

    Ok(department.capabilities)
}

/// 加载部门
#[tauri::command]
pub async fn department_load(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<DepartmentPackage, String> {
    info!("加载部门: {}", id);
    state.loader.load(&state.registry, &id).map_err(|e| e.1)
}

/// 卸载部门
#[tauri::command]
pub async fn department_unload(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<(), String> {
    info!("卸载部门: {}", id);
    state.loader.unload(&state.registry, &id).map_err(|e| e.1)
}

/// 获取已加载的部门列表
#[tauri::command]
pub async fn department_loaded_list(
    state: State<'_, DepartmentState>,
) -> Result<Vec<DepartmentPackage>, String> {
    Ok(state.loader.get_loaded(&state.registry))
}

/// 获取部门加载状态
#[tauri::command]
pub async fn department_load_state(
    state: State<'_, DepartmentState>,
    id: String,
) -> Result<Option<crate::department::loader::DepartmentLoadState>, String> {
    match state.loader.get_load_state(&id) {
        Some(s) => Ok(Some(s)),
        None => Err("Department not loaded".to_string()),
    }
}

/// 发送部门消息
#[tauri::command]
pub async fn department_send_message(
    state: State<'_, DepartmentState>,
    from: String,
    to: String,
    message_type: String,
    payload: serde_json::Value,
) -> Result<MessageResponse, String> {
    info!("发送部门消息: {} -> {}", from, to);

    let from_code = parse_department_code(&from)?;
    let to_code = parse_department_code(&to)?;
    let msg_type = parse_message_type(&message_type)?;

    let message = DepartmentMessage {
        id: uuid::Uuid::new_v4().to_string(),
        from: from_code,
        to: to_code,
        message_type: msg_type,
        payload,
        correlation_id: None,
        timestamp: chrono::Utc::now().timestamp_millis(),
        status: MessageStatus::Pending,
    };

    state.message_bus.send(message).map_err(|e| e.1)
}

/// 获取消息历史
#[tauri::command]
pub async fn department_message_history(
    state: State<'_, DepartmentState>,
    limit: Option<usize>,
) -> Result<Vec<DepartmentMessage>, String> {
    Ok(state.message_bus.get_history(limit))
}

/// 获取部门消息历史
#[tauri::command]
pub async fn department_message_history_by_department(
    state: State<'_, DepartmentState>,
    department: String,
    limit: Option<usize>,
) -> Result<Vec<DepartmentMessage>, String> {
    let code = parse_department_code(&department)?;
    Ok(state.message_bus.get_history_by_department(&code, limit))
}

/// 获取部门统计信息
#[tauri::command]
pub async fn department_stats(
    state: State<'_, DepartmentState>,
) -> Result<serde_json::Value, String> {
    let total = state.registry.total_count();
    let loaded = state.loader.loaded_count();
    let subscribers = state.message_bus.subscriber_count();

    Ok(serde_json::json!({
        "total": total,
        "loaded": loaded,
        "subscribers": subscribers,
    }))
}

/// 辅助函数：解析部门代码
fn parse_department_code(code: &str) -> Result<DepartmentCode, String> {
    match code.to_lowercase().as_str() {
        "hr" => Ok(DepartmentCode::Hr),
        "approval" => Ok(DepartmentCode::Approval),
        "sales" => Ok(DepartmentCode::Sales),
        "finance" => Ok(DepartmentCode::Finance),
        "warehouse" => Ok(DepartmentCode::Warehouse),
        "management" => Ok(DepartmentCode::Management),
        other => Ok(DepartmentCode::Custom(other.to_string())),
    }
}

/// 辅助函数：解析消息类型
fn parse_message_type(msg_type: &str) -> Result<MessageType, String> {
    match msg_type.to_lowercase().as_str() {
        "data_request" => Ok(MessageType::DataRequest),
        "data_response" => Ok(MessageType::DataResponse),
        "event" => Ok(MessageType::Event),
        "delegate" => Ok(MessageType::Delegate),
        "cross_query" => Ok(MessageType::CrossQuery),
        "status_change" => Ok(MessageType::StatusChange),
        other => Err(format!("未知消息类型: {}", other)),
    }
}
