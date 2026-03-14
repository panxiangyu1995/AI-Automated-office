//! 配置管理命令

use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

/// 应用配置存储
pub type ConfigStore = Mutex<HashMap<String, serde_json::Value>>;

/// 获取配置项
#[tauri::command]
pub fn get_config(
    key: String,
    store: State<ConfigStore>,
) -> Result<Option<serde_json::Value>, String> {
    let store = store.lock().map_err(|e| e.to_string())?;
    Ok(store.get(&key).cloned())
}

/// 设置配置项
#[tauri::command]
pub fn set_config(
    key: String,
    value: serde_json::Value,
    store: State<ConfigStore>,
) -> Result<(), String> {
    let mut store = store.lock().map_err(|e| e.to_string())?;
    store.insert(key, value);
    Ok(())
}
