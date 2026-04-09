//! Configuration Cache Override Tauri Commands
//!
//! Commands for:
//! - Remote config loading
//! - Session override management
//! - Task settings management
//! - Global defaults management
//! - Config value retrieval

use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

use crate::agent::config_cache::{ConfigCacheService, ConfigEntry, ConfigValue};

/// Config cache service state
#[derive(Clone)]
pub struct ConfigCacheState {
    pub service: Arc<ConfigCacheService>,
}

impl Default for ConfigCacheState {
    fn default() -> Self {
        Self {
            service: Arc::new(ConfigCacheService::new()),
        }
    }
}

impl ConfigCacheState {
    pub fn new() -> Self {
        Self::default()
    }
}

/// Initialize with default configuration
#[tauri::command]
pub async fn init_config_cache(
    defaults: HashMap<String, ConfigValue>,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state.service.init_with_defaults(defaults).await;
    Ok(())
}

/// Load remote configuration
#[tauri::command]
pub async fn load_remote_config(
    source_url: String,
    config: HashMap<String, ConfigValue>,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state.service.load_remote(&source_url, config).await;
    Ok(())
}

/// Check if remote config is loaded
#[tauri::command]
pub async fn has_remote_config(
    state: State<'_, ConfigCacheState>,
) -> Result<bool, String> {
    Ok(state.service.has_remote().await)
}

/// Get remote config source URL
#[tauri::command]
pub async fn get_remote_config_url(
    state: State<'_, ConfigCacheState>,
) -> Result<Option<String>, String> {
    Ok(state.service.get_remote_url().await)
}

/// Set session-level override
#[tauri::command]
pub async fn set_session_config_override(
    session_id: String,
    key: String,
    value: ConfigValue,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state
        .service
        .set_session_override(&session_id, &key, value)
        .await;
    Ok(())
}

/// Remove session-level override
#[tauri::command]
pub async fn remove_session_config_override(
    session_id: String,
    key: String,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state
        .service
        .remove_session_override(&session_id, &key)
        .await;
    Ok(())
}

/// Clear all session overrides
#[tauri::command]
pub async fn clear_session_config_overrides(
    session_id: String,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state.service.clear_session_overrides(&session_id).await;
    Ok(())
}

/// Set task-level setting
#[tauri::command]
pub async fn set_task_config_setting(
    task_id: String,
    key: String,
    value: ConfigValue,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state.service.set_task_setting(&task_id, &key, value).await;
    Ok(())
}

/// Remove task-level setting
#[tauri::command]
pub async fn remove_task_config_setting(
    task_id: String,
    key: String,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state.service.remove_task_setting(&task_id, &key).await;
    Ok(())
}

/// Set global default
#[tauri::command]
pub async fn set_global_config_default(
    key: String,
    value: ConfigValue,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state.service.set_global_default(&key, value).await;
    Ok(())
}

/// Remove global default
#[tauri::command]
pub async fn remove_global_config_default(
    key: String,
    state: State<'_, ConfigCacheState>,
) -> Result<(), String> {
    state.service.remove_global_default(&key).await;
    Ok(())
}

/// Get effective config value
#[tauri::command]
pub async fn get_config_value(
    key: String,
    state: State<'_, ConfigCacheState>,
) -> Result<Option<ConfigEntry>, String> {
    Ok(state.service.get(&key).await)
}

/// Get all effective config values
#[tauri::command]
pub async fn get_all_config_values(
    state: State<'_, ConfigCacheState>,
) -> Result<HashMap<String, ConfigEntry>, String> {
    Ok(state.service.get_all().await)
}
