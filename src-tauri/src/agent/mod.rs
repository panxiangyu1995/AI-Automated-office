//! Agent runtime core module.

pub mod audit;
pub mod context_compression;
pub mod correction;
pub mod error_recovery;
pub mod events;
pub mod execution;
pub mod heartbeat;
pub mod knowledge_retrieval;
pub mod llm_agent_provider;
pub mod memory;
pub mod mock_provider;
pub mod skill;
pub mod monitoring;
pub mod config;
pub mod mode;
pub mod nested;
pub mod permission;
pub mod result;
pub mod routing;
pub mod template;
pub mod orchestrator;
pub mod provider;
pub mod llm_provider;
pub mod prompt_builder;
pub mod runtime_session;
pub mod security;
pub mod tools;
pub mod websocket;
pub mod message_sync;
pub mod context_compression_integration;

use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::agent::llm_provider::config::AgentMode;
use provider::AgentProvider;

#[derive(Debug, Error)]
pub enum AgentError {
    #[error("agent provider is not configured")]
    ProviderNotConfigured,
    #[error("agent execution interrupted")]
    Interrupted,
    #[error("agent storage error: {0}")]
    Storage(String),
    #[error("agent execution error: {0}")]
    Execution(String),
}

pub type AgentResult<T> = Result<T, AgentError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    pub role: String,
    pub content: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionRequest {
    pub tenant_id: String,
    pub user_id: String,
    pub session_id: String,
    pub message: String,
    pub metadata: Option<serde_json::Value>,
    /// Agent execution mode for Plan/Act dual configuration
    #[serde(default)]
    pub agent_mode: Option<AgentMode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentExecutionStatus {
    Completed,
    Interrupted,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionResponse {
    pub session_id: String,
    pub trace_id: String,
    pub status: AgentExecutionStatus,
    pub content: Option<String>,
    pub error: Option<String>,
}

#[derive(Clone)]
pub struct AgentRuntimeState {
    /// Agent provider wrapped in RwLock for interior mutability
    provider: Arc<RwLock<Arc<dyn AgentProvider>>>,
    cancellations: Arc<RwLock<HashSet<String>>>,
}

impl AgentRuntimeState {
    pub fn new() -> Self {
        Self {
            // Default to MockProvider - use set_provider() to replace with real provider
            provider: Arc::new(RwLock::new(Arc::new(mock_provider::MockProvider::new()))),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    /// Create AgentRuntimeState with MockProvider (for testing)
    pub fn with_mock_provider() -> Self {
        Self {
            provider: Arc::new(RwLock::new(Arc::new(mock_provider::MockProvider::new()))),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    /// Create AgentRuntimeState with MockProviderWithTools (for testing tool calls)
    pub fn with_mock_provider_with_tools() -> Self {
        Self {
            provider: Arc::new(RwLock::new(Arc::new(mock_provider::MockProviderWithTools::new()))),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    /// Set the agent provider (replaces MockProvider with real provider)
    /// Uses interior mutability via RwLock
    pub async fn set_provider(&self, provider: Arc<dyn AgentProvider>) {
        let mut guard = self.provider.write().await;
        *guard = provider;
    }

    pub fn provider(&self) -> Arc<dyn AgentProvider> {
        Arc::clone(&*self.provider.blocking_read())
    }

    /// Get the provider for async operations
    pub async fn get_provider(&self) -> Arc<dyn AgentProvider> {
        Arc::clone(&*self.provider.read().await)
    }

    pub fn cancellations(&self) -> Arc<RwLock<HashSet<String>>> {
        Arc::clone(&self.cancellations)
    }

    pub async fn interrupt(&self, session_id: &str) -> bool {
        let mut cancellations = self.cancellations.write().await;
        cancellations.insert(session_id.to_string())
    }
}
