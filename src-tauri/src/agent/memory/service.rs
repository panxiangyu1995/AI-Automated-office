//! Memory service entry point.

use std::sync::Arc;

use tokio::sync::RwLock;

use crate::vector::config::EmbeddingConfig;
use crate::vector::embedding::EmbeddingService;

use super::hooks::{HookDispatcher, HookRegistry};
use super::storage::{PersonalMemoryStore, EnterpriseKnowledgeStore, MemoryStore};
use super::update::SmartUpdater;
use super::cognitive::{CognitiveStateManager, TrajectoryTracker, SwitchingCostCalculator};

use super::types::{
    HookEvent, HybridSearchResult, MemoryItem, MemoryLayer, MemoryQuery, MemorySearchResult,
    MemoryStats, SyncResult,
};
use super::config::{MemoryConfig, MemoryError};

/// Main memory service
pub struct MemoryService {
    config: Arc<RwLock<MemoryConfig>>,
    personal_store: Arc<PersonalMemoryStore>,
    enterprise_store: Arc<EnterpriseKnowledgeStore>,
    hook_registry: Arc<HookRegistry>,
    hook_dispatcher: Arc<HookDispatcher>,
    embedding_service: Arc<EmbeddingService>,
    cognitive_manager: Arc<RwLock<CognitiveStateManager>>,
    trajectory_tracker: Arc<RwLock<TrajectoryTracker>>,
    switching_calculator: Arc<SwitchingCostCalculator>,
}

impl MemoryService {
    /// Create a new memory service
    pub fn new(config: MemoryConfig, embedding_service: EmbeddingService) -> Self {
        let config = Arc::new(RwLock::new(config));
        let embedding_service = Arc::new(embedding_service);

        let hook_registry = Arc::new(HookRegistry::new());
        let hook_dispatcher = Arc::new(HookDispatcher::new(Arc::clone(&hook_registry)));

        Self {
            config,
            personal_store: Arc::new(PersonalMemoryStore::new()),
            enterprise_store: Arc::new(EnterpriseKnowledgeStore::new()),
            hook_registry,
            hook_dispatcher,
            embedding_service,
            cognitive_manager: Arc::new(RwLock::new(CognitiveStateManager::new())),
            trajectory_tracker: Arc::new(RwLock::new(TrajectoryTracker::new())),
            switching_calculator: Arc::new(SwitchingCostCalculator::new()),
        }
    }

    /// Create a new memory service with default configuration
    pub async fn with_defaults() -> Result<Self, MemoryError> {
        let config = MemoryConfig::default();
        let embedding_config = EmbeddingConfig::default();
        let embedding_service = EmbeddingService::new(embedding_config)
            .map_err(|e| MemoryError::ConfigError(e.to_string()))?;
        Ok(Self::new(config, embedding_service))
    }

    /// Handle a hook event
    pub async fn on_hook_event(&self, event: &HookEvent) -> Result<(), MemoryError> {
        // Dispatch event to handlers
        let items = self.hook_dispatcher.dispatch_unique(event).await?;

        // Process each item
        for item in items {
            self.process_new_item(&item).await?;
        }

        Ok(())
    }

    /// Process a new memory item
    async fn process_new_item(&self, item: &MemoryItem) -> Result<(), MemoryError> {
        // Find similar items based on layer
        let existing = match item.layer {
            MemoryLayer::Personal => {
                self.personal_store.find_similar(item, 0.8).await?
            }
            MemoryLayer::Enterprise => {
                self.enterprise_store.find_similar(item, 0.8).await?
            }
            MemoryLayer::Graph => {
                return Err(MemoryError::OperationFailed(
                    "Graph layer not yet implemented".to_string(),
                ))
            }
        };

        // Make decision
        let updater = SmartUpdater::new(
            Arc::clone(&self.embedding_service),
            0.8,
            0.7,
        );
        let decision = updater.decide(&existing, item).await?;

        // Execute decision based on layer
        match decision.action {
            super::types::UpdateAction::Add => {
                match item.layer {
                    MemoryLayer::Personal => self.personal_store.add(item).await?,
                    MemoryLayer::Enterprise => self.enterprise_store.add(item).await?,
                    MemoryLayer::Graph => unreachable!(),
                }
                tracing::info!("Added new memory: {} (confidence: {:.2})", item.key, decision.confidence);
            }
            super::types::UpdateAction::Update => {
                if let Some(id) = decision.affected_items.first() {
                    match item.layer {
                        MemoryLayer::Personal => self.personal_store.update(id, item).await?,
                        MemoryLayer::Enterprise => self.enterprise_store.update(id, item).await?,
                        MemoryLayer::Graph => unreachable!(),
                    }
                    tracing::info!("Updated memory: {} (confidence: {:.2})", id, decision.confidence);
                }
            }
            super::types::UpdateAction::Merge => {
                if let Some(id) = decision.affected_items.first() {
                    match item.layer {
                        MemoryLayer::Personal => self.personal_store.merge(id, item).await?,
                        MemoryLayer::Enterprise => self.enterprise_store.merge(id, item).await?,
                        MemoryLayer::Graph => unreachable!(),
                    }
                    tracing::info!("Merged memory: {} (confidence: {:.2})", id, decision.confidence);
                }
            }
            super::types::UpdateAction::Delete => {
                if let Some(id) = decision.affected_items.first() {
                    match item.layer {
                        MemoryLayer::Personal => self.personal_store.delete(id).await?,
                        MemoryLayer::Enterprise => self.enterprise_store.delete(id).await?,
                        MemoryLayer::Graph => unreachable!(),
                    }
                    tracing::info!("Deleted memory: {} (confidence: {:.2})", id, decision.confidence);
                }
            }
            super::types::UpdateAction::None => {
                tracing::debug!("No update needed for memory: {}", item.key);
            }
        }

        Ok(())
    }

