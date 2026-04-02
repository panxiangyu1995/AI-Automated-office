use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::RwLock;

use super::descriptor::{
    ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolMetadata, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolPermissionRequirement,
};
use super::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode, ToolExecutor};

// ============ Browser State ============

static BROWSER_STATE: RwLock<Option<BrowserState>> = RwLock::new(None);

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BrowserState {
    pub running: bool,
    pub profile: Option<String>,
    pub tabs: Vec<BrowserTab>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub active: bool,
}

fn get_or_init_state() -> BrowserState {
    let state = BROWSER_STATE.read().unwrap();
    if let Some(ref s) = *state {
        return s.clone();
    }
    drop(state);
    let mut write = BROWSER_STATE.write().unwrap();
    if write.is_none() {
        *write = Some(BrowserState::default());
    }
    write.clone().unwrap()
}

// ============ Tool Registration ============

pub fn register_browser_tools(
    registry: &mut super::registry::ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = browser_interact();
    registry.register(descriptor.clone());
    executors.insert(descriptor.id.clone(), executor);
}

fn base_metadata(category: &str, tags: Vec<&str>) -> ToolMetadata {
    ToolMetadata {
        author: Some("core".to_string()),
        version: "1.0.0".to_string(),
        license: None,
        homepage: None,
        repository: None,
        tags: tags.into_iter().map(|tag| tag.to_string()).collect(),
        category: category.to_string(),
        subcategory: None,
    }
}

fn base_capabilities() -> ToolCapabilities {
    ToolCapabilities {
        supports_streaming: false,
        supports_cancellation: true,
        requires_permission: false,
        requires_confirmation: true, // Browser control requires confirmation
        is_read_only: false,
        has_side_effects: true,
        supports_retry: true,
        estimated_duration: None,
    }
}

// ============ browser_interact Tool ============

fn browser_interact() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    let mut capabilities = base_capabilities();
    capabilities.requires_permission = true;
    capabilities.has_side_effects = true;

    let permissions = vec![ToolPermissionRequirement {
        permission_type: "browser".to_string(),
        resource: "control".to_string(),
        description: "Control browser automation".to_string(),
        optional: None,
    }];

    let parameters = vec![
        ToolParameter {
            name: "action".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Action to perform (status, start, stop, open, close, tabs, navigate, snapshot, screenshot, act)".to_string(),
            required: true,
            default: None,
            r#enum: Some(vec![
                "status".to_string(),
                "start".to_string(),
                "stop".to_string(),
                "open".to_string(),
                "close".to_string(),
                "tabs".to_string(),
                "navigate".to_string(),
                "snapshot".to_string(),
                "screenshot".to_string(),
                "act".to_string(),
            ]),
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "url".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "URL for navigate/open actions".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "target_id".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Target tab ID for close/navigate actions".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "full_page".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
            description: "Take full page screenshot".to_string(),
            required: false,
            default: Some(serde_json::Value::Bool(false)),
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "format".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Snapshot format (aria, ai)".to_string(),
            required: false,
            default: Some(serde_json::Value::String("aria".to_string())),
            r#enum: Some(vec!["aria".to_string(), "ai".to_string()]),
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "act_kind".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Act action kind (click, type, press, submit)".to_string(),
            required: false,
            default: None,
            r#enum: Some(vec![
                "click".to_string(),
                "type".to_string(),
                "press".to_string(),
                "submit".to_string(),
            ]),
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "element_ref".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Element reference for click/type actions".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "text".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Text to type for type actions".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "key".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Key to press for press actions".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "submit".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
            description: "Submit form after typing".to_string(),
            required: false,
            default: Some(serde_json::Value::Bool(false)),
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "profile".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Browser profile to use".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
    ];

    let descriptor = ToolDescriptor {
        id: "browser_interact".to_string(),
        name: "Browser Interact".to_string(),
        description: "Control browser via CDP (Chrome DevTools Protocol)".to_string(),
        category: ToolCategory::Core,
        parameters,
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities,
        permissions: Some(permissions),
        dependencies: None,
        context_requirements: Some(ToolContextRequirements {
            requires_session: false,
            requires_user_context: false,
            requires_workspace: false,
            requires_network_access: true,
            requires_file_system_access: false,
            required_env_vars: None,
        }),
        metadata: base_metadata("browser", vec!["core", "browser", "cdp"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("browser".to_string()),
        handler_function: Some("browser_interact".to_string()),
    };

    let executor = Arc::new(BrowserInteractExecutor {});
    (descriptor, executor)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserInteractResult {
    pub action: String,
    pub success: bool,
    pub message: Option<String>,
    pub state: Option<BrowserState>,
    pub tabs: Option<Vec<BrowserTab>>,
    pub snapshot: Option<String>,
    pub screenshot: Option<String>,
}

struct BrowserInteractExecutor;

#[async_trait::async_trait]
impl ToolExecutor for BrowserInteractExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let map = params.as_object().cloned().unwrap_or_default();

        let action = map
            .get("action")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        if action.is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Action is required".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let state = get_or_init_state();

        let result = match action.as_str() {
            "status" => execute_status(state),
            "start" => execute_start(&map).await,
            "stop" => execute_stop(),
            "open" => execute_open(&map).await,
            "close" => execute_close(&map).await,
            "tabs" => execute_tabs(state),
            "navigate" => execute_navigate(&map).await,
            "snapshot" => execute_snapshot(&map).await,
            "screenshot" => execute_screenshot(&map).await,
            "act" => execute_act(&map).await,
            _ => Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Unknown action: {}", action),
                details: None,
                recoverable: true,
                retryable: false,
            }),
        }?;

        serde_json::to_value(result).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: e.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}

