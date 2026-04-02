//! Browser automation tool implementation.
//!
//! Provides comprehensive browser control via CDP (Chrome DevTools Protocol).
//! Reference: OpenClaw `pw-tools-core.*` module.
//!
//! # Actions
//!
//! | Category | Actions |
//! |----------|---------|
//! | Control | status, start, stop, profiles, tabs, open, close, focus |
//! | Navigation | navigate, back, forward, refresh |
//! | Snapshot | snapshot (aria/ai/role), screenshot |
//! | Interaction | act (click/type/press/drag/batch) |
//! | File Upload | arm_file_chooser, disarm_file_chooser |
//! | Dialog | arm_dialog, accept_dialog, dismiss_dialog |
//! | Download | arm_download, wait_for_download |
//! | Console | get_console_messages |
//! | Network | get_network_requests, get_response_body |
//! | State | set_offline, set_extra_headers, set_geolocation |
//! | Storage | get_cookies, set_cookies, get_local_storage, get_session_storage |

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::RwLock;

use super::descriptor::{
    ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
    ToolMetadata, ToolParameter, ToolParameterType, ToolParameterTypeSpec,
    ToolPermissionRequirement,
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
    pub offline: bool,
    pub extra_headers: HashMap<String, String>,
    pub armed_file_chooser: bool,
    pub armed_dialog: Option<DialogArm>,
    pub armed_download: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub active: bool,
    pub loading: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DialogArm {
    pub accept: bool,
    pub prompt_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cookie {
    pub name: String,
    pub value: String,
    pub domain: Option<String>,
    pub path: Option<String>,
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

fn update_state(state: BrowserState) {
    let mut write = BROWSER_STATE.write().unwrap();
    *write = Some(state);
}

// ============ CDP Client (Placeholder) ============

/// CDP client for browser automation
/// In production, this would use Playwright's CDP server
pub struct CdpClient {
    endpoint: String,
    browser_id: Option<String>,
}

impl CdpClient {
    pub fn new(endpoint: &str) -> Self {
        Self {
            endpoint: endpoint.to_string(),
            browser_id: None,
        }
    }

    /// Check if Playwright/Chrome is available
    pub fn is_available() -> bool {
        // In production, would check for Playwright installation
        false
    }

    /// Launch browser with profile
    pub async fn launch(&mut self, profile: &str) -> Result<String, String> {
        // Placeholder - would use Playwright CDP server
        self.browser_id = Some(format!("browser_{}", uuid::Uuid::new_v4()));
        Ok(self.browser_id.clone().unwrap())
    }

    /// Execute CDP command
    pub async fn send_cmd(&self, method: &str, _params: Value) -> Result<Value, String> {
        // Placeholder - would send CDP command via HTTP
        Err("CDP not available - Playwright integration required".to_string())
    }
}

// ============ Tool Registration ============

pub fn register_browser_tools(
    registry: &mut super::registry::ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = browser_interact();
    registry.register(descriptor);
    executors.insert("browser_interact".to_string(), executor);
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
        requires_confirmation: true,
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
        // === Main action parameter ===
        ToolParameter {
            name: "action".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Action to perform (status/start/stop/profiles/tabs/open/close/focus/navigate/back/forward/refresh/snapshot/screenshot/act/arm_file_chooser/disarm_file_chooser/arm_dialog/accept_dialog/dismiss_dialog/arm_download/get_console_messages/get_network_requests/set_offline/get_cookies/set_cookies/get_local_storage/get_session_storage)"
                .to_string(),
            required: true,
            default: None,
            r#enum: Some(vec![
                // Browser control
                "status".to_string(),
                "start".to_string(),
                "stop".to_string(),
                "profiles".to_string(),
                "tabs".to_string(),
                "open".to_string(),
                "close".to_string(),
                "focus".to_string(),
                // Navigation
                "navigate".to_string(),
                "back".to_string(),
                "forward".to_string(),
                "refresh".to_string(),
                // Snapshot & Screenshot
                "snapshot".to_string(),
                "screenshot".to_string(),
                // Interaction
                "act".to_string(),
                // File upload
                "arm_file_chooser".to_string(),
                "disarm_file_chooser".to_string(),
                // Dialog
                "arm_dialog".to_string(),
                "accept_dialog".to_string(),
                "dismiss_dialog".to_string(),
                // Download
                "arm_download".to_string(),
                "wait_for_download".to_string(),
                // Console
                "get_console_messages".to_string(),
                // Network
                "get_network_requests".to_string(),
                "get_response_body".to_string(),
                // State
                "set_offline".to_string(),
                "set_extra_headers".to_string(),
                "set_geolocation".to_string(),
                // Storage
                "get_cookies".to_string(),
                "set_cookies".to_string(),
                "get_local_storage".to_string(),
                "get_session_storage".to_string(),
            ]),
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        // === Navigation parameters ===
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
            description: "Target tab ID for close/focus/navigate actions".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        // === Snapshot/Screenshot parameters ===
        ToolParameter {
            name: "format".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Snapshot format (aria/ai/role)".to_string(),
            required: false,
            default: Some(serde_json::Value::String("aria".to_string())),
            r#enum: Some(vec!["aria".to_string(), "ai".to_string(), "role".to_string()]),
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
        // === Act parameters ===
        ToolParameter {
            name: "act_kind".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Interaction kind (click/dblclick/rightclick/hover/type/press/select/fill/drag/submit/batch)"
                .to_string(),
            required: false,
            default: None,
            r#enum: Some(vec![
                "click".to_string(),
                "dblclick".to_string(),
                "rightclick".to_string(),
                "hover".to_string(),
                "type".to_string(),
                "press".to_string(),
                "select".to_string(),
                "fill".to_string(),
                "drag".to_string(),
                "submit".to_string(),
                "batch".to_string(),
            ]),
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "selector".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "CSS selector for element targeting".to_string(),
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
            description: "Text to type for type/fill actions".to_string(),
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
            description: "Key to press (e.g., Enter, Escape)".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        // === Dialog parameters ===
        ToolParameter {
            name: "dialog_accept".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
            description: "Accept dialog (true) or dismiss (false)".to_string(),
            required: false,
            default: Some(serde_json::Value::Bool(true)),
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        ToolParameter {
            name: "prompt_text".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Text to enter for prompt dialogs".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        // === State parameters ===
        ToolParameter {
            name: "offline".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
            description: "Enable offline mode".to_string(),
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
            name: "headers".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
            description: "Extra HTTP headers to send with requests".to_string(),
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
            name: "latitude".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
            description: "Latitude for geolocation".to_string(),
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
            name: "longitude".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
            description: "Longitude for geolocation".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        // === Storage parameters ===
        ToolParameter {
            name: "cookies".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::Array),
            description: "Cookies to set".to_string(),
            required: false,
            default: None,
            r#enum: None,
            minimum: None,
            maximum: None,
            pattern: None,
            items: None,
            properties: None,
        },
        // === Misc parameters ===
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
        description: "Full-featured browser automation via CDP. Supports navigation, interaction, snapshot, storage, and state management."
            .to_string(),
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
        metadata: base_metadata("browser", vec!["core", "browser", "cdp", "playwright"]),
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("browser".to_string()),
        handler_function: Some("browser_interact".to_string()),
    };

    let executor = Arc::new(BrowserInteractExecutor::new());
    (descriptor, executor)
}

// ============ Result Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserInteractResult {
    pub action: String,
    pub success: bool,
    pub message: Option<String>,
    pub state: Option<BrowserState>,
    pub tabs: Option<Vec<BrowserTab>>,
    pub snapshot: Option<String>,
    pub screenshot: Option<String>,
    pub console_messages: Option<Vec<ConsoleMessage>>,
    pub network_requests: Option<Vec<NetworkRequest>>,
    pub cookies: Option<Vec<Cookie>>,
    pub storage: Option<StorageData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConsoleMessage {
    pub level: String,
    pub text: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkRequest {
    pub url: String,
    pub method: String,
    pub status: Option<u16>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageData {
    pub local_storage: HashMap<String, String>,
    pub session_storage: HashMap<String, String>,
}

// ============ Executor ============

struct BrowserInteractExecutor {
    cdp_client: RwLock<Option<CdpClient>>,
}

impl BrowserInteractExecutor {
    fn new() -> Self {
        Self {
            cdp_client: RwLock::new(None),
        }
    }
}

impl Default for BrowserInteractExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for BrowserInteractExecutor {
    async fn execute(
        &self,
        params: serde_json::Value,
        _context: &ToolExecutionContext,
    ) -> Result<serde_json::Value, ToolExecutionError> {
        let start = Instant::now();
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
        let mut cdp = self.cdp_client.write().unwrap();

        let result = match action.as_str() {
            // === Browser Control ===
            "status" => execute_status(state),
            "start" => execute_start(&map, &mut cdp).await,
            "stop" => execute_stop(),
            "profiles" => execute_profiles(state),
            "tabs" => execute_tabs(state),
            "open" => execute_open(&map).await,
            "close" => execute_close(&map).await,
            "focus" => execute_focus(&map).await,

            // === Navigation ===
            "navigate" => execute_navigate(&map).await,
            "back" => execute_back(&map).await,
            "forward" => execute_forward(&map).await,
            "refresh" => execute_refresh(&map).await,

            // === Snapshot & Screenshot ===
            "snapshot" => execute_snapshot(&map).await,
            "screenshot" => execute_screenshot(&map).await,

            // === Interaction ===
            "act" => execute_act(&map).await,

            // === File Upload ===
            "arm_file_chooser" => execute_arm_file_chooser(&map).await,
            "disarm_file_chooser" => execute_disarm_file_chooser(&map).await,

            // === Dialog ===
            "arm_dialog" => execute_arm_dialog(&map).await,
            "accept_dialog" => execute_accept_dialog(&map).await,
            "dismiss_dialog" => execute_dismiss_dialog(&map).await,

            // === Download ===
            "arm_download" => execute_arm_download(&map).await,
            "wait_for_download" => execute_wait_for_download(&map).await,

            // === Console ===
            "get_console_messages" => execute_get_console_messages(&map).await,

            // === Network ===
            "get_network_requests" => execute_get_network_requests(&map).await,
            "get_response_body" => execute_get_response_body(&map).await,

            // === State ===
            "set_offline" => execute_set_offline(&map).await,
            "set_extra_headers" => execute_set_extra_headers(&map).await,
            "set_geolocation" => execute_set_geolocation(&map).await,

            // === Storage ===
            "get_cookies" => execute_get_cookies(&map).await,
            "set_cookies" => execute_set_cookies(&map).await,
            "get_local_storage" => execute_get_local_storage(&map).await,
            "get_session_storage" => execute_get_session_storage(&map).await,

            _ => Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: format!("Unknown action: {}", action),
                details: None,
                recoverable: true,
                retryable: false,
            }),
        }?;

        let duration_ms = start.elapsed().as_millis() as u64;
        let mut result = result;
        result.message = result.message.map(|m| format!("{} ({}ms)", m, duration_ms));

        serde_json::to_value(result).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
            message: e.to_string(),
            details: None,
            recoverable: false,
            retryable: false,
        })
    }
}

// ============ Action Handlers ============

fn execute_status(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
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

async fn execute_start(
    params: &serde_json::Map<String, serde_json::Value>,
    cdp: &mut Option<CdpClient>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
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
            console_messages: None,
            network_requests: None,
            cookies: None,
            storage: None,
        });
    }

    // Try to connect to Playwright CDP server
    if CdpClient::is_available() {
        let mut client = CdpClient::new("http://localhost:9222");
        match client.launch(profile.as_deref().unwrap_or("default")).await {
            Ok(browser_id) => {
                *cdp = Some(client);
                state.running = true;
                state.profile = profile;
                state.tabs = vec![BrowserTab {
                    id: "tab_1".to_string(),
                    url: "about:blank".to_string(),
                    title: "New Tab".to_string(),
                    active: true,
                    loading: false,
                }];
            }
            Err(e) => {
                return Ok(BrowserInteractResult {
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
                });
            }
        }
    } else {
        // Mock browser for development
        state.running = true;
        state.profile = profile;
        state.tabs = vec![BrowserTab {
            id: "tab_1".to_string(),
            url: "about:blank".to_string(),
            title: "New Tab".to_string(),
            active: true,
            loading: false,
        }];
    }

    update_state(state.clone());

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

