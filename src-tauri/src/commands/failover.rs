//! Failover and Session Repair Tauri Commands
//!
//! Commands for:
//! - Provider status management
//! - Failover execution
//! - Session repair management
//! - Statistics and audit records

use std::sync::Arc;
use tauri::State;

use crate::agent::failover::{
    FailoverRecord, FailoverService, FailoverStats, Provider, ProviderStatus,
    RepairStatus, SessionRepair,
};

/// Failover service state
#[derive(Clone)]
pub struct FailoverState {
    pub service: Arc<FailoverService>,
}

impl Default for FailoverState {
    fn default() -> Self {
        Self {
            service: Arc::new(FailoverService::new()),
        }
    }
}

impl FailoverState {
    pub fn new() -> Self {
        Self::default()
    }
}

/// Initialize failover service with default providers
#[tauri::command]
pub async fn init_failover_service(state: State<'_, FailoverState>) -> Result<(), String> {
    state.service.initialize_default_providers().await;
    tracing::info!("Failover service initialized with default providers");
    Ok(())
}

/// Get all providers
#[tauri::command]
pub async fn get_failover_providers(state: State<'_, FailoverState>) -> Result<Vec<Provider>, String> {
    Ok(state.service.get_providers().await)
}

/// Get provider by ID
#[tauri::command]
pub async fn get_failover_provider(
    id: String,
    state: State<'_, FailoverState>,
) -> Result<Option<Provider>, String> {
    Ok(state.service.get_provider(&id).await)
}

/// Update provider status
#[tauri::command]
pub async fn update_provider_status(
    id: String,
    status: ProviderStatus,
    state: State<'_, FailoverState>,
) -> Result<Option<Provider>, String> {
    Ok(state.service.update_provider_status(&id, status).await)
}

/// Get failover records
#[tauri::command]
pub async fn get_failover_records(
    state: State<'_, FailoverState>,
) -> Result<Vec<FailoverRecord>, String> {
    Ok(state.service.get_failover_records().await)
}

/// Execute failover
#[tauri::command]
pub async fn execute_failover(
    from_provider_id: String,
    to_provider_id: String,
    reason: String,
    state: State<'_, FailoverState>,
) -> Result<FailoverRecord, String> {
    state
        .service
        .execute_failover(&from_provider_id, &to_provider_id, reason)
        .await
        .map_err(|e| e.to_string())
}

/// Get session repairs
#[tauri::command]
pub async fn get_session_repairs(
    state: State<'_, FailoverState>,
) -> Result<Vec<SessionRepair>, String> {
    Ok(state.service.get_session_repairs().await)
}

/// Get pending repairs
#[tauri::command]
pub async fn get_pending_repairs(
    state: State<'_, FailoverState>,
) -> Result<Vec<SessionRepair>, String> {
    Ok(state.service.get_pending_repairs().await)
}

/// Create a repair record
#[tauri::command]
pub async fn create_repair(
    repair: SessionRepair,
    state: State<'_, FailoverState>,
) -> Result<(), String> {
    state.service.create_repair(repair).await;
    Ok(())
}

/// Update repair status
#[tauri::command]
pub async fn update_repair_status(
    repair_id: String,
    status: RepairStatus,
    state: State<'_, FailoverState>,
) -> Result<Option<SessionRepair>, String> {
    Ok(state.service.update_repair_status(&repair_id, status).await)
}

/// Get failover statistics
#[tauri::command]
pub async fn get_failover_stats(
    state: State<'_, FailoverState>,
) -> Result<FailoverStats, String> {
    Ok(state.service.get_stats().await)
}

/// Evaluate session health
#[tauri::command]
pub async fn evaluate_session_health(
    session_id: String,
    state: State<'_, FailoverState>,
) -> Result<String, String> {
    let health = state.service.evaluate_session_health(&session_id).await;
    Ok(match health {
        crate::agent::failover::SessionHealth::Healthy => "healthy".to_string(),
        crate::agent::failover::SessionHealth::Degraded => "degraded".to_string(),
        crate::agent::failover::SessionHealth::Corrupted => "corrupted".to_string(),
        crate::agent::failover::SessionHealth::Unknown => "unknown".to_string(),
    })
}
