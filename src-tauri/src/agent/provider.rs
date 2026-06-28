use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::pin::Pin;
use std::sync::Arc;
use tokio_stream::Stream;
use uuid::Uuid;

use super::{AgentError, AgentMessage, AgentResult};

// ============================================================================
// Provider Request/Response Types
// ============================================================================

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    pub content: String,
    pub done: bool,
    pub metadata: Option<serde_json::Value>,
}

pub type StreamResponse = Pin<Box<dyn Stream<Item = Result<StreamChunk, AgentError>> + Send>>;

// ============================================================================
// AgentProvider Trait
// ============================================================================

#[async_trait]
pub trait AgentProvider: Send + Sync {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse>;
}

// ============================================================================
// Unconfigured Provider
// ============================================================================

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
#[async_trait]
impl<T: AgentProvider + ?Sized> AgentProvider for Arc<T> {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        (**self).complete(request).await
    }
}

// ============================================================================
// LlmAgentProviderAdapter - Unified Agent Provider
// ============================================================================

/// Adapter that wraps an LLM provider to implement the AgentProvider trait.
/// Merges the previously separate LlmAgentProvider and DualAgentProvider into one.
/// Plan/Act mode switching is done via request metadata (LoopMode in ProviderRequest).
pub struct LlmAgentProviderAdapter {
    act_llm: Arc<dyn crate::agent::llm_provider::LlmProvider>,
    plan_llm: Option<Arc<dyn crate::agent::llm_provider::LlmProvider>>,
}

impl LlmAgentProviderAdapter {
    pub fn new(
        act_llm: Arc<dyn crate::agent::llm_provider::LlmProvider>,
        plan_llm: Option<Arc<dyn crate::agent::llm_provider::LlmProvider>>,
    ) -> Self {
        Self { act_llm, plan_llm }
    }

    pub fn has_plan_mode(&self) -> bool {
        self.plan_llm.is_some()
    }

    pub fn get_active_mode(&self) -> LoopMode {
        LoopMode::Act
    }

    pub fn get_provider_for_mode(&self, mode: LoopMode) -> Arc<dyn crate::agent::llm_provider::LlmProvider> {
        match mode {
            LoopMode::Plan => self.plan_llm.as_ref().unwrap_or(&self.act_llm).clone(),
            LoopMode::Act => self.act_llm.clone(),
        }
    }

    fn resolve_llm(&self, request: &ProviderRequest) -> Arc<dyn crate::agent::llm_provider::LlmProvider> {
        if let Some(mode_val) = request.metadata.as_ref().and_then(|m| m.get("mode")) {
            if *mode_val == serde_json::json!("Plan") || *mode_val == serde_json::json!("plan") {
                return self.plan_llm.as_ref().unwrap_or(&self.act_llm).clone();
            }
        }
        self.act_llm.clone()
    }

    fn to_llm_request(&self, request: &ProviderRequest) -> crate::agent::llm_provider::LlmRequest {
        let messages: Vec<crate::agent::llm_provider::LlmMessage> = request
            .messages
            .iter()
            .map(|msg| crate::agent::llm_provider::LlmMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
                tool_calls: None,
            })
            .collect();

        crate::agent::llm_provider::LlmRequest {
            session_id: request.session_id.clone(),
            trace_id: Uuid::new_v4().to_string(),
            messages,
            tools: None,
            stream: false,
            metadata: request.metadata.clone(),
        }
    }

    fn to_provider_response(&self, llm_response: crate::agent::llm_provider::LlmResponse) -> ProviderResponse {
        ProviderResponse {
            content: llm_response.content,
            tool_calls: llm_response.tool_calls.map(|tc| serde_json::json!(tc)),
            metadata: llm_response.metadata,
        }
    }
}

#[async_trait]
impl AgentProvider for LlmAgentProviderAdapter {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        let llm_request = self.to_llm_request(&request);
        let llm = self.resolve_llm(&request);
        let llm_response = llm
            .complete(llm_request)
            .await
            .map_err(|e| AgentError::Execution(e.to_string()))?;
        Ok(self.to_provider_response(llm_response))
    }
}

