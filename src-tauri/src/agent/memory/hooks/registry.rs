//! Hook registry for memory event handling.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use async_trait::async_trait;

use super::super::types::{HookEvent, MemoryItem};
use super::super::config::MemoryError;

/// Hook handler trait
#[async_trait]
pub trait HookHandler: Send + Sync {
    /// Handle a hook event and return memory items to potentially store
    async fn handle(&self, event: &HookEvent) -> Result<Vec<MemoryItem>, MemoryError>;

    /// Get handler name
    fn name(&self) -> &str;

    /// Get handler priority (higher = called first)
    fn priority(&self) -> u8;
}

/// Hook registry
pub struct HookRegistry {
    handlers: Arc<RwLock<HashMap<String, Arc<dyn HookHandler>>>>,
}

impl HookRegistry {
    pub fn new() -> Self {
        Self {
            handlers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a hook handler
    pub async fn register(&self, handler: Arc<dyn HookHandler>) {
        let mut handlers = self.handlers.write().await;
        handlers.insert(handler.name().to_string(), handler);
    }

    /// Unregister a hook handler
    pub async fn unregister(&self, name: &str) -> Option<Arc<dyn HookHandler>> {
        let mut handlers = self.handlers.write().await;
        handlers.remove(name)
    }

    /// Get a handler by name
    pub async fn get(&self, name: &str) -> Option<Arc<dyn HookHandler>> {
        let handlers = self.handlers.read().await;
        handlers.get(name).cloned()
    }

    /// List all registered handlers
    pub async fn list(&self) -> Vec<String> {
        let handlers = self.handlers.read().await;
        handlers.keys().cloned().collect()
    }

    /// Get all handlers sorted by priority
    pub async fn get_handlers_sorted(&self) -> Vec<Arc<dyn HookHandler>> {
        let handlers = self.handlers.read().await;
        let mut sorted: Vec<_> = handlers.values().cloned().collect();
        sorted.sort_by(|a, b| b.priority().cmp(&a.priority()));
        sorted
    }
}

impl Default for HookRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestHandler {
        name: String,
        priority: u8,
    }

    #[async_trait]
    impl HookHandler for TestHandler {
        async fn handle(&self, _event: &HookEvent) -> Result<Vec<MemoryItem>, MemoryError> {
            Ok(Vec::new())
        }

        fn name(&self) -> &str {
            &self.name
        }

        fn priority(&self) -> u8 {
            self.priority
        }
    }

    #[tokio::test]
    async fn test_registry_register_and_get() {
        let registry = HookRegistry::new();

        let handler = Arc::new(TestHandler {
            name: "test-handler".to_string(),
            priority: 10,
        });

        registry.register(handler.clone()).await;

        let retrieved = registry.get("test-handler").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name(), "test-handler");
    }

    #[tokio::test]
    async fn test_registry_priority_order() {
        let registry = HookRegistry::new();

        let handler1 = Arc::new(TestHandler {
            name: "low-priority".to_string(),
            priority: 1,
        });
        let handler2 = Arc::new(TestHandler {
            name: "high-priority".to_string(),
            priority: 100,
        });

        registry.register(handler1).await;
        registry.register(handler2).await;

        let sorted = registry.get_handlers_sorted().await;
        assert_eq!(sorted[0].name(), "high-priority");
        assert_eq!(sorted[1].name(), "low-priority");
    }
}
