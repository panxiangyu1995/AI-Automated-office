//! LLM Agent Provider
//!
//! Adapter that implements AgentProvider using a real LLM Provider.
//! Supports Plan/Act dual configuration mode.

use async_trait::async_trait;
use std::sync::Arc;

use super::{AgentError, AgentProvider, AgentResult};
use super::llm_provider::config::AgentMode;
use super::llm_provider::{LlmMessage, LlmProvider, LlmRequest, LlmResponse};
use super::provider::{ProviderRequest, ProviderResponse};

/// LLM-backed Agent Provider with Plan/Act dual configuration support
pub struct LlmAgentProvider {
    /// LLM provider for Plan mode (read-only tools only)
    plan_llm: Option<Arc<dyn LlmProvider>>,
    /// LLM provider for Act mode (all tools)
    act_llm: Arc<dyn LlmProvider>,
    /// Current active mode
    current_mode: AgentMode,
    default_session_id: String,
}

impl LlmAgentProvider {
    /// Create a new LlmAgentProvider with the given LLM provider (backward compatible)
    pub fn new(llm: Arc<dyn LlmProvider>) -> Self {
        Self {
            plan_llm: None,
            act_llm: llm,
            current_mode: AgentMode::Act,
            default_session_id: "agent_session".to_string(),
        }
    }

    /// Create a new LlmAgentProvider with dual configuration (Plan/Act)
    pub fn with_dual_config(
        act_llm: Arc<dyn LlmProvider>,
        plan_llm: Option<Arc<dyn LlmProvider>>,
    ) -> Self {
        Self {
            plan_llm,
            act_llm,
            current_mode: AgentMode::Act,
            default_session_id: "agent_session".to_string(),
        }
    }

    /// Get the active mode
    pub fn get_active_mode(&self) -> AgentMode {
        self.current_mode
    }

    /// Set the active mode
    pub fn set_active_mode(&mut self, mode: AgentMode) {
        self.current_mode = mode;
    }

    /// Get the appropriate LLM provider based on current mode
    fn get_active_provider(&self) -> Arc<dyn LlmProvider> {
        match self.current_mode {
            AgentMode::Plan => self.plan_llm.as_ref().unwrap_or(&self.act_llm).clone(),
            AgentMode::Act => self.act_llm.clone(),
        }
    }

    /// Get provider for a specific mode (used by orchestrator)
    pub fn get_provider_for_mode(&self, mode: AgentMode) -> Arc<dyn LlmProvider> {
        match mode {
            AgentMode::Plan => self.plan_llm.as_ref().unwrap_or(&self.act_llm).clone(),
            AgentMode::Act => self.act_llm.clone(),
        }
    }

    /// Check if Plan mode is configured
    pub fn has_plan_mode(&self) -> bool {
        self.plan_llm.is_some()
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

        let llm_response = self
            .get_active_provider()
            .complete(llm_request)
            .await
            .map_err(|e| AgentError::Execution(e.to_string()))?;

        Ok(self.create_provider_response(llm_response))
    }
}
