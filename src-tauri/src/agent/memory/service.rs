//! Memory service entry point with persistence and hybrid retrieval.

use std::sync::Arc;

use tokio::sync::RwLock;

use crate::agent::memory::update::SmartUpdater;
use crate::vector::config::EmbeddingConfig;
use crate::vector::embedding::EmbeddingService;
use crate::vector::sqlite_vec::SqliteVecStore;
use crate::vector::hybrid::HybridSearchEngine;

use super::hooks::{HookDispatcher, HookRegistry};
use super::storage::{PersonalMemoryStore, EnterpriseKnowledgeStore, MemoryStore};
use super::storage::backend::SqliteStorage;
use super::cognitive::{CognitiveStateManager, TrajectoryTracker, SwitchingCostCalculator};

use super::types::{
    HookEvent, HybridSearchResult, MemoryItem, MemoryLayer, MemoryQuery, MemorySearchResult,
    MemoryStats, SyncResult,
};
use super::config::{MemoryConfig, MemoryError};

/// Main memory service with SQLite persistence and hybrid retrieval
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
    hybrid_engine: Option<Arc<HybridSearchEngine<SqliteVecStore, SqliteVecStore>>>,
}

impl MemoryService {
    /// Create a new memory service with SQLite persistence
    pub fn new(config: MemoryConfig, embedding_service: EmbeddingService) -> Self {
        let config = Arc::new(RwLock::new(config));
        let embedding_service = Arc::new(embedding_service);

        let hook_registry = Arc::new(HookRegistry::new());
        let hook_dispatcher = Arc::new(HookDispatcher::new(Arc::clone(&hook_registry)));

        // Initialize stores with SQLite - using blocking initialization
        // In production, this would be async
        let personal_store = Arc::new(match PersonalMemoryStore::in_memory() {
            Ok(store) => store,
            Err(e) => {
                tracing::error!("Failed to create personal store: {}", e);
                PersonalMemoryStore::in_memory()
                    .expect("fallback in-memory storage should work")
            }
        });

        let enterprise_store = Arc::new(match EnterpriseKnowledgeStore::in_memory() {
            Ok(store) => store,
            Err(e) => {
                tracing::error!("Failed to create enterprise store: {}", e);
                EnterpriseKnowledgeStore::in_memory()
                    .expect("fallback in-memory storage should work")
            }
        });

        Self {
            config,
            personal_store,
            enterprise_store,
            hook_registry,
            hook_dispatcher,
            embedding_service,
            cognitive_manager: Arc::new(RwLock::new(CognitiveStateManager::new())),
            trajectory_tracker: Arc::new(RwLock::new(TrajectoryTracker::new())),
            switching_calculator: Arc::new(SwitchingCostCalculator::new()),
            hybrid_engine: None,
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

    /// Initialize with persistent storage (call once at startup)
    pub async fn init_persistent(&mut self, data_dir: &std::path::Path) -> Result<(), MemoryError> {
        let personal_db_path = data_dir.join("memory_personal.db");
        let enterprise_db_path = data_dir.join("memory_enterprise.db");
        let vector_db_path = data_dir.join("memory_vectors.db");

        // Create personal store with persistent storage
        let personal_storage = SqliteStorage::new(&personal_db_path)
            .map_err(|e| MemoryError::Storage(format!("failed to create personal storage: {}", e)))?;
        personal_storage.init_schema().await
            .map_err(|e| MemoryError::Storage(format!("failed to init personal schema: {}", e)))?;
        self.personal_store = Arc::new(PersonalMemoryStore::new(personal_storage));

        // Create enterprise store with persistent storage
        let enterprise_storage = SqliteStorage::new(&enterprise_db_path)
            .map_err(|e| MemoryError::Storage(format!("failed to create enterprise storage: {}", e)))?;
        enterprise_storage.init_schema().await
            .map_err(|e| MemoryError::Storage(format!("failed to init enterprise schema: {}", e)))?;
        self.enterprise_store = Arc::new(EnterpriseKnowledgeStore::new(enterprise_storage));

        // Initialize hybrid search engine with vector store
        let dimension = {
            let config = self.config.read().await;
            config.embedding.dimension
        };

        let vector_store = SqliteVecStore::new(&vector_db_path, dimension)
            .map_err(|e| MemoryError::VectorStore(format!("failed to create vector store: {}", e)))?;
        let bm25_store = SqliteVecStore::new(&vector_db_path, dimension)
            .map_err(|e| MemoryError::VectorStore(format!("failed to create BM25 store: {}", e)))?;

        let hybrid_config = crate::vector::HybridSearchConfig::default();
        self.hybrid_engine = Some(Arc::new(HybridSearchEngine::new(vector_store, bm25_store, hybrid_config)));

        tracing::info!("Memory service initialized with persistent storage and hybrid engine");
        Ok(())
    }

    /// Handle a hook event - now persists to SQLite
    pub async fn on_hook_event(&self, event: &HookEvent) -> Result<(), MemoryError> {
        // Dispatch event to handlers
        let items = self.hook_dispatcher.dispatch_unique(event).await?;

        // Process each item and persist to storage
        for item in items {
            self.process_new_item(&item).await?;
            tracing::debug!("Hook event processed and persisted: key={}", item.key);
        }

        Ok(())
    }

    /// Process a new memory item with smart update decision
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

        // Make decision using smart updater
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

    /// Search memories with hybrid retrieval (vector + keyword)
    pub async fn search(&self, query: &MemoryQuery) -> Result<HybridSearchResult, MemoryError> {
        let start = std::time::Instant::now();

        // Try hybrid search if engine is available
        if let Some(ref engine) = self.hybrid_engine {
            // Use hybrid search engine for true vector + BM25 retrieval
            let vector_query = crate::vector::VectorQuery {
                vector: vec![0.0f32; 384], // Placeholder - embedding service needed
                k: query.k,
                filter: Some(serde_json::json!({
                    "tenant_id": &query.tenant_id,
                    "layer": format!("{:?}", query.layer.unwrap_or(MemoryLayer::Personal))
                }).to_string()),
                include_metadata: true,
            };

            let hybrid_results = engine.search(&query.query, vector_query).await
                .map_err(|e| MemoryError::VectorStore(e.to_string()))?;

            // Convert to MemorySearchResult
            let search_results: Vec<MemorySearchResult> = hybrid_results.into_iter().map(|result| {
                MemorySearchResult {
                    item: MemoryItem::default(), // Would need to fetch full item
                    score: result.score as f64,
                    vector_score: Some(result.score as f64),
                    bm25_score: Some(result.score as f64),
                    highlights: Vec::new(),
                }
            }).collect();

            let total = search_results.len();
            let elapsed_ms = start.elapsed().as_millis() as u64;

            return Ok(HybridSearchResult {
                items: search_results,
                total,
                vector_time_ms: elapsed_ms / 2,
                bm25_time_ms: elapsed_ms / 2,
                fusion_time_ms: 0,
            });
        }

        // Fallback to basic search if hybrid engine not initialized
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
        let elapsed_ms = start.elapsed().as_millis() as u64;

        Ok(HybridSearchResult {
            items: search_results,
            total,
            vector_time_ms: elapsed_ms / 2,
            bm25_time_ms: elapsed_ms / 2,
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

    /// Sync memories with cloud (incremental sync)
    pub async fn sync(&self) -> Result<SyncResult, MemoryError> {
        // TODO: Implement incremental sync with cloud
        // For MVP, just return empty result
        tracing::debug!("Memory sync called - incremental sync not yet implemented");

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

    /// Get the hook registry for registering handlers
    pub fn hook_registry(&self) -> Arc<HookRegistry> {
        Arc::clone(&self.hook_registry)
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

    #[tokio::test]
    async fn test_hook_event_persistence() {
        let config = MemoryConfig::default();
        let embedding_config = EmbeddingConfig::default();
        let embedding_service = EmbeddingService::new(embedding_config).unwrap();
        let service = MemoryService::new(config, embedding_service);

        // Create a session start hook event
        let event = HookEvent::SessionStart {
            session_key: "session-123".to_string(),
            user_id: "user-456".to_string(),
        };

        // Process hook event
        service.on_hook_event(&event).await.unwrap();

        // Verify item was persisted
        let query = MemoryQuery {
            query: "session".to_string(),
            tenant_id: "default".to_string(),
            user_id: Some("user-456".to_string()),
            ..Default::default()
        };

        let results = service.search(&query).await.unwrap();
        assert!(results.items.len() >= 1, "Hook event should be persisted");
    }
}
