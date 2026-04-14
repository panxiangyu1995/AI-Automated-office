//! Browser interaction operations
//!
//! Contains: act, arm_file_chooser, disarm_file_chooser, arm_dialog, accept_dialog, dismiss_dialog

use crate::agent::tools::browser::{
    BrowserInteractResult, DialogArm, get_or_init_state, update_state,
};
use crate::agent::tools::pipeline::ToolExecutionError;

pub async fn execute_act(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let kind = params
        .get("act_kind")
        .and_then(|v| v.as_str())
        .unwrap_or("click")
        .to_string();

    let selector = params
        .get("selector")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

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

    let message = match kind.as_str() {
        "click" => format!("click on {}", selector.as_deref().unwrap_or("element")),
        "dblclick" => format!("double-click on {}", selector.as_deref().unwrap_or("element")),
        "rightclick" => format!("right-click on {}", selector.as_deref().unwrap_or("element")),
        "hover" => format!("hover over {}", selector.as_deref().unwrap_or("element")),
        "type" => {
            let text = params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            format!("type '{}' into {}", text, selector.as_deref().unwrap_or("element"))
        }
        "press" => {
            let key = params.get("key").and_then(|v| v.as_str()).unwrap_or("");
            format!("press key '{}'", key)
        }
        "submit" => format!("submit form {}", selector.as_deref().unwrap_or("")),
        "batch" => "batch action".to_string(),
        _ => format!("unknown action: {}", kind),
    };

    Ok(BrowserInteractResult {
        action: "act".to_string(),
        success: false,
        message: Some(format!("{} - requires Playwright integration", message)),
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

pub async fn execute_arm_file_chooser(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
    state.armed_file_chooser = true;
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "arm_file_chooser".to_string(),
        success: true,
        message: Some("File chooser armed".to_string()),
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

pub async fn execute_disarm_file_chooser(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
    state.armed_file_chooser = false;
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "disarm_file_chooser".to_string(),
        success: true,
        message: Some("File chooser disarmed".to_string()),
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

pub async fn execute_arm_dialog(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let accept = params
        .get("dialog_accept")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);

    let prompt_text = params
        .get("prompt_text")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let has_prompt = prompt_text.is_some();

    let mut state = get_or_init_state();
    state.armed_dialog = Some(DialogArm {
        accept,
        prompt_text,
    });
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "arm_dialog".to_string(),
        success: true,
        message: Some(format!(
            "Dialog armed (accept: {}, prompt: {})",
            accept,
            has_prompt
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

pub async fn execute_accept_dialog(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
    let dialog = state.armed_dialog.clone();

    if dialog.is_none() {
        return Err(ToolExecutionError {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "No dialog armed".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    state.armed_dialog = None;
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "accept_dialog".to_string(),
        success: true,
        message: Some("Dialog accepted".to_string()),
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

pub async fn execute_dismiss_dialog(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
    state.armed_dialog = None;
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "dismiss_dialog".to_string(),
        success: true,
        message: Some("Dialog dismissed".to_string()),
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
