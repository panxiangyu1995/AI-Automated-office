//! Workspace 模块数据库操作

use crate::workspace::types::*;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tracing::info;

/// Workspace 数据库状态
pub struct WorkspaceDatabase {
    layouts: RwLock<HashMap<String, WorkspaceLayout>>,
    todos: RwLock<HashMap<String, WorkspaceTodo>>,
}

impl WorkspaceDatabase {
    pub fn new() -> Self {
        info!("初始化 Workspace 数据库");
        Self {
            layouts: RwLock::new(HashMap::new()),
            todos: RwLock::new(HashMap::new()),
        }
    }

    pub fn init_defaults(&self) {
        info!("Workspace 数据库初始化完成");
    }

    // ==================== 布局操作 ====================

    pub fn create_layout(&self, layout: WorkspaceLayout) -> Result<WorkspaceLayout, String> {
        let mut layouts = self.layouts.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = layout.id.clone();
        layouts.insert(id.clone(), layout.clone());
        info!("创建布局成功: {}", layout.name);
        Ok(layout)
    }

    pub fn get_layout(&self, id: &str) -> Option<WorkspaceLayout> {
        self.layouts.read().ok()?.get(id).cloned()
    }

    pub fn list_layouts(&self, user_id: &str) -> Vec<LayoutListItem> {
        let layouts = self.layouts.read().unwrap_or_else(|e| e.into_inner());
        layouts
            .values()
            .filter(|l| l.user_id == user_id)
            .map(|l| LayoutListItem {
                id: l.id.clone(),
                name: l.name.clone(),
                description: l.description.clone(),
                is_default: l.is_default,
            })
            .collect()
    }

    pub fn update_layout(&self, id: &str, request: UpdateLayoutRequest) -> Result<WorkspaceLayout, String> {
        let mut layouts = self.layouts.write().map_err(|_| "获取写入锁失败".to_string())?;
        let layout = layouts.get_mut(id).ok_or("布局不存在")?;
        
        if let Some(name) = request.name { layout.name = name; }
        if let Some(desc) = request.description { layout.description = Some(desc); }
        if let Some(layout_data) = request.layout { layout.layout = layout_data; }
        if let Some(is_default) = request.is_default { layout.is_default = is_default; }
        layout.updated_at = chrono::Utc::now().timestamp();
        
        info!("更新布局成功: {}", id);
        Ok(layout.clone())
    }

    pub fn delete_layout(&self, id: &str) -> Result<(), String> {
        let mut layouts = self.layouts.write().map_err(|_| "获取写入锁失败".to_string())?;
        if layouts.remove(id).is_none() {
            return Err("布局不存在".to_string());
        }
        info!("删除布局成功: {}", id);
        Ok(())
    }

    // ==================== 日清任务操作 ====================

    pub fn create_todo(&self, todo: WorkspaceTodo) -> Result<WorkspaceTodo, String> {
        let mut todos = self.todos.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = todo.id.clone();
        todos.insert(id.clone(), todo.clone());
        info!("创建日清任务成功: {}", todo.title);
        Ok(todo)
    }

    pub fn get_todo(&self, id: &str) -> Option<WorkspaceTodo> {
        self.todos.read().ok()?.get(id).cloned()
    }

    pub fn list_todos(&self, user_id: &str, params: &QueryTodosParams) -> PagedResult<TodoListItem> {
        let todos = self.todos.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<TodoListItem> = todos
            .values()
            .filter(|t| t.user_id == user_id)
            .filter(|t| {
                if let Some(ref status) = params.status {
                    if &t.status != status { return false; }
                }
                if let Some(ref priority) = params.priority {
                    if &t.priority != priority { return false; }
                }
                if let Some(ref module) = params.source_module {
                    if &t.source_module != module { return false; }
                }
                if let Some(ref due) = params.due_date {
                    if &t.due_date.as_ref() != Some(due) { return false; }
                }
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !t.title.to_lowercase().contains(&search_lower) { return false; }
                }
                true
            })
            .map(|t| TodoListItem {
                id: t.id.clone(),
                title: t.title.clone(),
                source_module: t.source_module,
                priority: t.priority,
                due_date: t.due_date.clone(),
                status: t.status,
                created_at: t.created_at,
            })
            .collect();