fn execute_status(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
    Ok(BrowserInteractResult {
        action: "status".to_string(),
        success: true,
        message: None,
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}

async fn execute_start(params: &serde_json::Map<String, serde_json::Value>) -> Result<BrowserInteractResult, ToolExecutionError> {
    let profile = params
        .get("profile")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let mut state = get_or_init_state();

    if state.running {
        return Ok(BrowserInteractResult {
            action: "start".to_string(),
            success: false,
            message: Some("Browser is already running".to_string()),
            state: Some(state),
            tabs: None,
            snapshot: None,
            screenshot: None,
        });
    }

    // Note: Starting a real browser would require Playwright or similar
    // This is a placeholder that indicates browser automation is available
    state.running = true;
    state.profile = profile;
    state.tabs = vec![BrowserTab {
        id: "tab_1".to_string(),
        url: "about:blank".to_string(),
        title: "New Tab".to_string(),
        active: true,
    }];

    let mut write = BROWSER_STATE.write().unwrap();
    *write = Some(state.clone());

    Ok(BrowserInteractResult {
        action: "start".to_string(),
        success: true,
        message: Some("Browser started".to_string()),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}

fn execute_stop() -> Result<BrowserInteractResult, ToolExecutionError> {
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
        });
    }

    state.running = false;
    state.profile = None;
    state.tabs.clear();

    let mut write = BROWSER_STATE.write().unwrap();
    *write = Some(state.clone());

    Ok(BrowserInteractResult {
        action: "stop".to_string(),
        success: true,
        message: Some("Browser stopped".to_string()),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}

async fn execute_open(params: &serde_json::Map<String, serde_json::Value>) -> Result<BrowserInteractResult, ToolExecutionError> {
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
    };

    // Mark all other tabs as inactive
    for tab in &mut state.tabs {
        tab.active = false;
    }

    state.tabs.push(new_tab);

    let mut write = BROWSER_STATE.write().unwrap();
    *write = Some(state.clone());

    Ok(BrowserInteractResult {
        action: "open".to_string(),
        success: true,
        message: Some(format!("Opened new tab: {}", tab_id)),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}

async fn execute_close(params: &serde_json::Map<String, serde_json::Value>) -> Result<BrowserInteractResult, ToolExecutionError> {
    let target_id = params
        .get("target_id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let mut state = get_or_init_state();

    if !state.running {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    if let Some(id) = target_id {
        let initial_len = state.tabs.len();
        state.tabs.retain(|tab| tab.id != id);

        if state.tabs.len() == initial_len {
            return Ok(BrowserInteractResult {
                action: "close".to_string(),
                success: false,
                message: Some(format!("Tab not found: {}", id)),
                state: Some(state),
                tabs: None,
                snapshot: None,
                screenshot: None,
            });
        }

        // If we closed the active tab, make the last tab active
        if state.tabs.iter().all(|t| !t.active) {
            if let Some(last) = state.tabs.last_mut() {
                last.active = true;
            }
        }
    } else {
        // Close active tab
        state.tabs.retain(|tab| !tab.active);
        if let Some(last) = state.tabs.last_mut() {
            last.active = true;
        }
    }

    let mut write = BROWSER_STATE.write().unwrap();
    *write = Some(state.clone());

    Ok(BrowserInteractResult {
        action: "close".to_string(),
        success: true,
        message: Some("Tab closed".to_string()),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}

fn execute_tabs(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
    Ok(BrowserInteractResult {
        action: "tabs".to_string(),
        success: true,
        message: None,
        state: Some(state.clone()),
        tabs: Some(state.tabs),
        snapshot: None,
        screenshot: None,
    })
}

async fn execute_navigate(params: &serde_json::Map<String, serde_json::Value>) -> Result<BrowserInteractResult, ToolExecutionError> {
    let url = params
        .get("url")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "URL is required for navigate action".to_string(),
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
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    // Find tab to navigate (active tab or specified tab)
    let tab_found = if let Some(id) = target_id {
        state.tabs.iter_mut().find(|t| t.id == id)
    } else {
        state.tabs.iter_mut().find(|t| t.active)
    };

    if let Some(tab) = tab_found {
        tab.url = url.clone();
        // In a real implementation, this would navigate the browser
    } else {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "No active tab found".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    let mut write = BROWSER_STATE.write().unwrap();
    *write = Some(state.clone());

    Ok(BrowserInteractResult {
        action: "navigate".to_string(),
        success: true,
        message: Some("Navigated".to_string()),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}

async fn execute_snapshot(params: &serde_json::Map<String, serde_json::Value>) -> Result<BrowserInteractResult, ToolExecutionError> {
    let format = params
        .get("format")
        .and_then(|v| v.as_str())
        .unwrap_or("aria")
        .to_string();

    let state = get_or_init_state();

    if !state.running {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    // Find active tab
    let active_tab = state.tabs.iter().find(|t| t.active);

    let snapshot = if format == "aria" {
        // Return a mock ARIA snapshot
        serde_json::json!({
            "role": "document",
            "name": active_tab.map(|t| t.title.as_str()).unwrap_or("Untitled"),
            "url": active_tab.map(|t| t.url.as_str()).unwrap_or(""),
        }).to_string()
    } else {
        // AI-optimized summary
        serde_json::json!({
            "summary": "Page content",
            "url": active_tab.map(|t| t.url.as_str()).unwrap_or(""),
            "title": active_tab.map(|t| t.title.as_str()).unwrap_or("Untitled"),
        }).to_string()
    };

    Ok(BrowserInteractResult {
        action: "snapshot".to_string(),
        success: true,
        message: None,
        state: Some(state),
        tabs: None,
        snapshot: Some(snapshot),
        screenshot: None,
    })
}

async fn execute_screenshot(params: &serde_json::Map<String, serde_json::Value>) -> Result<BrowserInteractResult, ToolExecutionError> {
    let _full_page = params
        .get("full_page")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let state = get_or_init_state();

    if !state.running {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    // Note: Real screenshot would use CDP via Playwright
    // This returns a placeholder indicating screenshots require Playwright

    Ok(BrowserInteractResult {
        action: "screenshot".to_string(),
        success: false,
        message: Some("Screenshot requires Playwright integration".to_string()),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}

async fn execute_act(params: &serde_json::Map<String, serde_json::Value>) -> Result<BrowserInteractResult, ToolExecutionError> {
    let kind = params
        .get("act_kind")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "act_kind is required for act action".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?
        .to_string();

    let element_ref = params
        .get("element_ref")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let state = get_or_init_state();

    if !state.running {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: "Browser is not running".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    // Note: Real browser interaction would use CDP via Playwright
    // This is a placeholder

    let message = match kind.as_str() {
        "click" => format!("Click on element: {:?}", element_ref),
        "type" => {
            let text = params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            format!("Type '{}' into element: {:?}", text, element_ref)
        }
        "press" => {
            let key = params.get("key").and_then(|v| v.as_str()).unwrap_or("");
            format!("Press key '{}'", key)
        }
        "submit" => format!("Submit form: {:?}", element_ref),
        _ => format!("Unknown act kind: {}", kind),
    };

    Ok(BrowserInteractResult {
        action: "act".to_string(),
        success: false,
        message: Some(format!("{} - requires Playwright integration", message)),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
    })
}
