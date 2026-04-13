//! Workspace 模块类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ==================== 工作区布局类型 ====================

/// 工作区布局
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceLayout {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub description: Option<String>,
    pub layout: HashMap<String, serde_json::Value>,
    pub is_default: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for WorkspaceLayout {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            user_id: String::new(),
            name: String::new(),
            description: None,
            layout: HashMap::new(),
            is_default: false,
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 日清类型 ====================

/// 日清任务来源模块
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TodoSourceModule {
    Hr,
    Finance,
    Approval,
    Service,
    Sales,
    Warehouse,
    Marketing,
    Tender,
    System,
}

impl Default for TodoSourceModule {
    fn default() -> Self {
        Self::System
    }
}

/// 日清优先级
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TodoPriority {
    Low,
    Medium,
    High,
    Urgent,
}

impl Default for TodoPriority {
    fn default() -> Self {
        Self::Medium
    }
}

/// 日清状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TodoStatus {
    Pending,
    InProgress,
    Completed,
    Cancelled,
}

impl Default for TodoStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// 日清任务
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceTodo {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub source_module: TodoSourceModule,
    pub source_id: String,
    pub priority: TodoPriority,
    pub due_date: Option<String>,
    pub status: TodoStatus,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

impl Default for WorkspaceTodo {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            user_id: String::new(),
            title: String::new(),
            description: None,
            source_module: TodoSourceModule::default(),
            source_id: String::new(),
            priority: TodoPriority::default(),
            due_date: None,
            status: TodoStatus::default(),
            created_at: now,
            completed_at: None,
        }
    }
}

/// 任务聚合
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskAggregation {
    pub module: String,
    pub module_name: String,
    pub task_count: u32,
    pub pending_count: u32,
    pub in_progress_count: u32,
    pub icon: String,
}

// ==================== 请求/响应类型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLayoutRequest {
    pub name: String,
    pub description: Option<String>,
    pub layout: HashMap<String, serde_json::Value>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLayoutRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub layout: Option<HashMap<String, serde_json::Value>>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTodoRequest {
    pub title: String,
    pub description: Option<String>,
    pub source_module: TodoSourceModule,
    pub source_id: String,
    pub priority: Option<TodoPriority>,
    pub due_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTodoRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<TodoPriority>,
    pub due_date: Option<String>,
    pub status: Option<TodoStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryTodosParams {
    pub status: Option<TodoStatus>,
    pub priority: Option<TodoPriority>,
    pub source_module: Option<TodoSourceModule>,
    pub due_date: Option<String>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    pub items: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutListItem {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodoListItem {
    pub id: String,
    pub title: String,
    pub source_module: TodoSourceModule,
    pub priority: TodoPriority,
    pub due_date: Option<String>,
    pub status: TodoStatus,
    pub created_at: i64,
}