    /// Search memories
    pub async fn search(&self, query: &MemoryQuery) -> Result<HybridSearchResult, MemoryError> {
        // Search based on layer
        let items = match query.layer {
            Some(MemoryLayer::Personal) | None => {
                self.personal_store.search(query).await?
            }
            Some(MemoryLayer::Enterprise) => {
                self.enterprise_store.search(query).await?
            }
            Some(MemoryLayer::Graph) => {
                return Err(MemoryError::OperationFailed(
                    "Graph layer not yet implemented".to_string(),
                ))
            }
        };

        // Convert to search results
        let search_results: Vec<MemorySearchResult> = items
            .into_iter()
            .map(|item| MemorySearchResult {
                item,
                score: 1.0,
                vector_score: None,
                bm25_score: None,
                highlights: Vec::new(),
            })
            .collect();

        let total = search_results.len();

        Ok(HybridSearchResult {
            items: search_results,
            total,
            vector_time_ms: 0,
            bm25_time_ms: 0,
            fusion_time_ms: 0,
        })
    }

    /// Add a memory item directly
    pub async fn add(&self, item: &MemoryItem) -> Result<(), MemoryError> {
        self.process_new_item(item).await
    }

    /// Update a memory item
    pub async fn update(&self, id: &str, item: &MemoryItem) -> Result<(), MemoryError> {
        match item.layer {
            MemoryLayer::Personal => self.personal_store.update(id, item).await,
            MemoryLayer::Enterprise => self.enterprise_store.update(id, item).await,
            MemoryLayer::Graph => Err(MemoryError::OperationFailed(
                "Graph layer not yet implemented".to_string(),
            )),
        }
    }

    /// Delete a memory item
    pub async fn delete(&self, layer: MemoryLayer, id: &str) -> Result<(), MemoryError> {
        match layer {
            MemoryLayer::Personal => self.personal_store.delete(id).await,
            MemoryLayer::Enterprise => self.enterprise_store.delete(id).await,
            MemoryLayer::Graph => Err(MemoryError::OperationFailed(
                "Graph layer not yet implemented".to_string(),
            )),
        }
    }

    /// Get memory statistics
    pub async fn get_stats(&self, _user_id: &str, _tenant_id: &str) -> Result<MemoryStats, MemoryError> {
        let personal_count = self.personal_store.count().await?;
        let enterprise_count = self.enterprise_store.count().await?;

        Ok(MemoryStats {
            total_items: personal_count + enterprise_count,
            personal_items: personal_count,
            enterprise_items: enterprise_count,
            by_category: std::collections::HashMap::new(),
        })
    }

    /// Sync memories (placeholder for full sync implementation)
    pub async fn sync(&self) -> Result<SyncResult, MemoryError> {
        Ok(SyncResult {
            synced_items: 0,
            conflicts: 0,
            errors: Vec::new(),
        })
    }

    /// Get cognitive state for a domain
    pub async fn get_cognitive_state(&self, domain_id: &str) -> Option<super::cognitive::CognitiveState> {
        let manager = self.cognitive_manager.read().await;
        manager.get_domain(domain_id).cloned()
    }

    /// Calculate switching cost between domains
    pub fn calculate_switching_cost(&self, from_domain: &str, to_domain: &str) -> super::cognitive::SwitchingCost {
        self.switching_calculator.calculate(from_domain, to_domain)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_memory_service_search() {
        let config = MemoryConfig::default();
        let embedding_config = EmbeddingConfig::default();
        let embedding_service = EmbeddingService::new(embedding_config).unwrap();
        let service = MemoryService::new(config, embedding_service);

        // Add a memory item
        let item = MemoryItem {
            id: "test-1".to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            key: "test-key".to_string(),
            value: "test-value".to_string(),
            ..Default::default()
        };
        service.add(&item).await.unwrap();

        // Search
        let query = MemoryQuery {
            query: "test".to_string(),
            layer: Some(MemoryLayer::Personal),
            tenant_id: "tenant-1".to_string(),
            user_id: Some("user-1".to_string()),
            ..Default::default()
        };

        let results = service.search(&query).await.unwrap();
        assert_eq!(results.items.len(), 1);
    }
}
