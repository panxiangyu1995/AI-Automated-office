use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatus {
    pub is_online: bool,
    pub connection_type: String,
    pub last_checked: i64,
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or(0)
}

pub async fn check_network_status() -> bool {
    tokio::net::TcpStream::connect("8.8.8.8:53").await.is_ok()
}

pub async fn get_network_status() -> NetworkStatus {
    let is_online = check_network_status().await;
    NetworkStatus {
        is_online,
        connection_type: "unknown".to_string(),
        last_checked: now_millis(),
    }
}

pub fn start_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_status: Option<bool> = None;
        loop {
            let status = check_network_status().await;
            if last_status.map(|prev| prev != status).unwrap_or(true) {
                let _ = app.emit("network-status-changed", status);
                last_status = Some(status);
            }
            sleep(Duration::from_secs(5)).await;
        }
    });
}