        items.sort_by(|a, b| {
            let priority_order = |p: &TodoPriority| match p {
                TodoPriority::Urgent => 0,
                TodoPriority::High => 1,
                TodoPriority::Medium => 2,
                TodoPriority::Low => 3,
            };
            priority_order(&a.priority).cmp(&priority_order(&b.priority))
                .then(b.created_at.cmp(&a.created_at))
        });

        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let total = items.len() as u32;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(items.len());
        let page_items = if start < items.len() { items[start..end].to_vec() } else { Vec::new() };

        PagedResult { items: page_items, total, page, page_size }
    }

    pub fn update_todo(&self, id: &str, request: UpdateTodoRequest) -> Result<WorkspaceTodo, String> {
        let mut todos = self.todos.write().map_err(|_| "获取写入锁失败".to_string())?;
        let todo = todos.get_mut(id).ok_or("任务不存在")?;
        
        if let Some(title) = request.title { todo.title = title; }
        if let Some(desc) = request.description { todo.description = Some(desc); }
        if let Some(priority) = request.priority { todo.priority = priority; }
        if let Some(due_date) = request.due_date { todo.due_date = Some(due_date); }
        if let Some(status) = request.status {
            todo.status = status;
            if status == TodoStatus::Completed {
                todo.completed_at = Some(chrono::Utc::now().timestamp());
            }
        }
        
        info!("更新日清任务成功: {}", id);
        Ok(todo.clone())
    }

    pub fn delete_todo(&self, id: &str) -> Result<(), String> {
        let mut todos = self.todos.write().map_err(|_| "获取写入锁失败".to_string())?;
        if todos.remove(id).is_none() {
            return Err("任务不存在".to_string());
        }
        info!("删除日清任务成功: {}", id);
        Ok(())
    }

    pub fn get_task_aggregations(&self, user_id: &str) -> Vec<TaskAggregation> {
        let todos = self.todos.read().unwrap_or_else(|e| e.into_inner());
        
        let mut aggregations: std::collections::HashMap<String, (u32, u32, u32)> = std::collections::HashMap::new();
        
        for todo in todos.values().filter(|t| t.user_id == user_id) {
            let module = match todo.source_module {
                TodoSourceModule::Hr => "hr",
                TodoSourceModule::Finance => "finance",
                TodoSourceModule::Approval => "approval",
                TodoSourceModule::Service => "service",
                TodoSourceModule::Sales => "sales",
                TodoSourceModule::Warehouse => "warehouse",
                TodoSourceModule::Marketing => "marketing",
                TodoSourceModule::Tender => "tender",
                TodoSourceModule::System => "system",
            }.to_string();
            
            let entry = aggregations.entry(module).or_insert((0, 0, 0));
            entry.0 += 1;
            match todo.status {
                TodoStatus::Pending => entry.1 += 1,
                TodoStatus::InProgress => entry.2 += 1,
                _ => {}
            }
        }
        
        let module_names: std::collections::HashMap<&str, (&str, &str)> = std::collections::HashMap::from([
            ("hr", ("人事", "Users")),
            ("finance", ("财务", "Wallet")),
            ("approval", ("审批", "ClipboardCheck")),
            ("service", ("售后", "HeadphonesIcon")),
            ("sales", ("销售", "ShoppingCart")),
            ("warehouse", ("仓储", "Package")),
            ("marketing", ("市场", "Megaphone")),
            ("tender", ("招投标", "FileText")),
            ("system", ("系统", "Settings")),
        ]);
        
        aggregations.into_iter()
            .map(|(module, (total, pending, in_progress))| {
                let (name, icon) = module_names.get(module.as_str()).unwrap_or(&("未知", "HelpCircle"));
                TaskAggregation {
                    module,
                    module_name: name.to_string(),
                    task_count: total,
                    pending_count: pending,
                    in_progress_count: in_progress,
                    icon: icon.to_string(),
                }
            })
            .collect()
    }
}

impl Default for WorkspaceDatabase {
    fn default() -> Self {
        Self::new()
    }
}
