//! 网络状态命令

use std::sync::atomic::{AtomicBool, Ordering};

/// 网络状态
static NETWORK_STATUS: AtomicBool = AtomicBool::new(true);

/// 检查网络状态
#[tauri::command]
pub async fn check_network_status() -> bool {
    // 简单的网络检查，实际应用中可以实现更复杂的逻辑
    // 例如：ping 服务器、检查 API 响应等
    
    // 尝试连接到一个公共 DNS
    match tokio::net::TcpStream::connect("8.8.8.8:53").await {
        Ok(_) => {
            NETWORK_STATUS.store(true, Ordering::SeqCst);
            true
        }
        Err(_) => {
            NETWORK_STATUS.store(false, Ordering::SeqCst);
            false
        }
    }
}
