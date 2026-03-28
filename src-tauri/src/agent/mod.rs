//! Agent runtime core module.

pub mod audit;
pub mod context_compression;
pub mod correction;
pub mod error_recovery;
pub mod events;
pub mod execution;
pub mod knowledge_retrieval;
pub mod mock_provider;
pub mod nested;
pub mod routing;
pub mod orchestrator;
pub mod provider;
pub mod prompt_builder;
pub mod runtime_session;
pub mod security;
pub mod tools;

use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::{Deserialize, Serialize};
use thiserror::Error;

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
    provider: Arc<dyn AgentProvider>,
    cancellations: Arc<RwLock<HashSet<String>>>,
}

impl AgentRuntimeState {
    pub fn new() -> Self {
        Self {
            // Use MockProvider for testing - replace with real provider in production
            provider: Arc::new(mock_provider::MockProvider::new()),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    /// Create AgentRuntimeState with MockProvider (for testing)
    pub fn with_mock_provider() -> Self {
        Self {
            provider: Arc::new(mock_provider::MockProvider::new()),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    /// Create AgentRuntimeState with MockProviderWithTools (for testing tool calls)
    pub fn with_mock_provider_with_tools() -> Self {
        Self {
            provider: Arc::new(mock_provider::MockProviderWithTools::new()),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    pub fn provider(&self) -> Arc<dyn AgentProvider> {
        Arc::clone(&self.provider)
    }

    pub fn cancellations(&self) -> Arc<RwLock<HashSet<String>>> {
        Arc::clone(&self.cancellations)
    }

    pub async fn interrupt(&self, session_id: &str) -> bool {
        let mut cancellations = self.cancellations.write().await;
        cancellations.insert(session_id.to_string())
    }
}
