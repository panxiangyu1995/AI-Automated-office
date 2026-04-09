//! Profile-driven tool selection system.
//!
//! This module implements OpenClaw-style profile-based tool filtering,
//! allowing dynamic tool selection based on usage scenarios.
//!
//! # Profiles
//!
//! - **Minimal**: Only basic tools (session_status, system_*)
//! - **Coding**: Full coding toolkit (filesystem, shell, web, browser, memory, sessions)
//! - **Messaging**: Messaging-focused tools (sessions, message)
//! - **Full**: No restrictions
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::agent::tools::profile::{
//!     ToolProfile, get_tools_for_profile, filter_tools_by_profile,
//! };
//!
//! let profile = ToolProfile::Coding;
//! let allowed_tools = get_tools_for_profile(profile);
//! ```

use std::collections::HashMap;
use std::sync::Arc;

use serde::{Deserialize, Serialize};

use super::descriptor::ToolDescriptor;

/// Profile ID type for serialization
pub type ProfileId = &'static str;

/// Tool profile enumeration matching OpenClaw's tool-catalog.ts profiles
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolProfile {
    /// Minimal profile - only basic tools
    Minimal,
    /// Coding profile - full coding toolkit
    Coding,
    /// Messaging profile - messaging-focused tools
    Messaging,
    /// Full profile - no restrictions
    Full,
}

impl Default for ToolProfile {
    fn default() -> Self {
        Self::Coding
    }
}

impl std::fmt::Display for ToolProfile {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ToolProfile::Minimal => write!(f, "minimal"),
            ToolProfile::Coding => write!(f, "coding"),
            ToolProfile::Messaging => write!(f, "messaging"),
            ToolProfile::Full => write!(f, "full"),
        }
    }
}

impl std::str::FromStr for ToolProfile {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "minimal" => Ok(ToolProfile::Minimal),
            "coding" => Ok(ToolProfile::Coding),
            "messaging" => Ok(ToolProfile::Messaging),
            "full" => Ok(ToolProfile::Full),
            _ => Err(format!("Unknown profile: {}", s)),
        }
    }
}

/// Get the list of tool IDs allowed for a given profile
///
/// # Arguments
/// * `profile` - The tool profile
///
/// # Returns
/// A vector of tool IDs allowed for the profile
pub fn get_tools_for_profile(profile: ToolProfile) -> Vec<&'static str> {
    match profile {
        ToolProfile::Minimal => vec![
            "session_status",
            "system_get_app_version",
            "system_get_platform",
            "network_check_status",
            "network_get_status",
        ],
        ToolProfile::Coding => vec![
            // Filesystem tools
            "file_read",
            "file_write",
            "file_edit",
            "dir_list",
            // Shell tools
            "sandbox_execute",
            "pattern_search",
            // Web tools
            "web_search",
            "web_fetch",
            "http_request",
            // Browser tools
            "browser_interact",
            // Document tools
            "document_parse",
            "document_convert",
            // Memory tools
            "memory_search",
            "memory_get",
            // Session tools
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "sessions_yield",
            "session_status",
            // Message tools
            "message_send",
            // Media tools
            "image_understand",
            "tts_speak",
            // Automation tools
            "cron_schedule",
            "cron_list",
            "cron_cancel",
            // Enterprise tools
            "resource_query",
            "resource_upload",
            "knowledge_query",
            "knowledge_submit_draft",
            "workspace_stage_change",
            "agent_delegate",
            "db_query",
        ],
        ToolProfile::Messaging => vec![
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "session_status",
            "message_send",
            "system_get_app_version",
            "system_get_platform",
            "network_check_status",
        ],
        ToolProfile::Full => vec![], // No restrictions - empty vec means allow all
    }
}

/// Check if a tool is allowed for a given profile
///
/// # Arguments
/// * `tool_id` - The tool ID to check
/// * `profile` - The tool profile
///
/// # Returns
/// `true` if the tool is allowed, `false` otherwise
pub fn is_tool_allowed_for_profile(tool_id: &str, profile: ToolProfile) -> bool {
    let allowed_tools = get_tools_for_profile(profile);
    // Full profile has no restrictions (empty vec = allow all)
    allowed_tools.is_empty() || allowed_tools.contains(&tool_id)
}

