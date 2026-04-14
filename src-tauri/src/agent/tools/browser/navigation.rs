//! Browser navigation operations
//!
//! Contains: open, close, focus, navigate, back, forward, refresh

use crate::agent::tools::browser::{
    BrowserInteractResult, BrowserTab, get_or_init_state, update_state,
};
use crate::agent::tools::pipeline::{ToolExecutionError, ToolErrorCode};

pub async fn execute_open(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let url = params
        .get("url")
        .and_then(|v| v.as_str())
        .unwrap_or("about:blank")
        .to_string();

    let mut state = get_or_init_state();

    if !state.running {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Browser is not running. Use action=start first.".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    let tab_id = format!("tab_{}", state.tabs.len() + 1);
    let new_tab = BrowserTab {
        id: tab_id.clone(),
        url: url.clone(),
        title: "New Tab".to_string(),
        active: true,
        loading: true,
    };

    for tab in &mut state.tabs {
        tab.active = false;
    }

    state.tabs.push(new_tab);
    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "open".to_string(),
        success: true,
        message: Some(format!("Opened new tab: {} with URL: {}", tab_id, url)),
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

pub async fn execute_close(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    use ToolExecutionError as TE;

    let target_id = params
        .get("target_id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let mut state = get_or_init_state();

    if !state.running {
        return Err(TE {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    let initial_len = state.tabs.len();
    state.tabs.retain(|tab| tab.id != target_id.as_ref().map(|s| s.as_str()).unwrap_or(""));

    if state.tabs.len() == initial_len && target_id.is_some() {
        let tab_id = target_id.as_ref().expect("target_id should exist");
        return Ok(BrowserInteractResult {
            action: "close".to_string(),
            success: false,
            message: Some(format!("Tab not found: {}", tab_id)),
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

    if state.tabs.iter().all(|t| !t.active) {
        if let Some(last) = state.tabs.last_mut() {
            last.active = true;
        }
    }

    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "close".to_string(),
        success: true,
        message: Some("Tab closed".to_string()),
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

pub async fn execute_focus(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    use ToolExecutionError as TE;

    let target_id = params
        .get("target_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| TE {
            code: crate::agent::tools::pipeline::ToolErrorCode::ValidationError,
            message: "target_id is required for focus action".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?
        .to_string();

    let mut state = get_or_init_state();

    if !state.running {
        return Err(TE {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    let tab = state.tabs.iter_mut().find(|t| t.id == target_id);
    if tab.is_none() {
        return Err(TE {
            code: crate::agent::tools::pipeline::ToolErrorCode::NotFound,
            message: format!("Tab not found: {}", target_id),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    for t in &mut state.tabs {
        t.active = false;
    }
    if let Some(t) = state.tabs.iter_mut().find(|t| t.id == target_id) {
        t.active = true;
    }

    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "focus".to_string(),
        success: true,
        message: Some(format!("Focused tab: {}", target_id)),
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

pub async fn execute_navigate(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    use ToolExecutionError as TE;

    let url = params
        .get("url")
        .and_then(|v| v.as_str())
        .ok_or_else(|| TE {
            code: crate::agent::tools::pipeline::ToolErrorCode::ValidationError,
            message: "URL is required and must be a string for navigate action".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?
        .to_string();

    let target_id = params
        .get("target_id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let mut state = get_or_init_state();

    if !state.running {
        return Err(TE {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    let tab = if let Some(id) = &target_id {
        state.tabs.iter_mut().find(|t| t.id == *id)
    } else {
        state.tabs.iter_mut().find(|t| t.active)
    };

    if let Some(tab) = tab {
        tab.url = url.clone();
        tab.loading = true;
    } else {
        return Err(TE {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "No active tab found".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    update_state(state.clone());

    Ok(BrowserInteractResult {
        action: "navigate".to_string(),
        success: true,
        message: Some(format!("Navigated to: {}", url)),
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

pub async fn execute_back(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
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
        action: "back".to_string(),
        success: false,
        message: Some("back action - requires Playwright integration".to_string()),
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

pub async fn execute_forward(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
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
        action: "forward".to_string(),
        success: false,
        message: Some("forward action - requires Playwright integration".to_string()),
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

pub async fn execute_refresh(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
    if !state.running {
        return Err(ToolExecutionError {
            code: crate::agent::tools::pipeline::ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }
    if let Some(tab) = state.tabs.iter_mut().find(|t| t.active) {
        tab.loading = true;
    }
    update_state(state.clone());
    Ok(BrowserInteractResult {
        action: "refresh".to_string(),
        success: false,
        message: Some("refresh action - requires Playwright integration".to_string()),
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
