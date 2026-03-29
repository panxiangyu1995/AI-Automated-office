//! Provider Configuration and Routing Mode Tauri Commands
//!
//! Commands for:
//! - Provider config management (Plan/Act dual config)
//! - Routing mode control (Manual/Auto/Yolo/Hybrid)
//! - YOLO mode activation and management

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::agent::llm_provider::config::{
    AgentMode, ConfigLevel, ProviderConfig, RoutingConfig,
};
use crate::agent::llm_provider::ProviderConfigService;
use crate::agent::routing::{RoutingMode, YoloTtl};

/// Provider config service state
#[derive(Clone)]
pub struct ProviderConfigState {
    pub service: Arc<ProviderConfigService>,
}

impl Default for ProviderConfigState {
    fn default() -> Self {
        Self {
            service: Arc::new(ProviderConfigService::new()),
        }
    }
}

/// Routing mode state for YOLO mode tracking
pub struct RoutingModeState {
    pub current_mode: RwLock<RoutingMode>,
    pub yolo_activated_at: RwLock<Option<i64>>,
    pub yolo_ttl: RwLock<Option<YoloTtl>>,
}

impl Default for RoutingModeState {
    fn default() -> Self {
        Self {
            current_mode: RwLock::new(RoutingMode::Auto),
            yolo_activated_at: RwLock::new(None),
            yolo_ttl: RwLock::new(None),
        }
    }
}

impl RoutingModeState {
    pub fn new() -> Self {
        Self::default()
    }
}

// ============================================================================
// Provider Config Commands (Task 134: 4.1-4.4)
// ============================================================================

/// Save a provider configuration
#[tauri::command]
pub async fn save_provider_config(
    config: ProviderConfig,
    state: State<'_, ProviderConfigState>,
) -> Result<(), String> {
    state
        .service
        .save_config(config)
        .await
        .map_err(|e| e.to_string())
}

/// Get active provider configuration
#[tauri::command]
pub async fn get_provider_config(
    tenant_id: Option<String>,
    user_id: Option<String>,
    provider_type: String,
    state: State<'_, ProviderConfigState>,
) -> Result<Option<ProviderConfig>, String> {
    state
        .service
        .get_active_config(tenant_id.as_deref(), user_id.as_deref(), &provider_type)
        .await
        .map_err(|e| e.to_string())
}

