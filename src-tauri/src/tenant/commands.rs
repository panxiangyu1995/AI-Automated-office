//! Tenant 模块 Tauri 命令

use crate::tenant::types::*;
use std::sync::Mutex;
use tauri::State;
use tracing::info;

pub struct TenantState {
    pub tenants: Mutex<Vec<Tenant>>,
    pub configs: Mutex<Vec<TenantConfig>>,
    pub current_tenant: Mutex<Option<Tenant>>,
}

impl TenantState {
    pub fn new() -> Self {
        let tenant = Tenant::new_default();
        let config = TenantConfig::default();
        Self {
            tenants: Mutex::new(vec![tenant.clone()]),
            configs: Mutex::new(vec![config]),
            current_tenant: Mutex::new(Some(tenant)),
        }
    }
}

impl Default for TenantState { fn default() -> Self { Self::new() } }

#[tauri::command]
pub async fn tenant_get_current(state: State<'_, TenantState>) -> Result<Tenant, String> {
    state.current_tenant.lock().unwrap().clone().ok_or("未选择租户".into())
}

#[tauri::command]
pub async fn tenant_list(state: State<'_, TenantState>) -> Result<Vec<Tenant>, String> {
    Ok(state.tenants.lock().unwrap().clone())
}

#[tauri::command]
pub async fn tenant_get_config(state: State<'_, TenantState>, tenant_id: String) -> Result<TenantConfig, String> {
    state.configs.lock().unwrap().iter().find(|c| c.tenant_id == tenant_id).cloned().ok_or("租户配置不存在".into())
}

#[tauri::command]
pub async fn tenant_update_config(state: State<'_, TenantState>, config: TenantConfig) -> Result<(), String> {
    info!("更新租户配置: {}", config.tenant_id);
    let mut configs = state.configs.lock().unwrap();
    if let Some(existing) = configs.iter_mut().find(|c| c.tenant_id == config.tenant_id) {
        *existing = config;
    } else {
        configs.push(config);
    }
    Ok(())
}

#[tauri::command]
pub async fn tenant_get_stats(state: State<'_, TenantState>) -> Result<TenantStats, String> {
    let tenants = state.tenants.lock().unwrap();
    let active = tenants.iter().filter(|t| t.status == TenantStatus::Active).count() as i64;
    let trial = tenants.iter().filter(|t| t.status == TenantStatus::Trial).count() as i64;
    Ok(TenantStats { tenant_count: tenants.len() as i64, active_tenants: active, trial_tenants: trial })
}
