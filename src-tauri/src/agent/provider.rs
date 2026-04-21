use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use super::{AgentError, AgentMessage, AgentResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderRequest {
    pub session_id: String,
    pub trace_id: String,
    pub messages: Vec<AgentMessage>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderResponse {
    pub content: String,
    pub tool_calls: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

#[async_trait]
pub trait AgentProvider: Send + Sync {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse>;
}

pub struct UnconfiguredProvider;

impl UnconfiguredProvider {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl AgentProvider for UnconfiguredProvider {
    async fn complete(&self, _request: ProviderRequest) -> AgentResult<ProviderResponse> {
        Err(AgentError::ProviderNotConfigured)
    }
}

/// Blanket implementation: Arc<dyn AgentProvider> delegates to the underlying trait object.
/// This allows create_provider_from_config to return Arc<dyn AgentProvider> uniformly
/// for both LlmAgentProvider and DualAgentProvider.
#[async_trait]
impl<T: AgentProvider + ?Sized> AgentProvider for Arc<T> {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        (**self).complete(request).await
    }
}
