//! Dual Agent Provider with Plan/Act Strategy Support
//!
//! Provides mode-based agent execution by delegating to either Plan or Act LLM providers.
//! This implements the Strategy pattern: Plan and Act are separate execution strategies,
//! and the provider switches between them based on the current mode.

use std::sync::Arc;
use std::sync::RwLock;

use async_trait::async_trait;

use super::llm_provider::config::AgentMode;
use super::llm_provider::{LlmMessage, LlmProvider, LlmRequest, LlmResponse};
use super::provider::{ProviderRequest, ProviderResponse};
use super::{AgentError, AgentProvider, AgentResult};

/// Strategy-based agent provider supporting Plan/Act dual mode.
///
/// Uses the Strategy pattern: each mode is a separate execution strategy,
/// and the provider switches between them without changing the outer interface.
pub struct DualAgentProvider {
    /// Plan mode LLM (read-only tools only)
    plan_llm: Option<Arc<dyn LlmProvider>>,
    /// Act mode LLM (all tools)
    act_llm: Arc<dyn LlmProvider>,
    /// Current active mode (interior mutability)
    current_mode: RwLock<AgentMode>,
}

impl DualAgentProvider {
    /// Create a new DualAgentProvider with dual configuration
    pub fn new(
        act_llm: Arc<dyn LlmProvider>,
        plan_llm: Option<Arc<dyn LlmProvider>>,
    ) -> Self {
        Self {
            plan_llm,
            act_llm,
            current_mode: RwLock::new(AgentMode::Act),
        }
    }

    /// Get the current active mode
    pub fn get_mode(&self) -> AgentMode {
        self.current_mode.read().unwrap_or_else(|e| e.into_inner()).clone()
    }

    /// Set the current active mode
    pub fn set_mode(&self, mode: AgentMode) {
        let mut current = self.current_mode.write().unwrap_or_else(|e| e.into_inner());
        *current = mode;
    }

    /// Get the active LLM based on current mode
    fn get_active_llm(&self) -> Arc<dyn LlmProvider> {
        match self.get_mode() {
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
            tool_calls: llm_response.tool_calls.map(|tc| serde_json::json!(tc)),
            metadata: llm_response.metadata,
        }
    }
}

#[async_trait]
impl AgentProvider for DualAgentProvider {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        let llm_request = self.create_llm_request(&request);

        let llm = self.get_active_llm();
        let llm_response = llm
            .complete(llm_request)
            .await
            .map_err(|e| AgentError::Execution(e.to_string()))?;

        Ok(self.create_provider_response(llm_response))
    }
}