/// Filter a list of tool descriptors by profile
///
/// # Arguments
/// * `tools` - The list of tool descriptors
/// * `profile` - The tool profile
///
/// # Returns
/// A vector of tool descriptors allowed for the profile
pub fn filter_tools_by_profile(
    tools: &[ToolDescriptor],
    profile: ToolProfile,
) -> Vec<ToolDescriptor> {
    let allowed_tools = get_tools_for_profile(profile);

    // Full profile has no restrictions
    if allowed_tools.is_empty() {
        return tools.to_vec();
    }

    tools
        .iter()
        .filter(|t| allowed_tools.contains(&t.id.as_str()))
        .cloned()
        .collect()
}

/// Profile-specific configuration for tool overrides
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ToolProfileConfig {
    /// Additional allowed tool IDs (merged into profile allowlist)
    #[serde(default)]
    pub also_allow: Vec<String>,

    /// Explicitly denied tool IDs (takes precedence)
    #[serde(default)]
    pub deny: Vec<String>,
}

/// Global tools configuration
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ToolsConfig {
    /// Default profile for tool selection
    #[serde(default = "default_profile")]
    pub default_profile: ToolProfile,

    /// Profile-specific overrides
    #[serde(default)]
    pub profile_overrides: HashMap<String, ToolProfileConfig>,
}

fn default_profile() -> ToolProfile {
    ToolProfile::Coding
}

/// Resolve the effective allowed tools for a profile with config overrides
///
/// # Arguments
/// * `profile` - The base profile
/// * `config` - Optional profile configuration for overrides
///
/// # Returns
/// A sorted vector of allowed tool IDs
pub fn resolve_allowed_tools(
    profile: ToolProfile,
    config: Option<&ToolProfileConfig>,
) -> Vec<String> {
    let mut allowed = get_tools_for_profile(profile)
        .into_iter()
        .map(String::from)
        .collect::<Vec<_>>();

    // Full profile - add all overrides but no base restrictions
    if allowed.is_empty() {
        if let Some(cfg) = config {
            for tool_id in &cfg.also_allow {
                if !allowed.contains(tool_id) {
                    allowed.push(tool_id.clone());
                }
            }
        }
        allowed.sort();
        return allowed;
    }

    // Apply also_allow additions
    if let Some(cfg) = config {
        for tool_id in &cfg.also_allow {
            if !allowed.contains(tool_id) {
                allowed.push(tool_id.clone());
            }
        }
    }

    // Sort for consistent output
    allowed.sort();
    allowed
}

/// Check if a tool is allowed considering profile and config
///
/// # Arguments
/// * `tool_id` - The tool ID to check
/// * `profile` - The base profile
/// * `config` - Optional profile configuration
///
/// # Returns
/// `true` if the tool is allowed, `false` if denied or not in allowlist
pub fn check_tool_access(
    tool_id: &str,
    profile: ToolProfile,
    config: Option<&ToolProfileConfig>,
) -> bool {
    let allowed = resolve_allowed_tools(profile, config);

    // Full profile with no config = allow all
    if allowed.is_empty() && config.is_none() {
        return true;
    }

    // Check if in deny list first (deny takes precedence)
    if let Some(cfg) = config {
        if cfg.deny.contains(&tool_id.to_string()) {
            return false;
        }
    }

    // Check if in allow list
    allowed.contains(&tool_id.to_string())
}

/// Profile information for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileInfo {
    pub id: String,
    pub label: String,
    pub description: String,
    pub tool_count: usize,
}

impl ToolProfile {
    /// Get profile metadata
    pub fn info(&self) -> ProfileInfo {
        let tool_count = get_tools_for_profile(*self).len();
        let (label, description) = match self {
            ToolProfile::Minimal => (
                "Minimal",
                "Only basic tools like session status and system info",
            ),
            ToolProfile::Coding => (
                "Coding",
                "Full coding toolkit including filesystem, shell, web, browser, memory, and sessions",
            ),
            ToolProfile::Messaging => (
                "Messaging",
                "Messaging-focused tools for chat and communication",
            ),
            ToolProfile::Full => ("Full", "All tools without restrictions"),
        };

        ProfileInfo {
            id: self.to_string(),
            label: label.to_string(),
            description: description.to_string(),
            tool_count,
        }
    }
}

/// Get all available profile infos
pub fn get_all_profile_infos() -> Vec<ProfileInfo> {
    vec![
        ToolProfile::Minimal.info(),
        ToolProfile::Coding.info(),
        ToolProfile::Messaging.info(),
        ToolProfile::Full.info(),
    ]
}

