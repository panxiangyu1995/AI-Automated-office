//! Tenant 模块 Tauri 命令

use crate::tenant::types::*;
use crate::tenant::repository::{SqliteTenantRepository, SqliteTenantConfigRepository};
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// Tenant state using SQLite persistence
pub struct TenantState {
    pub repository: Arc<SqliteTenantRepository>,
    pub config_repository: Arc<SqliteTenantConfigRepository>,
    pub current_tenant_id: std::sync::Mutex<Option<String>>,
}

impl TenantState {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        Self {
            repository: Arc::new(SqliteTenantRepository::new(pool.clone())),
            config_repository: Arc::new(SqliteTenantConfigRepository::new(pool)),
            current_tenant_id: std::sync::Mutex::new(Some("default".to_string())),
        }
    }
}

impl Default for TenantState {
    fn default() -> Self {
        panic!("TenantState::default() should not be called - use TenantState::new() with a pool")
    }
}

#[tauri::command]
pub async fn tenant_get_current(state: State<'_, TenantState>) -> Result<Tenant, String> {
    let tenant_id = state.current_tenant_id.lock().unwrap().clone()
        .ok_or("未选择租户".to_string())?;
    state.repository.get_by_id(&tenant_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("租户不存在".to_string())
}

#[tauri::command]
pub async fn tenant_list(state: State<'_, TenantState>) -> Result<Vec<Tenant>, String> {
    state.repository.list()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tenant_get_config(state: State<'_, TenantState>, tenant_id: String) -> Result<TenantConfig, String> {
    state.config_repository.get_by_tenant_id(&tenant_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("租户配置不存在".to_string())
}

#[tauri::command]
pub async fn tenant_update_config(state: State<'_, TenantState>, config: TenantConfig) -> Result<(), String> {
    info!("更新租户配置: {}", config.tenant_id);
    state.config_repository.upsert(&config)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tenant_get_stats(state: State<'_, TenantState>) -> Result<TenantStats, String> {
    state.repository.count()
        .await
        .map(|stats| TenantStats {
            tenant_count: stats.tenant_count,
            active_tenants: stats.active_tenants,
            trial_tenants: stats.trial_tenants,
        })
        .map_err(|e| e.to_string())
}

/// Initialize default tenant on first run
pub async fn init_default_tenant(state: &TenantState) -> Result<(), String> {
    let tenants = state.repository.list().await.map_err(|e| e.to_string())?;
    
    if tenants.is_empty() {
        let default_tenant = Tenant::new_default();
        state.repository.create(&default_tenant)
            .await
            .map_err(|e| e.to_string())?;
        
        let default_config = TenantConfig::default();
        state.config_repository.upsert(&default_config)
            .await
            .map_err(|e| e.to_string())?;
        
        let mut current = state.current_tenant_id.lock().unwrap();
        *current = Some(default_tenant.id);
    } else if state.current_tenant_id.lock().unwrap().is_none() {
        if let Some(first) = tenants.first() {
            let mut current = state.current_tenant_id.lock().unwrap();
            *current = Some(first.id.clone());
        }
    }
    
    Ok(())
}
