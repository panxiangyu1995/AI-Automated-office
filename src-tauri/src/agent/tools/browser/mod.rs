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

pub mod console;
pub mod control;
pub mod download;
pub mod interaction;
pub mod navigation;
pub mod network;
pub mod snapshot;
pub mod state;
pub mod storage;

// Re-export action handlers from submodules for use in the main executor
pub use console::execute_get_console_messages;
pub use control::{execute_status, execute_start, execute_stop, execute_profiles, execute_tabs};
pub use download::{execute_arm_download, execute_wait_for_download};
pub use interaction::{execute_act, execute_arm_file_chooser, execute_disarm_file_chooser, execute_arm_dialog, execute_accept_dialog, execute_dismiss_dialog};
pub use navigation::{execute_open, execute_close, execute_focus, execute_navigate, execute_back, execute_forward, execute_refresh};
pub use network::{execute_get_network_requests, execute_get_response_body};
pub use snapshot::{execute_snapshot, execute_screenshot};
pub use state::{execute_set_offline, execute_set_extra_headers, execute_set_geolocation};
pub use storage::{execute_get_cookies, execute_set_cookies, execute_get_local_storage, execute_get_session_storage};

use std::collections::HashMap;
use std::sync::RwLock;

use crate::agent::tools::descriptor::ToolDescriptor;
use crate::agent::tools::pipeline::ToolExecutor;
use std::sync::Arc;
use std::collections::HashMap as HashMapType;
use crate::agent::tools::common::{
    base_metadata, base_writable_capabilities,
};
use crate::agent::tools::descriptor::{
    ToolCategory, ToolContextRequirements, ToolExecutionMode,
    ToolPermissionRequirement,
};

// ============ Browser State ============

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
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

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub active: bool,
    pub loading: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DialogArm {
    pub accept: bool,
    pub prompt_text: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cookie {
    pub name: String,
    pub value: String,
    pub domain: Option<String>,
    pub path: Option<String>,
}

static BROWSER_STATE: RwLock<Option<BrowserState>> = RwLock::new(None);

pub fn get_or_init_state() -> BrowserState {
    let state = BROWSER_STATE.read()
        .expect("BROWSER_STATE poison: Failed to read browser state");
    if let Some(ref s) = *state {
        return s.clone();
    }
    drop(state);
    let mut write = BROWSER_STATE.write()
        .expect("BROWSER_STATE poison: Failed to write browser state");
    if write.is_none() {
        *write = Some(BrowserState::default());
    }
    write.clone().expect("BROWSER_STATE: Failed to clone initialized state")
}

pub fn update_state(state: BrowserState) {
    let mut write = BROWSER_STATE.write()
        .expect("BROWSER_STATE poison: Failed to write browser state");
    *write = Some(state);
}

// ============ CDP Client (Placeholder) ============

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

    pub fn is_available() -> bool {
        false
    }

    pub async fn launch(&mut self, profile: &str) -> Result<String, String> {
        let id = format!("browser_{}", uuid::Uuid::new_v4());
        self.browser_id = Some(id.clone());
        Ok(id)
    }

    pub async fn send_cmd(&self, method: &str, _params: serde_json::Value) -> Result<serde_json::Value, String> {
        Err("CDP not available - Playwright integration required".to_string())
    }
}

// ============ Result Types ============

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
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

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConsoleMessage {
    pub level: String,
    pub text: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkRequest {
    pub url: String,
    pub method: String,
    pub status: Option<u16>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageData {
    pub local_storage: HashMap<String, String>,
    pub session_storage: HashMap<String, String>,
}

// ============ Tool Registration ============

pub fn register_browser_tools(
    registry: &mut crate::agent::tools::registry::ToolRegistry,
    executors: &mut HashMapType<String, Arc<dyn ToolExecutor>>,
) {
    let (descriptor, executor) = browser_interact();
    registry.register(descriptor);
    executors.insert("browser_interact".to_string(), executor);
}

fn browser_interact() -> (ToolDescriptor, Arc<dyn ToolExecutor>) {
    use crate::agent::tools::descriptor::{ToolParameter, ToolParameterType, ToolParameterTypeSpec};

    let mut capabilities = base_writable_capabilities();
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
            description: "Action to perform (status/start/stop/profiles/tabs/open/close/focus/navigate/back/forward/refresh/snapshot/screenshot/act/arm_file_chooser/disarm_file_chooser/arm_dialog/accept_dialog/dismiss_dialog/arm_download/get_console_messages/get_network_requests/set_offline/get_cookies/set_cookies/get_local_storage/get_session_storage)"
                .to_string(),
            required: true,
            default: None,
            r#enum: Some(vec![
                "status".to_string(), "start".to_string(), "stop".to_string(),
                "profiles".to_string(), "tabs".to_string(), "open".to_string(),
                "close".to_string(), "focus".to_string(), "navigate".to_string(),
                "back".to_string(), "forward".to_string(), "refresh".to_string(),
                "snapshot".to_string(), "screenshot".to_string(), "act".to_string(),
                "arm_file_chooser".to_string(), "disarm_file_chooser".to_string(),
                "arm_dialog".to_string(), "accept_dialog".to_string(), "dismiss_dialog".to_string(),
                "arm_download".to_string(), "wait_for_download".to_string(),
                "get_console_messages".to_string(), "get_network_requests".to_string(),
                "get_response_body".to_string(), "set_offline".to_string(),
                "set_extra_headers".to_string(), "set_geolocation".to_string(),
                "get_cookies".to_string(), "set_cookies".to_string(),
                "get_local_storage".to_string(), "get_session_storage".to_string(),
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
        ToolParameter {
            name: "act_kind".to_string(),
            param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
            description: "Interaction kind (click/dblclick/rightclick/hover/type/press/select/fill/drag/submit/batch)".to_string(),
            required: false,
            default: None,
            r#enum: Some(vec![
                "click".to_string(), "dblclick".to_string(), "rightclick".to_string(),
                "hover".to_string(), "type".to_string(), "press".to_string(),
                "select".to_string(), "fill".to_string(), "drag".to_string(),
                "submit".to_string(), "batch".to_string(),
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
        description: "Full-featured browser automation via CDP. Supports navigation, interaction, snapshot, storage, and state management.".to_string(),
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

// ============ Executor ============

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolErrorCode};
use async_trait::async_trait;
use std::time::Instant;

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

        let result = match action.as_str() {
            // === Browser Control ===
            "status" => execute_status(state),
            "start" => {
                let cdp_client = self.cdp_client.write().unwrap().take();
                let (result, new_client) = execute_start(&map, cdp_client).await;
                if result.as_ref().map(|r| r.success).unwrap_or(false) {
                    if let Some(client) = new_client {
                        *self.cdp_client.write().unwrap() = Some(client);
                    }
                } else if new_client.is_some() {
                    *self.cdp_client.write().unwrap() = new_client;
                } else {
                    *self.cdp_client.write().unwrap() = result.as_ref().ok().and_then(|_| None);
                }
                result
            }
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
            "arm_file_chooser" => execute_arm_file_chooser(&map).await,
            "disarm_file_chooser" => execute_disarm_file_chooser(&map).await,
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