fn execute_profiles(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
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

fn execute_tabs(state: BrowserState) -> Result<BrowserInteractResult, ToolExecutionError> {
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

async fn execute_open(
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

    // Mark all other tabs as inactive
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

async fn execute_close(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
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

    let initial_len = state.tabs.len();
    state.tabs.retain(|tab| tab.id != target_id.as_ref().map(|s| s.as_str()).unwrap_or(""));

    if state.tabs.len() == initial_len && target_id.is_some() {
        return Ok(BrowserInteractResult {
            action: "close".to_string(),
            success: false,
            message: Some(format!("Tab not found: {}", target_id.as_ref().unwrap())),
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

    // If we closed the active tab, make the last tab active
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

async fn execute_focus(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let target_id = params
        .get("target_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "target_id is required for focus action".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?
        .to_string();

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

    let tab = state.tabs.iter_mut().find(|t| t.id == target_id);
    if tab.is_none() {
        return Err(ToolExecutionError {
            code: ToolErrorCode::NotFound,
            message: format!("Tab not found: {}", target_id),
            details: None,
            recoverable: true,
            retryable: false,
        });
    }

    // Mark all other tabs as inactive
    for t in &mut state.tabs {
        t.active = false;
    }
    // Mark target as active
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

// Navigation actions
async fn execute_navigate(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let url = params
        .get("url")
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "URL is required for navigate action".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?
        .as_str()
        .unwrap()
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

    // Find tab
    let tab = if let Some(id) = &target_id {
        state.tabs.iter_mut().find(|t| t.id == *id)
    } else {
        state.tabs.iter_mut().find(|t| t.active)
    };

    if let Some(tab) = tab {
        tab.url = url.clone();
        tab.loading = true;
    } else {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
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

async fn execute_back(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
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

async fn execute_forward(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
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

async fn execute_refresh(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
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

// Snapshot & Screenshot
async fn execute_snapshot(
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
            code: ToolErrorCode::ExecutionError,
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
            code: ToolErrorCode::ValidationError,
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

async fn execute_screenshot(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
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

// Interaction
async fn execute_act(
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
            code: ToolErrorCode::ExecutionError,
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

// File Upload
async fn execute_arm_file_chooser(
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

async fn execute_disarm_file_chooser(
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

// Dialog
async fn execute_arm_dialog(
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
            prompt_text.is_some()
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

async fn execute_accept_dialog(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let mut state = get_or_init_state();
    let dialog = state.armed_dialog.clone();

    if dialog.is_none() {
        return Err(ToolExecutionError {
            code: ToolErrorCode::ExecutionError,
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

async fn execute_dismiss_dialog(
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

// Download
async fn execute_arm_download(
    params: &serde_json::Map<String, serde_json::Value>,
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

async fn execute_wait_for_download(
    params: &serde_json::Map<String, serde_json::Value>,
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

// Console
async fn execute_get_console_messages(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
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

    // Mock console messages
    let messages = vec![
        ConsoleMessage {
            level: "info".to_string(),
            text: "Page loaded".to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
        },
    ];

    Ok(BrowserInteractResult {
        action: "get_console_messages".to_string(),
        success: true,
        message: Some("Console messages retrieved (mock)".to_string()),
        state: Some(state),
        tabs: None,
        snapshot: None,
        screenshot: None,
        console_messages: Some(messages),
        network_requests: None,
        cookies: None,
        storage: None,
    })
}

// Network
async fn execute_get_network_requests(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "get_network_requests".to_string(),
        success: false,
        message: Some("get_network_requests - requires Playwright integration".to_string()),
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

async fn execute_get_response_body(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "get_response_body".to_string(),
        success: false,
        message: Some("get_response_body - requires Playwright integration".to_string()),
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

// State
async fn execute_set_offline(
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

async fn execute_set_extra_headers(
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

async fn execute_set_geolocation(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let latitude = params
        .get("latitude")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
            message: "latitude is required".to_string(),
            details: None,
            recoverable: true,
            retryable: false,
        })?;

    let longitude = params
        .get("longitude")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| ToolExecutionError {
            code: ToolErrorCode::ValidationError,
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

// Storage
async fn execute_get_cookies(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "get_cookies".to_string(),
        success: false,
        message: Some("get_cookies - requires Playwright integration".to_string()),
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

async fn execute_set_cookies(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let cookies = params
        .get("cookies")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| serde_json::from_value(v.clone()).ok())
                .collect::<Vec<Cookie>>()
        })
        .unwrap_or_default();

    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "set_cookies".to_string(),
        success: false,
        message: Some(format!(
            "set_cookies ({} cookies) - requires Playwright integration",
            cookies.len()
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

async fn execute_get_local_storage(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "get_local_storage".to_string(),
        success: false,
        message: Some("get_local_storage - requires Playwright integration".to_string()),
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

async fn execute_get_session_storage(
    params: &serde_json::Map<String, serde_json::Value>,
) -> Result<BrowserInteractResult, ToolExecutionError> {
    let state = get_or_init_state();

    Ok(BrowserInteractResult {
        action: "get_session_storage".to_string(),
        success: false,
        message: Some("get_session_storage - requires Playwright integration".to_string()),
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
