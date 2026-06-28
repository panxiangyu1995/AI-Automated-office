//! Lifecycle Hook Registry Module
//!
//! Manages hook registration, execution, and lifecycle.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::hook_trait::AgentHook;
use super::hook_types::{HookConfig, HookContext, HookEventType, HookResult};

/// Internal hook entry
pub(crate) struct HookEntry {
    hook: Box<dyn AgentHook>,
    config: HookConfig,
}

/// Hook Registry
///
/// Manages all registered hooks and handles event dispatching.
#[derive(Clone)]
pub struct HookRegistry {
    hooks: Arc<RwLock<HashMap<String, HookEntry>>>,
    enabled: Arc<RwLock<bool>>,
}

impl Default for HookRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl HookRegistry {
    /// Create a new registry
    pub fn new() -> Self {
        Self {
            hooks: Arc::new(RwLock::new(HashMap::new())),
            enabled: Arc::new(RwLock::new(true)),
        }
    }

    /// Register a hook
    pub async fn register<H: AgentHook + 'static>(&self, hook: H, config: HookConfig) {
        let mut hooks = self.hooks.write().await;
        hooks.insert(
            hook.name().to_string(),
            HookEntry {
                hook: Box::new(hook),
                config,
            },
        );
    }

    /// Unregister a hook
    pub(crate) async fn unregister(&self, name: &str) -> Option<HookEntry> {
        let mut hooks = self.hooks.write().await;
        hooks.remove(name)
    }

    /// Get a hook by name
    pub(crate) async fn get(&self, name: &str) -> Option<HookEntry> {
        let hooks = self.hooks.read().await;
        hooks.get(name).cloned()
    }

    /// List all registered hooks
    pub async fn list(&self) -> Vec<(String, HookConfig)> {
        let hooks = self.hooks.read().await;
        hooks
            .iter()
            .map(|(name, entry)| (name.clone(), entry.config.clone()))
            .collect()
    }

    /// Enable/disable the registry
    pub async fn set_enabled(&self, enabled: bool) {
        let mut e = self.enabled.write().await;
        *e = enabled;
    }

    /// Check if registry is enabled
    pub async fn is_enabled(&self) -> bool {
        *self.enabled.read().await
    }

    /// Dispatch an event to all matching hooks
    pub async fn dispatch(&self, ctx: HookContext) -> Vec<HookResult> {
        if !self.is_enabled().await {
            return Vec::new();
        }

        let hooks = self.hooks.read().await;
        let mut results = Vec::new();

        // Collect and sort by priority
        let mut entries: Vec<_> = hooks.iter().collect();
        entries.sort_by_key(|(_, entry)| entry.config.priority);

        for (_, entry) in entries {
            let config = &entry.config;
            
            // Check if hook matches the context
            if !config.matches(&ctx) {
                continue;
            }

            // Check if hook responds to this event type
            let event_type = infer_event_type(&ctx);
            if !config.event_types.is_empty() && !config.event_types.contains(&event_type) {
                continue;
            }

            // Check if hook should execute
            if !entry.hook.should_execute(&ctx) {
                continue;
            }

            // Execute hook with timeout
            let result = if let Some(timeout_ms) = config.timeout_ms {
                tokio::time::timeout(
                    std::time::Duration::from_millis(timeout_ms),
                    entry.hook.handle(ctx.clone()),
                )
                .await
                .unwrap_or_else(|_| HookResult::error("Hook execution timed out"))
            } else {
                entry.hook.handle(ctx.clone()).await
            };

            results.push(result);

            // Check if execution should stop
            if !results.last().map(|r| r.continue_execution).unwrap_or(true) {
                break;
            }
        }

        results
    }

    /// Clear all hooks
    pub async fn clear(&self) {
        let mut hooks = self.hooks.write().await;
        hooks.clear();
    }

    /// Get count of registered hooks
    pub async fn count(&self) -> usize {
        let hooks = self.hooks.read().await;
        hooks.len()
    }
}

impl Clone for HookEntry {
    fn clone(&self) -> Self {
        // Note: This is a shallow clone - the hook is shared
        HookEntry {
            hook: self.hook.as_ref().box_clone(),
            config: self.config.clone(),
        }
    }
}

/// Infer event type from context
fn infer_event_type(ctx: &HookContext) -> HookEventType {
    if ctx.error.is_some() {
        HookEventType::Error
    } else if ctx.tool_name.is_some() {
        if ctx.tool_result.is_some() {
            HookEventType::PostToolCall
        } else {
            HookEventType::PreToolCall
        }
    } else if ctx.message_content.is_some() {
        HookEventType::MessageReceived
    } else {
        HookEventType::SessionStart
    }
}

impl HookConfig {
    /// Check if this config matches the given context
    pub fn matches(&self, ctx: &HookContext) -> bool {
        // Check enabled
        if !self.enabled {
            return false;
        }

        // Check agent types
        if !self.agent_types.is_empty() && !self.agent_types.contains(&ctx.agent_type) {
            return false;
        }

        // Check tool patterns
        if !self.tool_patterns.is_empty() {
            if let Some(ref tool_name) = ctx.tool_name {
                let matches = self.tool_patterns.iter().any(|p| {
                    matches_pattern(p, tool_name)
                });
                if !matches {
                    return false;
                }
            } else {
                return false;
            }
        }

        true
    }
}

/// Simple pattern matching
fn matches_pattern(pattern: &str, name: &str) -> bool {
    if pattern == "*" {
        return true;
    }
    if pattern.ends_with('*') {
        let prefix = &pattern[..pattern.len() - 1];
        return name.starts_with(prefix);
    }
    if pattern.starts_with('*') {
        let suffix = &pattern[1..];
        return name.ends_with(suffix);
    }
    pattern == name
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent::lifecycle_hooks::hook_trait::AgentHook;

    struct TestHook {
        called: std::sync::atomic::AtomicBool,
    }

    impl TestHook {
        fn new() -> Self {
            Self {
                called: std::sync::atomic::AtomicBool::new(false),
            }
        }
    }

    impl Default for TestHook {
        fn default() -> Self {
            Self::new()
        }
    }

    #[async_trait::async_trait]
    impl AgentHook for TestHook {
        fn name(&self) -> &str {
            "test"
        }

        fn event_types(&self) -> Vec<HookEventType> {
            vec![HookEventType::PreToolCall]
        }

        async fn handle(&self, _ctx: HookContext) -> HookResult {
            self.called.store(true, std::sync::atomic::Ordering::Relaxed);
            HookResult::success()
        }

        fn box_clone(&self) -> Box<dyn AgentHook> {
            Box::new(Self::new())
        }
    }

    #[tokio::test]
    async fn test_register_and_dispatch() {
        let registry = HookRegistry::new();
        
        let hook = TestHook::new();
        let config = HookConfig::new("test")
            .with_events(vec![HookEventType::PreToolCall]);
        
        registry.register(hook, config).await;
        
        let ctx = HookContext::new("agent1", "explore", "session1", "user1", "tenant1")
            .with_tool("glob", serde_json::json!({}));
        
        let results = registry.dispatch(ctx).await;
        assert!(!results.is_empty());
    }

    #[tokio::test]
    async fn test_disable_registry() {
        let registry = HookRegistry::new();
        
        let hook = TestHook::new();
        let config = HookConfig::new("test");
        
        registry.register(hook, config).await;
        registry.set_enabled(false).await;
        
        let ctx = HookContext::new("agent1", "explore", "session1", "user1", "tenant1");
        let results = registry.dispatch(ctx).await;
        
        assert!(results.is_empty());
    }
}
