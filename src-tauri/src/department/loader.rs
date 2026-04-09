//! 部门加载器 - 动态加载/卸载部门能力包
//!
//! 提供部门的加载、卸载、状态查询功能

use crate::department::registry::DepartmentRegistry;
use crate::department::types::*;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tracing::{error, info, warn};

/// 部门加载状态
#[derive(Debug, Clone, serde::Serialize)]
pub struct DepartmentLoadState {
    /// 部门 ID
    pub department_id: String,
    /// 是否已加载
    pub is_loaded: bool,
    /// 加载开始时间
    pub load_started_at: Option<i64>,
    /// 加载完成时间
    pub load_completed_at: Option<i64>,
    /// 错误信息
    pub error: Option<String>,
}

impl Default for DepartmentLoadState {
    fn default() -> Self {
        Self {
            department_id: String::new(),
            is_loaded: false,
            load_started_at: None,
            load_completed_at: None,
            error: None,
        }
    }
}

/// 部门加载器
pub struct DepartmentLoader {
    /// 加载状态
    load_states: RwLock<HashMap<String, DepartmentLoadState>>,
    /// 加载钩子回调
    on_load_callbacks: RwLock<Vec<Box<dyn Fn(&DepartmentPackage) + Send + Sync>>>,
    /// 卸载钩子回调
    on_unload_callbacks: RwLock<Vec<Box<dyn Fn(&DepartmentPackage) + Send + Sync>>>,
}

impl DepartmentLoader {
    /// 创建新的加载器实例
    pub fn new() -> Self {
        info!("初始化部门加载器");
        Self {
            load_states: RwLock::new(HashMap::new()),
            on_load_callbacks: RwLock::new(Vec::new()),
            on_unload_callbacks: RwLock::new(Vec::new()),
        }
    }

    /// 加载部门
    pub fn load(&self, registry: &DepartmentRegistry, department_id: &str) -> Result<DepartmentPackage, (DepartmentErrorCode, String)> {
        info!("开始加载部门: {}", department_id);

        // 获取部门包
        let package = registry.get_by_id(department_id).ok_or_else(|| {
            error!("部门不存在: {}", department_id);
            (
                DepartmentErrorCode::NotFound,
                format!("部门 ID '{}' 不存在", department_id),
            )
        })?;

        // 检查依赖是否满足
        self.check_dependencies(registry, &package)?;

        // 更新加载状态
        {
            let mut states = self.load_states.write().unwrap();
            states.insert(
                department_id.to_string(),
                DepartmentLoadState {
                    department_id: department_id.to_string(),
                    is_loaded: false,
                    load_started_at: Some(chrono::Utc::now().timestamp_millis()),
                    load_completed_at: None,
                    error: None,
                },
            );
        }

        // 更新注册表中的状态
        registry.update_status(department_id, DepartmentStatus::Loading).map_err(|e| {
            error!("更新部门状态失败: {}", e.1);
            e
        })?;

        // 执行加载逻辑（这里可以添加实际的加载操作，如初始化资源等）
        // 目前是模拟加载过程
        let loaded_package = self.execute_load(registry, department_id)?;

        // 触发加载完成回调
        self.trigger_load_callbacks(&loaded_package);

        info!("部门加载完成: {} ({})", loaded_package.name, department_id);
        Ok(loaded_package)
    }

    /// 卸载部门
    pub fn unload(&self, registry: &DepartmentRegistry, department_id: &str) -> Result<(), (DepartmentErrorCode, String)> {
        info!("开始卸载部门: {}", department_id);

        // 获取部门包
        let package = registry.get_by_id(department_id).ok_or_else(|| {
            error!("部门不存在: {}", department_id);
            (
                DepartmentErrorCode::NotFound,
                format!("部门 ID '{}' 不存在", department_id),
            )
        })?;

        // 检查是否有其他部门依赖此部门
        self.check_reverse_dependencies(registry, department_id)?;

        // 执行卸载逻辑
        self.execute_unload(registry, department_id)?;

        // 触发卸载回调
        self.trigger_unload_callbacks(&package);

        // 更新状态
        registry.set_loaded(department_id, false).map_err(|e| {
            error!("更新部门状态失败: {}", e.1);
            e
        })?;

        // 更新加载状态
        {
            let mut states = self.load_states.write().unwrap();
            states.remove(department_id);
        }

        info!("部门卸载完成: {}", department_id);
        Ok(())
    }

    /// 获取已加载的部门列表
    pub fn get_loaded(&self, registry: &DepartmentRegistry) -> Vec<DepartmentPackage> {
        let states = self.load_states.read().unwrap();
        let loaded_ids: Vec<String> = states
            .iter()
            .filter(|(_, state)| state.is_loaded)
            .map(|(id, _)| id.clone())
            .collect();
        drop(states);

        loaded_ids
            .into_iter()
            .filter_map(|id| registry.get_by_id(&id))
            .collect()
    }

    /// 获取加载状态
    pub fn get_load_state(&self, department_id: &str) -> Option<DepartmentLoadState> {
        let states = self.load_states.read().unwrap();
        states.get(department_id).cloned()
    }

