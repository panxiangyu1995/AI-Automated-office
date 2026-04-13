//! Warehouse 模块命令存根
//! TODO: 待后续实现

use tauri::State;
use tracing::info;

/// Warehouse 状态
pub struct WarehouseState {}

impl WarehouseState {
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for WarehouseState {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub async fn warehouse_get_info() -> Result<serde_json::Value, String> {
    info!("获取仓库信息");
    Ok(serde_json::json!({
        "message": "仓库模块待实现"
    }))
}
