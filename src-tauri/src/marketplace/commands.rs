//! Marketplace 模块 Tauri 命令
//!
//! 使用 MarketplaceDatabase 持久化插件数据

use crate::auth::{verify_and_check, AuthService, Permission};
use crate::marketplace::db::MarketplaceDatabase;
use crate::marketplace::types::*;
use tauri::State;

pub struct MarketplaceState {
    pub db: MarketplaceDatabase,
}

impl MarketplaceState {
    pub fn new() -> Self {
        Self {
            db: MarketplaceDatabase::new(),
        }
    }
}

impl Default for MarketplaceState {
    fn default() -> Self {
        Self::new()
    }
}

/// 列出所有插件 (Read)
#[tauri::command]
pub async fn marketplace_list_plugins(
    state: State<'_, MarketplaceState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<Vec<MarketplacePlugin>, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.list_plugins())
}

/// 安装插件 (Write)
#[tauri::command]
pub async fn marketplace_install_plugin(
    state: State<'_, MarketplaceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    state.db.install_plugin(&id)
}

/// 卸载插件 (Write)
#[tauri::command]
pub async fn marketplace_uninstall_plugin(
    state: State<'_, MarketplaceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    state.db.uninstall_plugin(&id)
}

/// 启用插件 (Write)
#[tauri::command]
pub async fn marketplace_enable_plugin(
    state: State<'_, MarketplaceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    state.db.enable_plugin(&id)
}

/// 禁用插件 (Write)
#[tauri::command]
pub async fn marketplace_disable_plugin(
    state: State<'_, MarketplaceState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    state.db.disable_plugin(&id)
}

/// 获取插件统计 (Read)
#[tauri::command]
pub async fn marketplace_get_stats(
    state: State<'_, MarketplaceState>,
    auth_service: State<'_, AuthService>,
    token: String,
) -> Result<PluginStats, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    Ok(state.db.get_stats())
}
