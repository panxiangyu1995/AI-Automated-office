//! Browser download operations
//!
//! Contains: arm_download, wait_for_download

use crate::agent::tools::browser::{
    BrowserInteractResult, get_or_init_state, update_state,
};
use crate::agent::tools::pipeline::ToolExecutionError;

pub async fn execute_arm_download(
    _params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
    state.armed_download = true;
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "arm_download".to_string(),
        success: true,
        message: Some("Download armed".to_string()),
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

pub async fn execute_wait_for_download(
    _params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "wait_for_download".to_string(),
        success: false,
        message: Some("wait_for_download - requires Playwright integration".to_string()),
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
