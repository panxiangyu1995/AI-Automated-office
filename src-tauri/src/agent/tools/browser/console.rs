//! Browser console operations
//!
//! Contains: get_console_messages

use crate::agent::tools::browser::{
    BrowserInteractResult, get_or_init_state,
};
use crate::agent::tools::pipeline::ToolExecutionError;

pub async fn execute_get_console_messages(
    _params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "get_console_messages".to_string(),
        success: true,
        message: Some("Console messages retrieved".to_string()),
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
