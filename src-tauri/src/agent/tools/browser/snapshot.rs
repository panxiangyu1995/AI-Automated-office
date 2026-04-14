//! Browser snapshot operations
//!
//! Contains: snapshot, screenshot

use crate::agent::tools::browser::{
    BrowserInteractResult, get_or_init_state,
};
use crate::agent::tools::pipeline::ToolExecutionError;

pub async fn execute_snapshot(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let format = params
        .get("format")
        .and_then(|v| v.as_str())
        .unwrap_or("aria")
        .to_string();

    let state = get_or_init_state();

    if !state.running {
        return Err(ToolExecutionError {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    let active_tab = state.tabs.iter().find(|t| t.active);

    let snapshot = match format.as_str() {
        "aria" => serde_json::json!({
            "role": "document",
            "name": active_tab.map(|t| t.title.as_str()).unwrap_or("Untitled"),
            "url": active_tab.map(|t| t.url.as_str()).unwrap_or(""),
            "children": []
        }).to_string(),
        "ai" => serde_json::json!({
            "summary": "Page content placeholder",
            "url": active_tab.map(|t| t.url.as_str()).unwrap_or(""),
            "title": active_tab.map(|t| t.title.as_str()).unwrap_or("Untitled"),
            "interactive_elements": []
        }).to_string(),
        "role" => serde_json::json!({
            "roles": [],
            "url": active_tab.map(|t| t.url.as_str()).unwrap_or("")
        }).to_string(),
        _ => return Err(ToolExecutionError {
            code: crate::agent::tools::pipeline::ToolErrorCode::ValidationError,
            message: format!("Unknown format: {}", format),
            details: None,
            recoverable: true,
            retryable: false,
        }),
    };

    Ok(BrowserInteractResult {
        action: "snapshot".to_string(),
        success: false,
        message: Some(format!("snapshot ({}) - requires Playwright integration", format)),
        state: Some(state),
        tabs: None,
        snapshot: Some(snapshot),
        screenshot: None,
        console_messages: None,
        network_requests: None,
        cookies: None,
        storage: None,
    })
}

pub async fn execute_screenshot(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let _full_page = params
        .get("full_page")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let state = get_or_init_state();

    if !state.running {
        return Err(ToolExecutionError {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    Ok(BrowserInteractResult {
        action: "screenshot".to_string(),
        success: false,
        message: Some("screenshot - requires Playwright integration".to_string()),
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
