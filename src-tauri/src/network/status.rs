use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkStatus {
    pub is_online: bool,
    pub connection_type: String,
    pub last_checked: i64,
    pub latency_ms: Option<u64>,
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or(0)
}

/// Detect connection type by probing known endpoints
async fn detect_connection_type() -> String {
    // Try DNS resolution (indicates internet access)
    if tokio::net::TcpStream::connect("8.8.8.8:53").await.is_ok() {
        return "internet".to_string();
    }
    // Try local gateway (indicates LAN access)
    if tokio::net::TcpStream::connect("192.168.1.1:80").await.is_ok() {
        return "lan".to_string();
    }
    "offline".to_string()
}

/// Measure latency to a known endpoint
async fn measure_latency() -> Option<u64> {
    let start = SystemTime::now();
    if tokio::net::TcpStream::connect("8.8.8.8:53").await.is_ok() {
        SystemTime::now()
            .duration_since(start)
            .map(|d| d.as_millis() as u64)
            .ok()
    } else {
        None
    }
}

pub async fn check_network_status() -> bool {
    tokio::net::TcpStream::connect("8.8.8.8:53").await.is_ok()
}

pub async fn get_network_status() -> NetworkStatus {
    let is_online = check_network_status().await;
    let connection_type = if is_online {
        detect_connection_type().await
    } else {
        "offline".to_string()
    };
    let latency_ms = if is_online { measure_latency().await } else { None };

    NetworkStatus {
        is_online,
        connection_type,
        last_checked: now_millis(),
        latency_ms,
    }
}

pub fn start_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_status: Option<bool> = None;
        loop {
            let status = check_network_status().await;
            if last_status.map(|prev| prev != status).unwrap_or(true) {
                let _ = app.emit("network-status-changed", status);
                info!("Network status changed: online={}", status);
                last_status = Some(status);
            }
            sleep(Duration::from_secs(5)).await;
        }
    });
}
