//! Plugin Lifecycle Hook Trait and Types
//!
//! Defines the trait that plugins must implement to participate
//! in the lifecycle management system.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Lifecycle event types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LifecycleEvent {
    /// Called when the plugin is first loaded
    OnLoad,
    /// Called when the plugin is unloaded
    OnUnload,
    /// Called when the plugin is enabled
    OnEnable,
    /// Called when the plugin is disabled
    OnDisable,
    /// Called before a session starts
    PreSession,
    /// Called after a session ends
    PostSession,
    /// Called when an error occurs
    OnError,
}

impl LifecycleEvent {
    /// Get the event name as a string
    pub fn as_str(&self) -> &'static str {
        match self {
            LifecycleEvent::OnLoad => "on_load",
            LifecycleEvent::OnUnload => "on_unload",
            LifecycleEvent::OnEnable => "on_enable",
            LifecycleEvent::OnDisable => "on_disable",
            LifecycleEvent::PreSession => "pre_session",
            LifecycleEvent::PostSession => "post_session",
            LifecycleEvent::OnError => "on_error",
        }
    }
}

/// Plugin context passed to lifecycle hooks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginContext {
    /// Unique identifier for the plugin
    pub plugin_id: String,
    /// Human-readable name
    pub name: String,
    /// Plugin version
    pub version: String,
    /// Tenant ID (for multi-tenancy)
    pub tenant_id: Option<String>,
    /// User ID
    pub user_id: Option<String>,
    /// Additional metadata
    pub metadata: HashMap<String, String>,
}

impl PluginContext {
    /// Create a new plugin context
    pub fn new(plugin_id: &str, name: &str, version: &str) -> Self {
        Self {
            plugin_id: plugin_id.to_string(),
            name: name.to_string(),
            version: version.to_string(),
            tenant_id: None,
            user_id: None,
            metadata: HashMap::new(),
        }
    }

    /// Set the tenant ID
    pub fn with_tenant_id(mut self, tenant_id: &str) -> Self {
        self.tenant_id = Some(tenant_id.to_string());
        self
    }

    /// Set the user ID
    pub fn with_user_id(mut self, user_id: &str) -> Self {
        self.user_id = Some(user_id.to_string());
        self
    }

    /// Add a metadata key-value pair
    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }
}

/// Error type for lifecycle operations
#[derive(Debug, thiserror::Error)]
pub enum LifecycleError {
    #[error("Plugin {plugin_id} not found")]
    PluginNotFound { plugin_id: String },

    #[error("Hook execution failed for {plugin_id}: {reason}")]
    HookExecutionFailed { plugin_id: String, reason: String },

    #[error("Invalid hook configuration: {reason}")]
    InvalidConfig { reason: String },

    #[error("Lifecycle event {event} not supported by {plugin_id}")]
    EventNotSupported { plugin_id: String, event: LifecycleEvent },
}

/// Result type for lifecycle operations
pub type LifecycleResult<T> = Result<T, LifecycleError>;

/// Trait for plugins that want to participate in lifecycle management
///
/// Implement this trait to receive notifications about lifecycle events.
/// All methods are optional - implement only the ones you need.
///
/// # Example
///
/// ```ignore
/// use capability::lifecycle::{LifecycleHook, PluginContext};
///
/// struct MyPlugin;
///
/// #[async_trait]
/// impl LifecycleHook for MyPlugin {
///     fn name(&self) -> &'static str {
///         "my-plugin"
///     }
///
///     async fn on_load(&self, ctx: &PluginContext) -> LifecycleResult<()> {
///         println!("Plugin {} loaded!", ctx.name);
///         Ok(())
///     }
/// }
/// ```
#[async_trait]
pub trait LifecycleHook: Send + Sync {
    /// Get the unique name of this hook
    fn name(&self) -> &'static str;

    /// Called when the plugin is loaded
    async fn on_load(&self, _ctx: &PluginContext) -> LifecycleResult<()> {
        Ok(())
    }

    /// Called when the plugin is unloaded
    async fn on_unload(&self) -> LifecycleResult<()> {
        Ok(())
    }

    /// Called when the plugin is enabled
    async fn on_enable(&self) -> LifecycleResult<()> {
        Ok(())
    }

    /// Called when the plugin is disabled
    async fn on_disable(&self) -> LifecycleResult<()> {
        Ok(())
    }

    /// Called before a session starts
    async fn pre_session(&self, _ctx: &PluginContext) -> LifecycleResult<()> {
        Ok(())
    }

    /// Called after a session ends
    async fn post_session(&self, _ctx: &PluginContext) -> LifecycleResult<()> {
        Ok(())
    }

    /// Handle an error that occurred during plugin execution
    async fn on_error(&self, _error: &str) -> LifecycleResult<()> {
        Ok(())
    }

    /// Get the list of events this hook supports
    /// By default, returns all events. Override to limit supported events.
    fn supported_events(&self) -> Vec<LifecycleEvent> {
        vec![
            LifecycleEvent::OnLoad,
            LifecycleEvent::OnUnload,
            LifecycleEvent::OnEnable,
            LifecycleEvent::OnDisable,
            LifecycleEvent::PreSession,
            LifecycleEvent::PostSession,
            LifecycleEvent::OnError,
        ]
    }
}

/// Extension trait for checking if a hook supports an event
pub trait LifecycleHookExt {
    /// Check if this hook supports the given event
    fn supports_event(&self, event: LifecycleEvent) -> bool;
}

impl<T: LifecycleHook + ?Sized> LifecycleHookExt for T {
    fn supports_event(&self, event: LifecycleEvent) -> bool {
        self.supported_events().contains(&event)
    }
}
