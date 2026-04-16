//! SIEM Commands
//!
//! Tauri commands for audit SIEM integration (J4)

use std::sync::Arc;
use tauri::State;
use tracing::info;

use crate::agent::audit_siem::{AuditSiemBridge, SiemConfig};

/// Get current SIEM configuration
#[tauri::command]
pub async fn siem_get_config(
    bridge: State<'_, Arc<AuditSiemBridge>>,
) -> Result<SiemConfig, String> {
    Ok(bridge.get_config().await)
}

/// Update SIEM configuration
#[tauri::command]
pub async fn siem_update_config(
    bridge: State<'_, Arc<AuditSiemBridge>>,
    config: SiemConfig,
) -> Result<(), String> {
    info!("Updating SIEM config: enabled={}", config.enabled);
    bridge.update_config(config).await;
    Ok(())
}

/// Flush pending SIEM events
#[tauri::command]
pub async fn siem_flush(
    bridge: State<'_, Arc<AuditSiemBridge>>,
) -> Result<(), String> {
    bridge.flush().await;
    Ok(())
}

/// Get pending SIEM event count
#[tauri::command]
pub async fn siem_pending_count(
    bridge: State<'_, Arc<AuditSiemBridge>>,
) -> Result<usize, String> {
    Ok(bridge.pending_count().await)
}