/// Thread-safe profile manager for runtime profile switching
#[derive(Clone, Default)]
pub struct ProfileManager {
    current_profile: Arc<std::sync::RwLock<ToolProfile>>,
    config: Arc<std::sync::RwLock<ToolsConfig>>,
}

impl ProfileManager {
    pub fn new() -> Self {
        Self {
            current_profile: Arc::new(std::sync::RwLock::new(ToolProfile::Coding)),
            config: Arc::new(std::sync::RwLock::new(ToolsConfig::default())),
        }
    }

    pub fn with_profile(profile: ToolProfile) -> Self {
        Self {
            current_profile: Arc::new(std::sync::RwLock::new(profile)),
            config: Arc::new(std::sync::RwLock::new(ToolsConfig::default())),
        }
    }

    pub fn get_current_profile(&self) -> ToolProfile {
        *self.current_profile.read().unwrap()
    }

    pub fn set_profile(&self, profile: ToolProfile) {
        *self.current_profile.write().unwrap() = profile;
    }

    pub fn get_config(&self) -> ToolsConfig {
        self.config.read().unwrap().clone()
    }

    pub fn set_config(&self, config: ToolsConfig) {
        *self.config.write().unwrap() = config;
    }

    pub fn check_access(&self, tool_id: &str) -> bool {
        let profile = self.get_current_profile();
        let config = self.config.read().unwrap();
        let profile_config = config.profile_overrides.get(&profile.to_string());
        check_tool_access(tool_id, profile, profile_config)
    }

