//! Memory tools module.
//!
//! Provides semantic memory search and retrieval capabilities.
//!
//! # Tools
//!
//! - `memory_search`: Search memories using semantic similarity
//! - `memory_get`: Retrieve memory by ID
//!
//! # Architecture
//!
//! This module integrates with the vector store for semantic search.
//! Memory entries are stored with embeddings for fast similarity search.

pub mod memory_get;
pub mod memory_search;

use std::collections::HashMap;
use std::sync::Arc;

use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;

/// Register all memory tools to the registry and executor map
pub fn register_memory_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    // Register memory_search tool
    let memory_search_descriptor = ToolDescriptor {
        id: "memory_search".to_string(),
        name: "Memory Search".to_string(),
        description:
            "Search memories using semantic similarity. Supports filtering by source, date range, and minimum score threshold."
                .to_string(),
        category: ToolCategory::Memory,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: true,
            estimated_duration: Some(500),
        },
        permissions: None,
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["memory".to_string(), "search".to_string(), "semantic".to_string()],
            category: "memory".to_string(),
            subcategory: Some("search".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::memory".to_string()),
        handler_function: Some("memory_search".to_string()),
    };
    let _ = registry.register(memory_search_descriptor);
    executors.insert(
        "memory_search".to_string(),
        Arc::new(memory_search::MemorySearchExecutor::new()),
    );

    // Register memory_get tool
    let memory_get_descriptor = ToolDescriptor {
        id: "memory_get".to_string(),
        name: "Memory Get".to_string(),
        description: "Retrieve a specific memory entry by its ID.".to_string(),
        category: ToolCategory::Memory,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Sync,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: false,
            estimated_duration: Some(100),
        },
        permissions: None,
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec!["memory".to_string(), "get".to_string(), "retrieve".to_string()],
            category: "memory".to_string(),
            subcategory: Some("retrieve".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::memory".to_string()),
        handler_function: Some("memory_get".to_string()),
    };
    let _ = registry.register(memory_get_descriptor);
    executors.insert(
        "memory_get".to_string(),
        Arc::new(memory_get::MemoryGetExecutor::new()),
    );
}