/// Get all provider configs for a tenant
#[tauri::command]
pub async fn get_tenant_provider_configs(
    tenant_id: String,
    state: State<'_, ProviderConfigState>,
) -> Result<Vec<ProviderConfig>, String> {
    state
        .service
        .get_tenant_configs(&tenant_id)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a provider configuration
#[tauri::command]
pub async fn delete_provider_config(
    level: String,
    tenant_id: Option<String>,
    user_id: Option<String>,
    provider_type: String,
    state: State<'_, ProviderConfigState>,
) -> Result<bool, String> {
    let config_level = match level.as_str() {
        "official" => ConfigLevel::Official,
        "tenant" => ConfigLevel::Tenant,
        "user" => ConfigLevel::User,
        _ => return Err(format!("Invalid config level: {}", level)),
    };
    state
        .service
        .delete_config(config_level, tenant_id.as_deref(), user_id.as_deref(), &provider_type)
        .await
        .map_err(|e| e.to_string())
}

// ============================================================================
// Mode Switching Commands (Task 134: 4.3-4.4)
// ============================================================================

/// Get current agent mode (Plan/Act)
#[tauri::command]
pub async fn get_current_mode() -> String {
    // This is a placeholder - actual implementation would check agent state
    "act".to_string()
}

/// Switch agent mode (Plan/Act)
#[tauri::command]
pub async fn switch_mode(mode: AgentMode) -> Result<(), String> {
    // This is a placeholder - actual implementation would update agent state
    tracing::info!("Switching agent mode to: {:?}", mode);
    Ok(())
}

// ============================================================================
// Routing Mode Commands (Task 135: 5.1-5.4)
// ============================================================================

/// Get current routing mode
#[tauri::command]
pub async fn get_routing_mode(
    state: State<'_, RoutingModeState>,
) -> Result<String, String> {
    let mode = state.current_mode.read().await;
    Ok(mode.to_string())
}

/// Set routing mode
#[tauri::command]
pub async fn set_routing_mode(
    mode: RoutingMode,
    state: State<'_, RoutingModeState>,
) -> Result<(), String> {
    let mut current = state.current_mode.write().await;
    *current = mode.clone();
    tracing::info!("Routing mode set to: {:?}", mode);
    Ok(())
}

/// Activate YOLO mode with TTL
#[tauri::command]
pub async fn activate_yolo_mode(
    ttl: YoloTtl,
    state: State<'_, RoutingModeState>,
) -> Result<(), String> {
    let mut current_mode = state.current_mode.write().await;
    let mut activated_at = state.yolo_activated_at.write().await;
    let mut yolo_ttl = state.yolo_ttl.write().await;

    *current_mode = RoutingMode::Yolo;
    *activated_at = Some(chrono::Utc::now().timestamp());
    *yolo_ttl = Some(ttl.clone());

    tracing::info!("YOLO mode activated with TTL: {:?}", ttl);
    Ok(())
}

/// Deactivate YOLO mode
#[tauri::command]
pub async fn deactivate_yolo_mode(
    state: State<'_, RoutingModeState>,
) -> Result<(), String> {
    let mut current_mode = state.current_mode.write().await;
    let mut activated_at = state.yolo_activated_at.write().await;
    let mut yolo_ttl = state.yolo_ttl.write().await;

    *current_mode = RoutingMode::Auto;
    *activated_at = None;
    *yolo_ttl = None;

    tracing::info!("YOLO mode deactivated");
    Ok(())
}

// ============================================================================
// YOLO Status Commands (Task 135: 5.5)
// ============================================================================

/// Get YOLO mode status
#[tauri::command]
pub async fn get_yolo_status(
    state: State<'_, RoutingModeState>,
) -> Result<YoloStatusResponse, String> {
    let current_mode = state.current_mode.read().await;
    let activated_at = state.yolo_activated_at.read().await;
    let yolo_ttl = state.yolo_ttl.read().await;

    let is_active = *current_mode == RoutingMode::Yolo;
    let remaining_ttl = if is_active {
        calculate_remaining_ttl(*activated_at, yolo_ttl.as_ref())
    } else {
        None
    };

    Ok(YoloStatusResponse {
        is_active,
        activated_at: *activated_at,
        ttl: yolo_ttl.clone(),
        remaining_ttl_seconds: remaining_ttl,
    })
}

#[derive(serde::Serialize)]
pub struct YoloStatusResponse {
    pub is_active: bool,
    pub activated_at: Option<i64>,
    pub ttl: Option<YoloTtl>,
    pub remaining_ttl_seconds: Option<u64>,
}

fn calculate_remaining_ttl(activated_at: Option<i64>, ttl: Option<&YoloTtl>) -> Option<u64> {
    match (activated_at, ttl) {
        (Some(activated), Some(yolo_ttl)) => {
            if let Some(ttl_seconds) = yolo_ttl.to_seconds() {
                let now = chrono::Utc::now().timestamp();
                let elapsed = now - activated;
                let remaining = ttl_seconds as i64 - elapsed;
                if remaining > 0 {
                    Some(remaining as u64)
                } else {
                    Some(0)
                }
            } else {
                None // Once TTL doesn't expire based on time
            }
        }
        _ => None,
    }
}

// ============================================================================
// Routing Config Commands (Task 134: 4.2)
// ============================================================================

/// Update provider config with dual (Plan/Act) configuration
#[tauri::command]
pub async fn update_provider_config(
    config: ProviderConfig,
    state: State<'_, ProviderConfigState>,
) -> Result<(), String> {
    state
        .service
        .save_config(config)
        .await
        .map_err(|e| e.to_string())
}

/// Get routing configuration for a provider
#[tauri::command]
pub async fn get_routing_config(
    provider_type: String,
    state: State<'_, ProviderConfigState>,
) -> Result<Option<RoutingConfig>, String> {
    // Get the active config and extract routing_config
    let config = state
        .service
        .get_active_config(None, None, &provider_type)
        .await
        .map_err(|e| e.to_string())?;

    Ok(config.and_then(|c| c.routing_config))
}
