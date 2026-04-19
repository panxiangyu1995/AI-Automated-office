//! Memory module for three-layer memory architecture.
//!
//! # Architecture
//!
//! - **L1 Personal Memory**: User-private memories, accessible only by the user
//! - **L2 Enterprise Knowledge Base**: Tenant-wide knowledge, accessible by all tenant members
//! - **L3 Graph Memory**: Relationship-based memory using graph structures
//!
//! # Key Components
//!
//! - `storage/`: Three-layer storage abstraction and implementations
//! - `hooks/`: Event hook system for automatic memory capture
//! - `retrieval/`: Hybrid search engine (vector + BM25)
//! - `update/`: Smart update decision engine
//! - `cognitive/`: Cognitive state and trajectory tracking
//! - `graph/`: Graph-based memory (L3)
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::agent::memory::{MemoryService, MemoryConfig};
//! use crate::vector::embedding::EmbeddingService;
//!
//! let config = MemoryConfig::default();
//! let embedding_service = EmbeddingService::new(...);
//! let service = MemoryService::new(config, embedding_service);
//!
//! // Search memories
//! let results = service.search(&query).await;
//! ```

pub mod types;
pub mod config;
pub mod runtime_integration;
pub mod storage;
pub mod hooks;
pub mod retrieval;
pub mod cognitive;
pub mod update;
pub mod service;
pub mod graph;

use std::sync::Arc;

use tauri::State;

// Re-exports
pub use types::{
    HookEvent, HybridSearchResult, MemoryItem, MemoryLayer,
    MemoryQuery, MemoryStats, SyncResult,
};
pub use config::MemoryConfig;
pub use service::MemoryService;

// ============================================================================
// Tauri Commands
// ============================================================================

/// Memory search command
#[tauri::command]
pub async fn memory_search(
    query: MemoryQuery,
    state: State<'_, Arc<MemoryService>>,
) -> Result<HybridSearchResult, String> {
    state.search(&query).await.map_err(|e| e.to_string())
}

/// Memory add command
#[tauri::command]
pub async fn memory_add(
    item: MemoryItem,
    state: State<'_, Arc<MemoryService>>,
) -> Result<(), String> {
    state.add(&item).await.map_err(|e| e.to_string())
}

/// Memory update command
#[tauri::command]
pub async fn memory_update(
    id: String,
    item: MemoryItem,
    state: State<'_, Arc<MemoryService>>,
) -> Result<(), String> {
    state.update(&id, &item).await.map_err(|e| e.to_string())
}

/// Memory delete command
#[tauri::command]
pub async fn memory_delete(
    layer: MemoryLayer,
    id: String,
    state: State<'_, Arc<MemoryService>>,
) -> Result<(), String> {
    state.delete(layer, &id).await.map_err(|e| e.to_string())
}

/// Memory stats command
#[tauri::command]
pub async fn memory_stats(
    user_id: String,
    tenant_id: String,
    state: State<'_, Arc<MemoryService>>,
) -> Result<MemoryStats, String> {
    state.get_stats(&user_id, &tenant_id).await.map_err(|e| e.to_string())
}

/// Memory sync command
#[tauri::command]
pub async fn memory_sync(
    state: State<'_, Arc<MemoryService>>,
) -> Result<SyncResult, String> {
    state.sync().await.map_err(|e| e.to_string())
}

/// Hook event command
#[tauri::command]
pub async fn memory_hook_event(
    event: HookEvent,
    state: State<'_, Arc<MemoryService>>,
) -> Result<(), String> {
    state.on_hook_event(&event).await.map_err(|e| e.to_string())
}
