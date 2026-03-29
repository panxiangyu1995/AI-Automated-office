//! LLM Agent Provider
//!
//! Adapter that implements AgentProvider using a real LLM Provider.

use async_trait::async_trait;
use std::sync::Arc;

use super::{AgentError, AgentMessage, AgentProvider, AgentResult};
use super::llm_provider::{LlmMessage, LlmProvider, LlmRequest, LlmResponse};
use super::provider::{ProviderRequest, ProviderResponse};

/// LLM-backed Agent Provider
pub struct LlmAgentProvider {
    llm: Arc<dyn LlmProvider>,
    default_session_id: String,
}

impl LlmAgentProvider {
    /// Create a new LlmAgentProvider with the given LLM provider
    pub fn new(llm: Arc<dyn LlmProvider>) -> Self {
        Self {
            llm,
            default_session_id: "agent_session".to_string(),
        }
    }

    /// Create LlmRequest from ProviderRequest
    fn create_llm_request(&self, request: &ProviderRequest) -> LlmRequest {
        let messages: Vec<LlmMessage> = request
            .messages
            .iter()
            .map(|msg| LlmMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
                tool_calls: None,
            })
            .collect();

        LlmRequest {
            session_id: request.session_id.clone(),
            trace_id: uuid::Uuid::new_v4().to_string(),
            messages,
            tools: None,
            stream: false,
            metadata: request.metadata.clone(),
        }
    }

    /// Create ProviderResponse from LlmResponse
    fn create_provider_response(&self, llm_response: LlmResponse) -> ProviderResponse {
        ProviderResponse {
            content: llm_response.content,
            tool_calls: llm_response.tool_calls.map(|tc| {
                serde_json::json!(tc)
            }),
            metadata: llm_response.metadata,
        }
    }
}

#[async_trait]
impl AgentProvider for LlmAgentProvider {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        let llm_request = self.create_llm_request(&request);

        let llm_response = self.llm
            .complete(llm_request)
            .await
            .map_err(|e| AgentError::Execution(e.to_string()))?;

        Ok(self.create_provider_response(llm_response))
    }
}
