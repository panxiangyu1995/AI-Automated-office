use crate::network::status::{check_network_status as probe, get_network_status as fetch_network_status, NetworkStatus};

#[tauri::command]
pub async fn check_network_status() -> bool {
    probe().await
}

#[tauri::command]
pub async fn get_network_status() -> NetworkStatus {
    fetch_network_status().await
}
