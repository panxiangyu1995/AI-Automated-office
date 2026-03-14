//! 系统命令

use tauri::utils::platform;

/// 获取应用版本
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// 获取当前平台信息
#[tauri::command]
pub fn get_platform() -> String {
    platform::target_triple().unwrap_or_else(|_| "unknown".to_string())
}
