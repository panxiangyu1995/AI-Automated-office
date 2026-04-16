//! Browser state operations
//!
//! Contains: set_offline, set_extra_headers, set_geolocation

use crate::agent::tools::browser::{
    BrowserInteractResult, get_or_init_state, update_state,
};
use crate::agent::tools::pipeline::ToolExecutionError;

pub async fn execute_set_offline(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let offline = params
        .get("offline")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let mut state = get_or_init_state();
    state.offline = offline;
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "set_offline".to_string(),
        success: true,
        message: Some(format!("Offline mode: {}", offline)),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
        console_messages: None,
        network_requests: None,
        cookies: None,
        storage: None,
    })
}

pub async fn execute_set_extra_headers(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let headers = params
        .get("headers")
        .and_then(|v| v.as_object())
        .map(|h| {
            h.iter()
                .map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string()))
                .collect()
        })
        .unwrap_or_default();

    let mut state = get_or_init_state();
    state.extra_headers = headers;
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "set_extra_headers".to_string(),
        success: true,
        message: Some("Extra headers set".to_string()),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
        console_messages: None,
        network_requests: None,
        cookies: None,
        storage: None,
    })
}

pub async fn execute_set_geolocation(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let latitude = params
        .get("latitude")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| ToolExecutionError {
            code: crate::agent::tools::pipeline::ToolErrorCode::ValidationError,
            message: "latitude is required".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

    let longitude = params
        .get("longitude")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| ToolExecutionError {
            code: crate::agent::tools::pipeline::ToolErrorCode::ValidationError,
            message: "longitude is required".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "set_geolocation".to_string(),
        success: false,
        message: Some(format!(
            "set_geolocation ({}, {}) - requires Playwright integration",
            latitude, longitude
        )),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
        console_messages: None,
        network_requests: None,
        cookies: None,
        storage: None,
    })
}