    pub fn get_allowed_tools(&self) -> Vec<String> {
        let profile = self.get_current_profile();
        let config = self.config.read().unwrap();
        let profile_config = config.profile_overrides.get(&profile.to_string());
        resolve_allowed_tools(profile, profile_config)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_profile_default() {
        assert_eq!(ToolProfile::default(), ToolProfile::Coding);
    }

    #[test]
    fn test_profile_display() {
        assert_eq!(ToolProfile::Minimal.to_string(), "minimal");
        assert_eq!(ToolProfile::Coding.to_string(), "coding");
        assert_eq!(ToolProfile::Messaging.to_string(), "messaging");
        assert_eq!(ToolProfile::Full.to_string(), "full");
    }

    #[test]
    fn test_profile_from_str() {
        assert_eq!("minimal".parse().unwrap(), ToolProfile::Minimal);
        assert_eq!("CODING".parse().unwrap(), ToolProfile::Coding);
        assert!("unknown".parse::<ToolProfile>().is_err());
    }

    #[test]
    fn test_get_tools_for_profile() {
        let minimal = get_tools_for_profile(ToolProfile::Minimal);
        assert!(minimal.contains(&"session_status"));
        assert!(!minimal.contains(&"file_read")); // Not in minimal

        let coding = get_tools_for_profile(ToolProfile::Coding);
        assert!(coding.contains(&"file_read"));
        assert!(coding.contains(&"browser_interact"));
        assert!(coding.contains(&"memory_search"));

        let messaging = get_tools_for_profile(ToolProfile::Messaging);
        assert!(messaging.contains(&"sessions_list"));
        assert!(!messaging.contains(&"file_read")); // Not in messaging

        let full = get_tools_for_profile(ToolProfile::Full);
        assert!(full.is_empty()); // No restrictions
    }

    #[test]
    fn test_is_tool_allowed() {
        assert!(is_tool_allowed_for_profile("session_status", ToolProfile::Minimal));
        assert!(!is_tool_allowed_for_profile("file_read", ToolProfile::Minimal));
        assert!(is_tool_allowed_for_profile("file_read", ToolProfile::Coding));
        assert!(is_tool_allowed_for_profile("file_read", ToolProfile::Full)); // Full allows all
    }

    #[test]
    fn test_filter_tools_by_profile() {
        let tools = vec![
            ToolDescriptor {
                id: "file_read".to_string(),
                name: "Read".to_string(),
                description: "Read file".to_string(),
                category: super::descriptor::ToolCategory::Core,
                parameters: vec![],
                return_type: None,
                execution_mode: super::descriptor::ToolExecutionMode::Sync,
                capabilities: super::descriptor::ToolCapabilities {
                    supports_streaming: false,
                    supports_cancellation: false,
                    requires_permission: false,
                    requires_confirmation: false,
                    is_read_only: true,
                    has_side_effects: false,
                    supports_retry: false,
                    estimated_duration: None,
                },
                permissions: None,
                dependencies: None,
                context_requirements: None,
                metadata: super::descriptor::ToolMetadata {
                    author: None,
                    version: "1.0.0".to_string(),
                    license: None,
                    homepage: None,
                    repository: None,
                    tags: vec![],
                    category: "test".to_string(),
                    subcategory: None,
                },
                enabled: true,
                deprecated: None,
                deprecation_message: None,
                handler_module: None,
                handler_function: None,
            },
            ToolDescriptor {
                id: "session_status".to_string(),
                name: "Status".to_string(),
                description: "Session status".to_string(),
                category: super::descriptor::ToolCategory::Core,
                parameters: vec![],
                return_type: None,
                execution_mode: super::descriptor::ToolExecutionMode::Sync,
                capabilities: super::descriptor::ToolCapabilities {
                    supports_streaming: false,
                    supports_cancellation: false,
                    requires_permission: false,
                    requires_confirmation: false,
                    is_read_only: true,
                    has_side_effects: false,
                    supports_retry: false,
                    estimated_duration: None,
                },
                permissions: None,
                dependencies: None,
                context_requirements: None,
                metadata: super::descriptor::ToolMetadata {
                    author: None,
                    version: "1.0.0".to_string(),
                    license: None,
                    homepage: None,
                    repository: None,
                    tags: vec![],
                    category: "test".to_string(),
                    subcategory: None,
                },
                enabled: true,
                deprecated: None,
                deprecation_message: None,
                handler_module: None,
                handler_function: None,
            },
        ];

        let minimal = filter_tools_by_profile(&tools, ToolProfile::Minimal);
        assert_eq!(minimal.len(), 1);
        assert_eq!(minimal[0].id, "session_status");

        let coding = filter_tools_by_profile(&tools, ToolProfile::Coding);
        assert_eq!(coding.len(), 2); // Both allowed in coding

        let full = filter_tools_by_profile(&tools, ToolProfile::Full);
        assert_eq!(full.len(), 2); // Full allows all
    }

    #[test]
    fn test_resolve_allowed_tools() {
        // Basic profile
        let tools = resolve_allowed_tools(ToolProfile::Minimal, None);
        assert!(!tools.is_empty());
        assert!(tools.contains(&"session_status".to_string()));

        // With config overrides
        let config = ToolProfileConfig {
            also_allow: vec!["custom_tool".to_string()],
            deny: vec![],
        };
        let tools = resolve_allowed_tools(ToolProfile::Minimal, Some(&config));
        assert!(tools.contains(&"custom_tool".to_string()));
        assert!(tools.contains(&"session_status".to_string()));

        // Full profile - returns also_allow tools
        let tools = resolve_allowed_tools(ToolProfile::Full, Some(&config));
        assert!(tools.contains(&"custom_tool".to_string()));
        // Full without config returns empty (all allowed)
        let tools = resolve_allowed_tools(ToolProfile::Full, None);
        assert!(tools.is_empty());
    }

    #[test]
    fn test_check_tool_access() {
        // Basic check
        assert!(check_tool_access("session_status", ToolProfile::Minimal, None));
        assert!(!check_tool_access("file_read", ToolProfile::Minimal, None));

        // Deny takes precedence
        let config = ToolProfileConfig {
            also_allow: vec![],
            deny: vec!["session_status".to_string()],
        };
        assert!(!check_tool_access("session_status", ToolProfile::Minimal, Some(&config)));

        // Full allows all unless explicitly denied
        let config = ToolProfileConfig {
            also_allow: vec![],
            deny: vec!["secret_tool".to_string()],
        };
        assert!(check_tool_access("file_read", ToolProfile::Full, Some(&config)));
        assert!(!check_tool_access("secret_tool", ToolProfile::Full, Some(&config)));
    }

    #[test]
    fn test_profile_info() {
        let info = ToolProfile::Coding.info();
        assert_eq!(info.id, "coding");
        assert_eq!(info.label, "Coding");
        assert!(info.tool_count > 0);
    }

    #[test]
    fn test_profile_manager() {
        let manager = ProfileManager::new();
        assert_eq!(manager.get_current_profile(), ToolProfile::Coding);

        manager.set_profile(ToolProfile::Minimal);
        assert_eq!(manager.get_current_profile(), ToolProfile::Minimal);

        assert!(manager.check_access("session_status"));
        assert!(!manager.check_access("file_read"));

        let allowed = manager.get_allowed_tools();
        assert!(allowed.contains(&"session_status".to_string()));
        assert!(!allowed.contains(&"file_read".to_string()));
    }
}
