//! Lifecycle Manager Implementation
//!
//! Manages lifecycle hooks for capability packages.

use crate::capability::lifecycle::hook::{
    LifecycleEvent, LifecycleHook, LifecycleResult, PluginContext,
};
use crate::capability::lifecycle::hook::LifecycleError;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Lifecycle manager for managing plugin lifecycle hooks
pub struct LifecycleManager {
    /// Registered hooks
    hooks: RwLock<HashMap<String, Arc<dyn LifecycleHook>>>,
    /// Plugin contexts
    contexts: RwLock<HashMap<String, PluginContext>>,
    /// Event subscribers (event -> plugin_ids)
    subscribers: RwLock<HashMap<LifecycleEvent, Vec<String>>>,
}

impl LifecycleManager {
    /// Create a new lifecycle manager
    pub fn new() -> Self {
        Self {
            hooks: RwLock::new(HashMap::new()),
            contexts: RwLock::new(HashMap::new()),
            subscribers: RwLock::new(HashMap::new()),
        }
    }

    /// Register a lifecycle hook
    pub async fn register(&self, hook: Arc<dyn LifecycleHook>) -> Arc<dyn LifecycleHook> {
        let name = hook.name().to_string();

        let mut hooks = self.hooks.write().await;
        hooks.insert(name.clone(), Arc::clone(&hook));

        hook
    }

    /// Unregister a lifecycle hook
    pub async fn unregister(&self, name: &str) -> Option<Arc<dyn LifecycleHook>> {
        let mut hooks = self.hooks.write().await;
        
        // Remove from subscribers
        let mut subscribers = self.subscribers.write().await;
        for (_, plugin_ids) in subscribers.iter_mut() {
            plugin_ids.retain(|id| id != name);
        }
        
        // Remove context
        let mut contexts = self.contexts.write().await;
        contexts.remove(name);
        
        hooks.remove(name)
    }

    /// Get a registered hook by name
    pub async fn get(&self, name: &str) -> Option<Arc<dyn LifecycleHook>> {
        let hooks = self.hooks.read().await;
        hooks.get(name).cloned()
    }

    /// Get all registered hook names
    pub async fn registered(&self) -> Vec<String> {
        let hooks = self.hooks.read().await;
        hooks.keys().cloned().collect()
    }

    /// Trigger a lifecycle event
    pub async fn trigger(&self, event: LifecycleEvent) -> LifecycleResult<()> {
        let subscribers = {
            let subs = self.subscribers.read().await;
            subs.get(&event).cloned().unwrap_or_default()
        };

        for plugin_id in subscribers {
            if let Some(hook) = self.get(&plugin_id).await {
                self.execute_hook(&plugin_id, &hook, event).await?;
            }
        }

        Ok(())
    }

    /// Trigger a lifecycle event for a specific plugin
    pub async fn trigger_for(
        &self,
        plugin_id: &str,
        event: LifecycleEvent,
    ) -> LifecycleResult<()> {
        let hook = self.get(plugin_id).await
            .ok_or_else(|| crate::capability::lifecycle::hook::LifecycleError::PluginNotFound {
                plugin_id: plugin_id.to_string(),
            })?;

        self.execute_hook(plugin_id, &hook, event).await
    }

    /// Execute a hook for a specific event
    async fn execute_hook(
        &self,
        plugin_id: &str,
        hook: &Arc<dyn LifecycleHook>,
        event: LifecycleEvent,
    ) -> LifecycleResult<()> {
        let ctx = {
            let contexts = self.contexts.read().await;
            contexts.get(plugin_id).cloned()
        };

        match event {
            LifecycleEvent::OnLoad => {
                if let Some(ctx) = ctx {
                    hook.on_load(&ctx).await?;
                }
            }
            LifecycleEvent::OnUnload => {
                hook.on_unload().await?;
            }
            LifecycleEvent::OnEnable => {
                hook.on_enable().await?;
            }
            LifecycleEvent::OnDisable => {
                hook.on_disable().await?;
            }
            LifecycleEvent::PreSession => {
                if let Some(ctx) = ctx {
                    hook.pre_session(&ctx).await?;
                }
            }
            LifecycleEvent::PostSession => {
                if let Some(ctx) = ctx {
                    hook.post_session(&ctx).await?;
                }
            }
            LifecycleEvent::OnError => {
                // Error events need special handling with error message
                hook.on_error("lifecycle_error").await?;
            }
        }

        Ok(())
    }

    /// Register a context for a plugin
    pub async fn register_context(&self, ctx: PluginContext) {
        let mut contexts = self.contexts.write().await;
        let plugin_id = ctx.plugin_id.clone();
        contexts.insert(plugin_id.clone(), ctx);

        // Subscribe plugin to all its supported events
        if let Some(hook) = self.get(&plugin_id).await {
            let events = hook.supported_events();
            let mut subscribers = self.subscribers.write().await;
            
            for event in events {
                subscribers
                    .entry(event)
                    .or_default()
                    .push(plugin_id.clone());
            }
        }
    }

    /// Get the context for a plugin
    pub async fn get_context(&self, plugin_id: &str) -> Option<PluginContext> {
        let contexts = self.contexts.read().await;
        contexts.get(plugin_id).cloned()
    }

    /// Check if a plugin is registered
    pub async fn is_registered(&self, plugin_id: &str) -> bool {
        let hooks = self.hooks.read().await;
        hooks.contains_key(plugin_id)
    }

    /// Clear all registered hooks and contexts
    pub async fn clear(&self) {
        let mut hooks = self.hooks.write().await;
        let mut contexts = self.contexts.write().await;
        let mut subscribers = self.subscribers.write().await;
        
        hooks.clear();
        contexts.clear();
        subscribers.clear();
    }
}

impl Default for LifecycleManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestHook;

    #[async_trait::async_trait]
    impl LifecycleHook for TestHook {
        fn name(&self) -> &'static str {
            "test-hook"
        }

        async fn on_load(&self, _ctx: &PluginContext) -> LifecycleResult<()> {
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_register_and_get() {
        let manager = LifecycleManager::new();

        let hook = Arc::new(TestHook) as Arc<dyn LifecycleHook>;
        let registered = manager.register(hook).await;

        assert_eq!(registered.name(), "test-hook");

        let retrieved = manager.get("test-hook").await;
        assert!(retrieved.is_some());
    }

    #[tokio::test]
    async fn test_unregister() {
        let manager = LifecycleManager::new();

        let hook = Arc::new(TestHook) as Arc<dyn LifecycleHook>;
        manager.register(hook).await;

        let removed = manager.unregister("test-hook").await;
        assert!(removed.is_some());

        let retrieved = manager.get("test-hook").await;
        assert!(retrieved.is_none());
    }

    #[tokio::test]
    async fn test_register_context() {
        let manager = LifecycleManager::new();

        let hook = Arc::new(TestHook) as Arc<dyn LifecycleHook>;
        manager.register(hook).await;
        
        let ctx = PluginContext::new("test-hook", "Test Plugin", "1.0.0");
        manager.register_context(ctx.clone()).await;
        
        let retrieved = manager.get_context("test-hook").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "Test Plugin");
    }
}
