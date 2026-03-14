//! 本地存储命令

use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

/// 本地存储
pub type LocalStorage = Mutex<HashMap<String, serde_json::Value>>;

/// 获取存储项
#[tauri::command]
pub fn get_storage(
    key: String,
    storage: State<LocalStorage>,
) -> Result<Option<serde_json::Value>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.get(&key).cloned())
}

/// 设置存储项
#[tauri::command]
pub fn set_storage(
    key: String,
    value: serde_json::Value,
    storage: State<LocalStorage>,
) -> Result<(), String> {
    let mut storage = storage.lock().map_err(|e| e.to_string())?;
    storage.insert(key, value);
    Ok(())
}

/// 删除存储项
#[tauri::command]
pub fn remove_storage(key: String, storage: State<LocalStorage>) -> Result<(), String> {
    let mut storage = storage.lock().map_err(|e| e.to_string())?;
    storage.remove(&key);
    Ok(())
}
