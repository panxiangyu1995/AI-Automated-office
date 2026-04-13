//! Workspace 模块 Tauri 命令

use crate::workspace::db::WorkspaceDatabase;
use crate::workspace::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// Workspace 状态
pub struct WorkspaceState {
    pub db: Arc<WorkspaceDatabase>,
}

impl WorkspaceState {
    pub fn new() -> Self {
        let db = Arc::new(WorkspaceDatabase::new());
        db.init_defaults();
        Self { db }
    }
}

impl Default for WorkspaceState {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== 布局命令 ====================

#[tauri::command]
pub async fn workspace_create_layout(
    state: State<'_, WorkspaceState>,
    request: CreateLayoutRequest,
    user_id: Option<String>,
) -> Result<WorkspaceLayout, String> {
    info!("创建工作区布局: {}", request.name);
    let user_id = user_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let layout = WorkspaceLayout {
        id: uuid::Uuid::new_v4().to_string(),
        user_id,
        name: request.name,
        description: request.description,
        layout: request.layout,
        is_default: request.is_default.unwrap_or(false),
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_layout(layout)
}

#[tauri::command]
pub async fn workspace_get_layout(
    state: State<'_, WorkspaceState>,
    id: String,
) -> Result<WorkspaceLayout, String> {
    info!("获取工作区布局: {}", id);
    state.db.get_layout(&id).ok_or_else(|| "布局不存在".to_string())
}

#[tauri::command]
pub async fn workspace_list_layouts(
    state: State<'_, WorkspaceState>,
    user_id: Option<String>,
) -> Result<Vec<LayoutListItem>, String> {
    let user_id = user_id.unwrap_or_else(|| "default".to_string());
    Ok(state.db.list_layouts(&user_id))
}

#[tauri::command]
pub async fn workspace_update_layout(
    state: State<'_, WorkspaceState>,
    id: String,
    request: UpdateLayoutRequest,
) -> Result<WorkspaceLayout, String> {
    info!("更新工作区布局: {}", id);
    state.db.update_layout(&id, request)
}

#[tauri::command]
pub async fn workspace_delete_layout(
    state: State<'_, WorkspaceState>,
    id: String,
) -> Result<(), String> {
    info!("删除工作区布局: {}", id);
    state.db.delete_layout(&id)
}

// ==================== 日清任务命令 ====================

#[tauri::command]
pub async fn workspace_create_todo(
    state: State<'_, WorkspaceState>,
    request: CreateTodoRequest,
    user_id: Option<String>,
) -> Result<WorkspaceTodo, String> {
    info!("创建日清任务: {}", request.title);
    let user_id = user_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let todo = WorkspaceTodo {
        id: uuid::Uuid::new_v4().to_string(),
        user_id,
        title: request.title,
        description: request.description,
        source_module: request.source_module,
        source_id: request.source_id,
        priority: request.priority.unwrap_or(TodoPriority::Medium),
        due_date: request.due_date,
        status: TodoStatus::Pending,
        created_at: now,
        completed_at: None,
    };
    
    state.db.create_todo(todo)
}

#[tauri::command]
pub async fn workspace_get_todo(
    state: State<'_, WorkspaceState>,
    id: String,
) -> Result<WorkspaceTodo, String> {
    info!("获取日清任务: {}", id);
    state.db.get_todo(&id).ok_or_else(|| "任务不存在".to_string())
}

#[tauri::command]
pub async fn workspace_list_todos(
    state: State<'_, WorkspaceState>,
    params: Option<QueryTodosParams>,
    user_id: Option<String>,
) -> Result<PagedResult<TodoListItem>, String> {
    let user_id = user_id.unwrap_or_else(|| "default".to_string());
    let params = params.unwrap_or_default();
    Ok(state.db.list_todos(&user_id, &params))
}

#[tauri::command]
pub async fn workspace_update_todo(
    state: State<'_, WorkspaceState>,
    id: String,
    request: UpdateTodoRequest,
) -> Result<WorkspaceTodo, String> {
    info!("更新日清任务: {}", id);
    state.db.update_todo(&id, request)
}

#[tauri::command]
pub async fn workspace_delete_todo(
    state: State<'_, WorkspaceState>,
    id: String,
) -> Result<(), String> {
    info!("删除日清任务: {}", id);
    state.db.delete_todo(&id)
}

#[tauri::command]
pub async fn workspace_get_task_aggregations(
    state: State<'_, WorkspaceState>,
    user_id: Option<String>,
) -> Result<Vec<TaskAggregation>, String> {
    let user_id = user_id.unwrap_or_else(|| "default".to_string());
    Ok(state.db.get_task_aggregations(&user_id))
}