// ============================================================================
// AgentLoop Trait - Core Execution Engine
// ============================================================================

/// Agent execution mode for Plan/Act dual configuration
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LoopMode {
    /// Execute mode - performs actions directly
    #[default]
    Act,
    /// Plan mode - generates plans without execution
    Plan,
}

/// Agent loop request - core input for the execution loop
#[derive(Debug, Clone)]
pub struct LoopRequest {
    pub session_id: String,
    pub trace_id: String,
    pub messages: Vec<AgentMessage>,
    pub mode: LoopMode,
    pub max_turns: usize,
    pub metadata: Option<serde_json::Value>,
}

impl LoopRequest {
    pub fn new(session_id: String, messages: Vec<AgentMessage>) -> Self {
        Self {
            session_id,
            trace_id: Uuid::new_v4().to_string(),
            messages,
            mode: LoopMode::Act,
            max_turns: 50,
            metadata: None,
        }
    }

    pub fn with_mode(mut self, mode: LoopMode) -> Self {
        self.mode = mode;
        self
    }

    pub fn with_max_turns(mut self, max_turns: usize) -> Self {
        self.max_turns = max_turns;
        self
    }
}

/// Agent loop response - output from the execution loop
#[derive(Debug, Clone)]
pub struct LoopResponse {
    pub content: String,
    pub tool_calls: Vec<LoopToolCall>,
    pub total_turns: usize,
    pub metadata: Option<serde_json::Value>,
}

/// A tool call made during loop execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoopToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
    pub result: Option<String>,
}

impl LoopToolCall {
    pub fn new(id: String, name: String, arguments: serde_json::Value) -> Self {
        Self {
            id,
            name,
            arguments,
            result: None,
        }
    }

    pub fn with_result(mut self, result: String) -> Self {
        self.result = Some(result);
        self
    }
}

/// Agent loop streaming response
#[derive(Debug, Clone)]
pub struct LoopStreamResponse {
    pub content: String,
    pub tool_calls: Vec<LoopToolCall>,
    pub total_turns: usize,
}

pub type LoopStream = Pin<Box<dyn Stream<Item = Result<LoopResponse, AgentError>> + Send>>;

/// Core trait for the Agent execution loop.
/// Inspired by Claude Code's QueryEngine.ts - single file containing all execution logic.
#[async_trait]
pub trait AgentLoop: Send + Sync {
    async fn run(&self, request: LoopRequest) -> AgentResult<LoopResponse>;

    async fn stream_run(&self, _request: LoopRequest) -> AgentResult<LoopStreamResponse>
    where
        Self: Sized,
    {
        Err(AgentError::Execution(
            "Streaming not implemented for this loop".to_string(),
        ))
    }
}

// ============================================================================
// Utility: Convert AgentMessage <-> LlmMessage
// ============================================================================

use super::llm_provider::{LlmMessage, LlmResponse};

/// Convert ProviderRequest messages to LLM request messages
pub fn to_llm_messages(messages: &[AgentMessage]) -> Vec<LlmMessage> {
    messages
        .iter()
        .map(|msg| LlmMessage {
            role: msg.role.clone(),
            content: msg.content.clone(),
            tool_calls: None,
        })
        .collect()
}

/// Convert LLM response to Provider response
pub fn from_llm_response(llm_response: LlmResponse) -> ProviderResponse {
    ProviderResponse {
        content: llm_response.content,
        tool_calls: llm_response.tool_calls.map(|tc| serde_json::json!(tc)),
        metadata: llm_response.metadata,
    }
}

/// Create a ProviderRequest from a LoopRequest
pub fn loop_request_to_provider_request(loop_req: &LoopRequest) -> ProviderRequest {
    ProviderRequest {
        session_id: loop_req.session_id.clone(),
        trace_id: loop_req.trace_id.clone(),
        messages: loop_req.messages.clone(),
        metadata: Some(serde_json::json!({
            "mode": loop_req.mode,
            "max_turns": loop_req.max_turns,
        })),
    }
}
