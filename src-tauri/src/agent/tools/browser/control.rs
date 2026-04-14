//! Browser control operations
//!
//! Contains: status, start, stop, profiles, tabs

use crate::agent::tools::browser::{
    BrowserInteractResult, BrowserState, BrowserTab, CdpClient, get_or_init_state, update_state,
};
use crate::agent::tools::pipeline::ToolExecutionError;

pub fn execute_status(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
    let playwright_available = CdpClient::is_available();
    Ok(BrowserInteractResult {
        action: "status".to_string(),
        success: true,
        message: Some(format!(
            "Browser: {}, Playwright: {}",
            if state.running { "running" } else { "stopped" },
            if playwright_available { "available" } else { "not available" }
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

pub async fn execute_start(
    params: &serde_json::Map<String, serde_json::Value>,
    _cdp: Option<CdpClient>,
) -> (Result<BrowserInteractResult, ToolExecutionError>, Option<CdpClient>) {
    let profile = params
        .get("profile")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let mut state = get_or_init_state();

    if state.running {
        return (
            Ok(BrowserInteractResult {
                action: "start".to_string(),
                success: false,
                message: Some("Browser is already running".to_string()),
                state: Some(state),
                tabs: None,
                snapshot: None,
                screenshot: None,
                console_messages: None,
                network_requests: None,
                cookies: None,
                storage: None,
            }),
            _cdp,
        );
    }

    let new_client = if CdpClient::is_available() {
        let mut client = CdpClient::new("http://localhost:9222");
        match client.launch(profile.as_deref().unwrap_or("default")).await {
            Ok(_browser_id) => {
                state.running = true;
                state.profile = profile;
                state.tabs = vec![BrowserTab {
                    id: "tab_1".to_string(),
                    url: "about:blank".to_string(),
                    title: "New Tab".to_string(),
                    active: true,
                    loading: false,
                }];
                Some(client)
            }
            Err(e) => {
                return (
                    Ok(BrowserInteractResult {
                        action: "start".to_string(),
                        success: false,
                        message: Some(format!("Failed to launch browser: {}", e)),
                        state: Some(state),
                        tabs: None,
                        snapshot: None,
                        screenshot: None,
                        console_messages: None,
                        network_requests: None,
                        cookies: None,
                        storage: None,
                    }),
                    _cdp,
                );
            }
        }
    } else {
        state.running = true;
        state.profile = profile;
        state.tabs = vec![BrowserTab {
            id: "tab_1".to_string(),
            url: "about:blank".to_string(),
            title: "New Tab".to_string(),
            active: true,
            loading: false,
        }];
        None
    };

    update_state(state.clone());

    (
        Ok(BrowserInteractResult {
            action: "start".to_string(),
            success: true,
            message: Some("Browser started (mock mode - Playwright integration pending)".to_string()),
            state: Some(state),
            tabs: None,
            snapshot: None,
            screenshot: None,
            console_messages: None,
            network_requests: None,
            cookies: None,
            storage: None,
        }),
        new_client,
    )
}

pub fn execute_stop() -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();

    if !state.running {
        return Ok(BrowserInteractResult {
            action: "stop".to_string(),
            success: false,
            message: Some("Browser is not running".to_string()),
            state: Some(state),
            tabs: None,
            snapshot: None,
            screenshot: None,
            console_messages: None,
            network_requests: None,
            cookies: None,
            storage: None,
        });
    }

    state.running = false;
    state.profile = None;
    state.tabs.clear();
    state.offline = false;
    state.extra_headers.clear();
    state.armed_file_chooser = false;
    state.armed_dialog = None;
    state.armed_download = false;

    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "stop".to_string(),
        success: true,
        message: Some("Browser stopped".to_string()),
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

pub fn execute_profiles(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
    Ok(BrowserInteractResult {
        action: "profiles".to_string(),
        success: true,
        message: Some("Available profiles: default, testing, isolation".to_string()),
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

pub fn execute_tabs(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
    Ok(BrowserInteractResult {
        action: "tabs".to_string(),
        success: true,
        message: None,
        state: Some(state.clone()),
        tabs: Some(state.tabs),
        snapshot: None,
        screenshot: None,
        console_messages: None,
        network_requests: None,
        cookies: None,
        storage: None,
    })
}
