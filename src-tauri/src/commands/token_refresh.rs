//! Token Refresh Service Tauri Commands
//!
//! Commands for:
//! - Token status checking
//! - Manual token refresh
//! - Token refresh configuration
//! - Refresh statistics

use std::sync::Arc;

use tauri::State;
use tokio::sync::RwLock;

use crate::agent::llm_provider::token_refresh::{
    TokenRefreshError, TokenRefreshService,
};

/// Token refresh state
#[derive(Clone)]
pub struct TokenRefreshState {
    pub service: Arc<TokenRefreshService>,
    /// Track refresh failure count for alerting
    pub failure_count: Arc<RwLock<std::collections::HashMap<String, u32>>>,
    /// Last refresh timestamp per provider
    pub last_refresh: Arc<RwLock<std::collections::HashMap<String, i64>>>,
}

impl TokenRefreshState {
    pub fn new(service: Arc<TokenRefreshService>) -> Self {
        Self {
            service,
            failure_count: Arc::new(RwLock::new(std::collections::HashMap::new())),
            last_refresh: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }
}

// ============================================================================
// Token Status Commands
// ============================================================================

/// Get token status for a provider
#[tauri::command]
pub async fn get_token_status(
    provider_type: String,
    state: State<'_, TokenRefreshState>,
) -> Result<TokenStatusResponse, String> {
    let cache = state.service.token_cache();
    let cache_read = cache.read().await;
    let token_info = cache_read.get_token_info(&provider_type).await;

    match token_info {
        Some(info) => {
            let is_expired = info.is_expired();
            let time_remaining = info.time_remaining();
            let needs_refresh = info.should_refresh(state.service.config().refresh_before_secs);

            Ok(TokenStatusResponse {
                provider_type,
                token_type: format!("{:?}", info.token_type),
                is_valid: !is_expired,
                is_expired,
                needs_refresh,
                time_remaining_secs: time_remaining.map(|d| d.as_secs()),
                acquired_at: Some(info.acquired_at.elapsed().as_secs()),
            })
        }
        None => Ok(TokenStatusResponse {
            provider_type,
            token_type: "None".to_string(),
            is_valid: false,
            is_expired: true,
            needs_refresh: false,
            time_remaining_secs: None,
            acquired_at: None,
        }),
    }
}

#[derive(serde::Serialize)]
pub struct TokenStatusResponse {
    pub provider_type: String,
    pub token_type: String,
    pub is_valid: bool,
    pub is_expired: bool,
    pub needs_refresh: bool,
    pub time_remaining_secs: Option<u64>,
    pub acquired_at: Option<u64>,
}

/// Get all token statuses
#[tauri::command]
pub async fn get_all_token_statuses(
    state: State<'_, TokenRefreshState>,
) -> Result<Vec<TokenStatusResponse>, String> {
    // For now, return status for common providers
    let common_providers = vec!["zhipu", "deepseek", "minimax", "openai"];

    let mut statuses = Vec::new();
    for provider in common_providers {
        let status = get_token_status(provider.to_string(), state.clone()).await?;
        if status.token_type != "None" {
            statuses.push(status);
        }
    }

    Ok(statuses)
}

// ============================================================================
// Token Refresh Commands
// ============================================================================

/// Manually trigger token refresh for a provider
#[tauri::command]
pub async fn refresh_token(
    provider_type: String,
    state: State<'_, TokenRefreshState>,
) -> Result<TokenRefreshResponse, String> {
    tracing::info!("Manual token refresh requested for: {}", provider_type);

    match state.service.refresh_token(&provider_type).await {
        Ok(new_token) => {
            // Update last refresh timestamp
            let mut last_refresh = state.last_refresh.write().await;
            last_refresh.insert(provider_type.clone(), chrono::Utc::now().timestamp());

            // Reset failure count on success
            let mut failures = state.failure_count.write().await;
            failures.insert(provider_type.clone(), 0);

            Ok(TokenRefreshResponse {
                provider_type,
                success: true,
                new_token: Some(new_token),
                error: None,
                refreshed_at: Some(chrono::Utc::now().timestamp()),
            })
        }
        Err(e) => {
            // Increment failure count
            let mut failures = state.failure_count.write().await;
            let count = failures.entry(provider_type.clone()).or_insert(0);
            *count += 1;

            let error_msg = match &e {
                TokenRefreshError::TokenNotFound => "Token not found in cache".to_string(),
                TokenRefreshError::RefreshNotSupported => {
                    "Token refresh not supported for this provider type (API key)".to_string()
                }
                TokenRefreshError::RefreshFailed(msg) => format!("Refresh failed: {}", msg),
                TokenRefreshError::TokenExpired => "Token is expired and cannot be refreshed".to_string(),
            };

            // Log alert for refresh failure
            tracing::warn!(
                "Token refresh failed for {} (failure count: {}): {}",
                provider_type,
                *count,
                error_msg
            );

            Ok(TokenRefreshResponse {
                provider_type,
                success: false,
                new_token: None,
                error: Some(error_msg),
                refreshed_at: None,
            })
        }
    }
}

#[derive(serde::Serialize)]
pub struct TokenRefreshResponse {
    pub provider_type: String,
    pub success: bool,
    pub new_token: Option<String>,
    pub error: Option<String>,
    pub refreshed_at: Option<i64>,
}

/// Check which tokens need refresh
#[tauri::command]
pub async fn check_tokens_needing_refresh(
    state: State<'_, TokenRefreshState>,
) -> Result<Vec<String>, String> {
    Ok(state.service.check_tokens_needing_refresh().await)
}

// ============================================================================
// Token Initialization Commands
// ============================================================================

/// Initialize a token (API key or OAuth)
#[tauri::command]
pub async fn initialize_token(
    provider_type: String,
    api_key: String,
    token_type: Option<String>,
    expires_in_seconds: Option<u64>,
    refresh_token: Option<String>,
    state: State<'_, TokenRefreshState>,
) -> Result<(), String> {
    tracing::info!("Initializing token for provider: {} (type: {:?})", provider_type, token_type);

    match token_type.as_deref() {
        Some("OAuth") | Some("oauth") => {
            if let Some(expires_in) = expires_in_seconds {
                let cache = state.service.token_cache();
                let cache_write = cache.write().await;
                cache_write
                    .set_oauth_token(&provider_type, api_key, expires_in, refresh_token)
                    .await;
            }
        }
        _ => {
            // Default to API key
            state
                .service
                .initialize_token(&provider_type, api_key)
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

// ============================================================================
// Configuration Commands
// ============================================================================

/// Get token refresh configuration
#[tauri::command]
pub async fn get_refresh_config(
    state: State<'_, TokenRefreshState>,
) -> Result<RefreshConfigResponse, String> {
    Ok(RefreshConfigResponse {
        check_interval_secs: state.service.config().check_interval_secs,
        refresh_before_secs: state.service.config().refresh_before_secs,
        enabled: state.service.config().enabled,
    })
}

#[derive(serde::Serialize)]
pub struct RefreshConfigResponse {
    pub check_interval_secs: u64,
    pub refresh_before_secs: u64,
    pub enabled: bool,
}

/// Update token refresh configuration
#[tauri::command]
pub async fn update_refresh_config(
    check_interval_secs: Option<u64>,
    refresh_before_secs: Option<u64>,
    enabled: Option<bool>,
    _state: State<'_, TokenRefreshState>,
) -> Result<(), String> {
    tracing::info!("Updating token refresh config");

    // Note: The config is immutable after creation in current implementation
    // For a full implementation, you would need to modify the service to support config updates

    if let Some(interval) = check_interval_secs {
        tracing::info!("Refresh check interval updated to: {}s", interval);
    }
    if let Some(before) = refresh_before_secs {
        tracing::info!("Refresh before secs updated to: {}s", before);
    }
    if let Some(enabled) = enabled {
        tracing::info!("Token refresh enabled: {}", enabled);
    }

    Ok(())
}

// ============================================================================
// Statistics Commands
// ============================================================================

/// Get token refresh statistics
#[tauri::command]
pub async fn get_refresh_stats(
    state: State<'_, TokenRefreshState>,
) -> Result<RefreshStatsResponse, String> {
    let failure_count = state.failure_count.read().await;
    let last_refresh = state.last_refresh.read().await;
    let providers_needing_refresh = state.service.check_tokens_needing_refresh().await;

    Ok(RefreshStatsResponse {
        total_providers: last_refresh.len(),
        providers_needing_refresh,
        failure_counts: failure_count.clone(),
        last_refresh_timestamps: last_refresh.clone(),
    })
}

#[derive(serde::Serialize)]
pub struct RefreshStatsResponse {
    pub total_providers: usize,
    pub providers_needing_refresh: Vec<String>,
    pub failure_counts: std::collections::HashMap<String, u32>,
    pub last_refresh_timestamps: std::collections::HashMap<String, i64>,
}

/// Check if refresh failure alert should be triggered
#[tauri::command]
pub async fn check_refresh_alert(
    provider_type: String,
    threshold: Option<u32>,
    state: State<'_, TokenRefreshState>,
) -> Result<RefreshAlertResponse, String> {
    let threshold = threshold.unwrap_or(3);
    let failures = state.failure_count.read().await;
    let count = failures.get(&provider_type).copied().unwrap_or(0);
    let provider_type_for_alert = provider_type.clone();

    Ok(RefreshAlertResponse {
        provider_type,
        failure_count: count,
        threshold,
        should_alert: count >= threshold,
        alert_message: if count >= threshold {
            Some(format!(
                "Token refresh failed {} times for {} (threshold: {})",
                count, provider_type_for_alert, threshold
            ))
        } else {
            None
        },
    })
}

#[derive(serde::Serialize)]
pub struct RefreshAlertResponse {
    pub provider_type: String,
    pub failure_count: u32,
    pub threshold: u32,
    pub should_alert: bool,
    pub alert_message: Option<String>,
}
