use async_trait::async_trait;
use serde::{Deserialize, Serialize};

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
