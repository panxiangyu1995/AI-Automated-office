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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Hash)]
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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
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

// ==================== 自定义字段类型 ====================

/// 自定义字段数据类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Hash)]
#[serde(rename_all = "snake_case")]
pub enum CustomFieldType {
    Text,
    Number,
    Boolean,
    Date,
    Select,
    MultiSelect,
    RichText,
    File,
    Reference,
}

impl Default for CustomFieldType {
    fn default() -> Self {
        Self::Text
    }
}

/// 自定义字段定义（Schema）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomFieldDefinition {
    pub id: String,
    pub name: String,
    pub label: String,
    pub field_type: CustomFieldType,
    pub module: String,
    pub required: bool,
    pub default_value: Option<serde_json::Value>,
    pub options: Option<Vec<SelectOption>>,
    pub validation: Option<FieldValidation>,
    pub ai_hint: Option<String>,
    pub sort_order: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Select 选项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectOption {
    pub value: String,
    pub label: String,
    pub color: Option<String>,
}

/// 字段验证规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldValidation {
    pub min_length: Option<i32>,
    pub max_length: Option<i32>,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub pattern: Option<String>,
    pub custom_validator: Option<String>,
}

/// 自定义字段值
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomFieldValue {
    pub field_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub value: serde_json::Value,
    pub updated_at: i64,
}

/// 创建自定义字段请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomFieldRequest {
    pub name: String,
    pub label: String,
    pub field_type: CustomFieldType,
    pub module: String,
    pub required: Option<bool>,
    pub default_value: Option<serde_json::Value>,
    pub options: Option<Vec<SelectOption>>,
    pub validation: Option<FieldValidation>,
    pub ai_hint: Option<String>,
}

/// 字段验证结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
}