    /// 获取所有加载状态
    pub fn get_all_load_states(&self) -> Vec<DepartmentLoadState> {
        let states = self.load_states.read().unwrap();
        states.values().cloned().collect()
    }

    /// 检查部门是否已加载
    pub fn is_loaded(&self, department_id: &str) -> bool {
        let states = self.load_states.read().unwrap();
        states.get(department_id).map(|s| s.is_loaded).unwrap_or(false)
    }

    /// 注册加载钩子
    pub fn on_load<F>(&self, callback: F)
    where
        F: Fn(&DepartmentPackage) + Send + Sync + 'static,
    {
        let mut callbacks = self.on_load_callbacks.write().unwrap();
        callbacks.push(Box::new(callback));
    }

    /// 注册卸载钩子
    pub fn on_unload<F>(&self, callback: F)
    where
        F: Fn(&DepartmentPackage) + Send + Sync + 'static,
    {
        let mut callbacks = self.on_unload_callbacks.write().unwrap();
        callbacks.push(Box::new(callback));
    }

    /// 检查依赖是否满足
    fn check_dependencies(&self, registry: &DepartmentRegistry, package: &DepartmentPackage) -> Result<(), (DepartmentErrorCode, String)> {
        for dep in &package.dependencies {
            if !registry.code_exists(dep) {
                return Err((
                    DepartmentErrorCode::DependencyNotLoaded,
                    format!("依赖部门 '{}' 未注册", dep),
                ));
            }

            let dep_package = registry.get_by_code(dep).ok_or_else(|| {
                (
                    DepartmentErrorCode::DependencyNotLoaded,
                    format!("无法获取依赖部门 '{}'", dep),
                )
            })?;

            if dep_package.status != DepartmentStatus::Active {
                return Err((
                    DepartmentErrorCode::DependencyNotLoaded,
                    format!("依赖部门 '{}' 未加载", dep),
                ));
            }
        }
        Ok(())
    }

    /// 检查是否有其他部门依赖此部门
    fn check_reverse_dependencies(&self, registry: &DepartmentRegistry, department_id: &str) -> Result<(), (DepartmentErrorCode, String)> {
        let departments = registry.get_all();
        for dept in departments {
            if dept.dependencies.iter().any(|d| d.to_string() == department_id) {
                warn!(
                    "部门 '{}' 正被 '{}' 依赖",
                    department_id, dept.name
                );
            }
        }
        Ok(())
    }

    /// 执行加载逻辑
    fn execute_load(&self, registry: &DepartmentRegistry, department_id: &str) -> Result<DepartmentPackage, (DepartmentErrorCode, String)> {
        // 更新状态为已加载
        registry.set_loaded(department_id, true).map_err(|e| {
            error!("设置部门加载状态失败: {}", e.1);
            e
        })?;

        // 更新加载状态记录
        {
            let mut states = self.load_states.write().unwrap();
            if let Some(state) = states.get_mut(department_id) {
                state.is_loaded = true;
                state.load_completed_at = Some(chrono::Utc::now().timestamp_millis());
            }
        }

        // 返回更新后的部门包
        registry.get_by_id(department_id).ok_or_else(|| {
            (
                DepartmentErrorCode::NotFound,
                format!("部门 ID '{}' 不存在", department_id),
            )
        })
    }

    /// 执行卸载逻辑
    fn execute_unload(&self, registry: &DepartmentRegistry, department_id: &str) -> Result<(), (DepartmentErrorCode, String)> {
        // 更新加载状态记录
        {
            let mut states = self.load_states.write().unwrap();
            states.remove(department_id);
        }
        Ok(())
    }

    /// 触发加载回调
    fn trigger_load_callbacks(&self, package: &DepartmentPackage) {
        let callbacks = self.on_load_callbacks.read().unwrap();
        for callback in callbacks.iter() {
            callback(package);
        }
    }

    /// 触发卸载回调
    fn trigger_unload_callbacks(&self, package: &DepartmentPackage) {
        let callbacks = self.on_unload_callbacks.read().unwrap();
        for callback in callbacks.iter() {
            callback(package);
        }
    }

    /// 获取已加载部门数量
    pub fn loaded_count(&self) -> usize {
        let states = self.load_states.read().unwrap();
        states.values().filter(|s| s.is_loaded).count()
    }

    /// 批量加载部门
    pub fn load_batch(&self, registry: &DepartmentRegistry, department_ids: Vec<String>) -> Vec<Result<DepartmentPackage, (DepartmentErrorCode, String)>> {
        let mut results = Vec::new();
        for id in department_ids {
            results.push(self.load(registry, &id));
        }
        results
    }

    /// 批量卸载部门
    pub fn unload_batch(&self, registry: &DepartmentRegistry, department_ids: Vec<String>) -> Vec<Result<(), (DepartmentErrorCode, String)>> {
        let mut results = Vec::new();
        for id in department_ids {
            results.push(self.unload(registry, &id));
        }
        results
    }
}

impl Default for DepartmentLoader {
    fn default() -> Self {
        Self::new()
    }
}
