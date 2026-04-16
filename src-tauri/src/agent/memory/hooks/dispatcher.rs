//! Hook dispatcher for event processing.

use std::sync::Arc;

use super::registry::HookRegistry;
use super::super::types::HookEvent;
use super::super::config::MemoryError;

/// Hook dispatcher
pub struct HookDispatcher {
    registry: Arc<HookRegistry>,
}

impl HookDispatcher {
    pub fn new(registry: Arc<HookRegistry>) -> Self {
        Self { registry }
    }

    /// Dispatch an event to all registered handlers
    pub async fn dispatch(&self, event: &HookEvent) -> Result<Vec<super::super::types::MemoryItem>, MemoryError> {
        let handlers = self.registry.get_handlers_sorted().await;
        let mut all_items = Vec::new();

        for handler in handlers {
            match handler.handle(event).await {
                Ok(items) => {
                    let count = items.len();
                    all_items.extend(items);
                    tracing::debug!(
                        "Handler '{}' processed event {:?}, produced {} items",
                        handler.name(),
                        event,
                        count
                    );
                }
                Err(e) => {
                    tracing::error!(
                        "Handler '{}' failed to process event {:?}: {}",
                        handler.name(),
                        event,
                        e
                    );
                    // Continue processing other handlers
                }
            }
        }

        Ok(all_items)
    }

    /// Dispatch and filter unique items by key
    pub async fn dispatch_unique(&self, event: &HookEvent) -> Result<Vec<super::super::types::MemoryItem>, MemoryError> {
        let items = self.dispatch(event).await?;

        // Deduplicate by key within same session
        let mut seen = std::collections::HashSet::new();
        let unique: Vec<_> = items
            .into_iter()
            .filter(|item| {
                let key = format!(
                    "{}:{}:{}",
                    item.tenant_id,
                    item.user_id.as_deref().unwrap_or(""),
                    item.key
                );
                seen.insert(key)
            })
            .collect();

        Ok(unique)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::registry::HookRegistry;
    use std::sync::Arc;
    use async_trait::async_trait;
    use super::super::types::{HookEvent, MemoryItem, MemoryLayer, MemorySource};

    struct TestHandler {
        name: String,
        priority: u8,
        items: Vec<MemoryItem>,
    }

    #[async_trait]
    impl HookHandler for TestHandler {
        async fn handle(&self, _event: &HookEvent) -> Result<Vec<MemoryItem>, MemoryError> {
            Ok(self.items.clone())
        }

        fn name(&self) -> &str {
            &self.name
        }

        fn priority(&self) -> u8 {
            self.priority
        }
    }

    #[tokio::test]
    async fn test_dispatch_collects_from_all_handlers() {
        let registry = Arc::new(HookRegistry::new());

        let handler1 = Arc::new(TestHandler {
            name: "handler-1".to_string(),
            priority: 10,
            items: vec![MemoryItem {
                id: "item-1".to_string(),
                layer: MemoryLayer::Personal,
                tenant_id: "tenant-1".to_string(),
                user_id: Some("user-1".to_string()),
                key: "key-1".to_string(),
                value: "value-1".to_string(),
                source: MemorySource::UserInput,
                ..Default::default()
            }],
        });

        let handler2 = Arc::new(TestHandler {
            name: "handler-2".to_string(),
            priority: 5,
            items: vec![MemoryItem {
                id: "item-2".to_string(),
                layer: MemoryLayer::Personal,
                tenant_id: "tenant-1".to_string(),
                user_id: Some("user-1".to_string()),
                key: "key-2".to_string(),
                value: "value-2".to_string(),
                source: MemorySource::UserInput,
                ..Default::default()
            }],
        });

        registry.register(handler1).await;
        registry.register(handler2).await;

        let dispatcher = HookDispatcher::new(registry);

        let event = HookEvent::SessionStart {
            session_key: "session-1".to_string(),
            user_id: "user-1".to_string(),
        };

        let items = dispatcher.dispatch(&event).await.unwrap();
        assert_eq!(items.len(), 2);
    }
}
