//! Agent Loop - 单文件核心执行引擎
//!
//! 灵感来源: Claude Code QueryEngine.ts
//! 设计原则: KISS - 核心逻辑在一个文件中内聚完整
//! 参照架构: Claude Code Agent架构精简方案 (v2026.04)
//!
//! 优化前调用链路 (10+ 层):
//!   AgentRuntimeState -> LlmAgentProvider -> DualAgentProvider -> LlmProvider -> ZhipuProvider/...
//!
//! 优化后调用链路 (3 层):
//!   AgentLoop.run() -> Provider.complete() -> ZhipuProvider/...

use std::collections::HashSet;
use std::sync::Arc;

use async_trait::async_trait;
use tokio::sync::RwLock;
use uuid::Uuid;

// Re-export types from provider.rs so callers only need one import
pub use super::provider::{
    AgentProvider, LoopMode, LoopRequest, LoopResponse, LoopStreamResponse,
    LoopToolCall, ProviderRequest, ProviderResponse,
};

use super::runtime_session::RuntimeSessionService;

use super::simple_monitoring::SimpleMonitor;
use super::{AgentError, AgentMessage, AgentResult};

// Tool pipeline for execution
use super::tools::pipeline::{ToolExecutionContext, ToolExecutionPipeline, ToolExecutionRequest};

// ============================================================================
// TokenUsage - Tracks LLM token consumption
// ============================================================================

#[derive(Debug, Clone, Default)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

impl TokenUsage {
    pub fn new(prompt: u32, completion: u32) -> Self {
        Self {
            prompt_tokens: prompt,
            completion_tokens: completion,
            total_tokens: prompt.saturating_add(completion),
        }
    }
}

// ============================================================================
// AgentLoop Trait
// ============================================================================

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
            "Streaming not yet implemented".to_string(),
        ))
    }
}

// ============================================================================
// StandardAgentLoop - Full Implementation
// ============================================================================

/// The standard agent execution loop.
/// This replaces the multi-layer provider pattern (LlmAgentProvider + DualAgentProvider)
/// with a single, cohesive execution engine.
pub struct StandardAgentLoop {
    provider: Arc<dyn AgentProvider>,
    session_service: Option<Arc<RuntimeSessionService>>,
    cancellations: Arc<RwLock<HashSet<String>>>,
    tool_pipeline: Option<Arc<ToolExecutionPipeline>>,
    /// Unified monitoring facade
    monitor: Arc<SimpleMonitor>,
    /// Max context tokens before triggering compression (default ~80K)
    max_context_tokens: usize,
    /// Token estimate per character (chars / 4 ≈ tokens for English-heavy text)
    tokens_per_char: f64,
}

impl StandardAgentLoop {
    pub fn new(provider: Arc<dyn AgentProvider>) -> Self {
        Self {
            provider,
            session_service: None,
            cancellations: Arc::new(RwLock::new(HashSet::new())),
            tool_pipeline: None,
            monitor: Arc::new(SimpleMonitor::new()),
            max_context_tokens: 80_000,
            tokens_per_char: 0.25,
        }
    }

    pub fn with_session_service(mut self, service: Arc<RuntimeSessionService>) -> Self {
        self.session_service = Some(service);
        self
    }

    pub fn with_tool_pipeline(mut self, pipeline: Arc<ToolExecutionPipeline>) -> Self {
        self.tool_pipeline = Some(pipeline);
        self
    }

    pub fn with_monitor(mut self, monitor: Arc<SimpleMonitor>) -> Self {
        self.monitor = monitor;
        self
    }

    pub fn with_max_context_tokens(mut self, tokens: usize) -> Self {
        self.max_context_tokens = tokens;
        self
    }

    pub async fn interrupt(&self, session_id: &str) {
        let mut cancellations = self.cancellations.write().await;
        cancellations.insert(session_id.to_string());
    }

    pub async fn clear_interrupt(&self, session_id: &str) {
        let mut cancellations = self.cancellations.write().await;
        cancellations.remove(session_id);
    }

    pub async fn is_cancelled(&self, session_id: &str) -> bool {
        let cancellations = self.cancellations.read().await;
        cancellations.contains(session_id)
    }

    fn estimate_tokens(&self, msg: &AgentMessage) -> usize {
        ((msg.content.len() as f64) * self.tokens_per_char) as usize
    }

    fn total_tokens(&self, messages: &[AgentMessage]) -> usize {
        messages
            .iter()
            .map(|m| self.estimate_tokens(m))
            .sum::<usize>()
            .saturating_add(512)
    }

    fn should_compact(&self, messages: &[AgentMessage]) -> bool {
        self.total_tokens(messages) > self.max_context_tokens
    }

    fn compact_messages(&self, messages: &[AgentMessage]) -> Vec<AgentMessage> {
        if messages.is_empty() {
            return Vec::new();
        }

        let system_idx = messages
            .iter()
            .position(|m| m.role == "system")
            .unwrap_or(0);

        let mut result = Vec::with_capacity(messages.len());
        let mut summary_count = 0;

        for (i, msg) in messages.iter().enumerate() {
            if i == system_idx && msg.role == "system" {
                result.push(msg.clone());
            } else if i >= messages.len().saturating_sub(8) {
                result.push(msg.clone());
            } else {
                summary_count += 1;
            }
        }

        if summary_count > 0 {
            let summary_msg = AgentMessage {
                role: "system".to_string(),
                content: format!(
                    "[Previous {} messages summarized due to context length]",
                    summary_count
                ),
                metadata: Some(serde_json::json!({
                    "_compact": true,
                    "collapsed_count": summary_count
                })),
            };
            if result.first().map(|m| m.role.as_str()) == Some("system") {
                result.insert(1, summary_msg);
            } else {
                result.insert(0, summary_msg);
            }
        }

        result
    }

    async fn call_llm(
        &self,
        session_id: &str,
        trace_id: &str,
        messages: &[AgentMessage],
        mode: LoopMode,
    ) -> AgentResult<ProviderResponse> {
        self.provider
            .complete(ProviderRequest {
                session_id: session_id.to_string(),
                trace_id: trace_id.to_string(),
                messages: messages.to_vec(),
                metadata: Some(serde_json::json!({ "mode": mode })),
            })
            .await
    }

    async fn execute_tool(
        &self,
        tool_call: &LoopToolCall,
        session_id: &str,
    ) -> AgentResult<String> {
        let Some(ref pipeline) = self.tool_pipeline else {
            return Ok(format!(
                "[Tool '{}' skipped: no tool pipeline configured]",
                tool_call.name
            ));
        };

        let ctx = ToolExecutionContext {
            session_id: session_id.to_string(),
            user_id: "agent".to_string(),
            tenant_id: "default".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: Vec::new(),
            metadata: None,
        };

        let req = ToolExecutionRequest {
            tool_id: tool_call.name.clone(),
            parameters: tool_call.arguments.clone(),
            context: ctx,
            execution_id: Some(tool_call.id.clone()),
            parent_execution_id: None,
            timeout_ms: None,
            metadata: None,
            message_id: None,
            agent_mode: None,
            routing_mode: None,
            yolo_ttl: None,
            yolo_activated_at: None,
            profile: None,
            profile_config: None,
        };

        match pipeline.execute(req, None).await {
            Ok(response) => {
                let result_str = serde_json::to_string(&response.result)
                    .unwrap_or_else(|_| "null".to_string());
                Ok(result_str)
            }
            Err(e) => Err(AgentError::Execution(format!(
                "Tool '{}' execution failed: {}",
                tool_call.name, e
            ))),
        }
    }
}

#[async_trait]
impl AgentLoop for StandardAgentLoop {
    #[allow(unused_assignments)]
    async fn run(&self, request: LoopRequest) -> AgentResult<LoopResponse> {
        let mut messages = request.messages.clone();
        let mut total_turns = 0;
        let mut final_content = String::new();
        let mut all_tool_calls = Vec::new();
        let trace_id = if request.trace_id.is_empty() {
            Uuid::new_v4().to_string()
        } else {
            request.trace_id.clone()
        };

        if let Some(ref service) = self.session_service {
            let _ = service.ensure_session(&request.session_id, "agent").await;
        }

        loop {
            if self.is_cancelled(&request.session_id).await {
                return Err(AgentError::Interrupted);
            }

            if self.should_compact(&messages) && total_turns > 0 {
                let old_count = messages.len();
                messages = self.compact_messages(&messages);
                tracing::debug!(
                    "Context compressed: {} -> {} messages",
                    old_count,
                    messages.len()
                );
            }

            let response = self
                .call_llm(
                    &request.session_id,
                    &trace_id,
                    &messages,
                    request.mode,
                )
                .await?;

            final_content = response.content.clone();

            let Some(tool_calls_json) = response.tool_calls else {
                break;
            };

            let tool_calls: Vec<serde_json::Value> =
                serde_json::from_value(tool_calls_json).unwrap_or_default();

            for tc in tool_calls {
                let id = tc["id"].as_str().unwrap_or("").to_string();
                let name = tc["name"].as_str().unwrap_or("").to_string();
                let arguments = tc["arguments"].clone();

                let result = self
                    .execute_tool(
                        &LoopToolCall::new(id.clone(), name.clone(), arguments.clone()),
                        &request.session_id,
                    )
                    .await
                    .unwrap_or_else(|e| format!("Error: {}", e));

                messages.push(AgentMessage {
                    role: "tool".to_string(),
                    content: result,
                    metadata: Some(serde_json::json!({
                        "tool_call_id": id,
                        "tool_name": name,
                    })),
                });

                all_tool_calls.push(LoopToolCall::new(id, name, arguments));
            }

            total_turns += 1;
            if total_turns >= request.max_turns {
                tracing::debug!(
                    "Agent loop reached max turns ({})",
                    request.max_turns
                );
                break;
            }
        }

        if let Some(ref service) = self.session_service {
            let _ = service
                .append_message(
                    &request.session_id,
                    "assistant",
                    Some(final_content.clone()),
                    None,
                )
                .await;
        }

        Ok(LoopResponse {
            content: final_content,
            tool_calls: all_tool_calls,
            total_turns,
            metadata: None,
        })
    }
}

impl Clone for StandardAgentLoop {
    fn clone(&self) -> Self {
        Self {
            provider: Arc::clone(&self.provider),
            session_service: self.session_service.clone(),
            cancellations: Arc::clone(&self.cancellations),
            tool_pipeline: self.tool_pipeline.clone(),
            monitor: Arc::clone(&self.monitor),
            max_context_tokens: self.max_context_tokens,
            tokens_per_char: self.tokens_per_char,
        }
    }
}

// ============================================================================
// LlmAgentLoop - Convenience wrapper
// ============================================================================

/// Convenience wrapper around StandardAgentLoop.
pub struct LlmAgentLoop {
    inner: StandardAgentLoop,
}

impl LlmAgentLoop {
    pub fn new(provider: Arc<dyn AgentProvider>) -> Self {
        Self {
            inner: StandardAgentLoop::new(provider),
        }
    }

    pub fn with_session_service(mut self, service: Arc<RuntimeSessionService>) -> Self {
        self.inner = self.inner.with_session_service(service);
        self
    }

    pub fn with_tool_pipeline(mut self, pipeline: Arc<ToolExecutionPipeline>) -> Self {
        self.inner = self.inner.with_tool_pipeline(pipeline);
        self
    }

    pub fn with_monitor(mut self, monitor: Arc<SimpleMonitor>) -> Self {
        self.inner = self.inner.with_monitor(monitor);
        self
    }

    pub async fn interrupt(&self, session_id: &str) {
        self.inner.interrupt(session_id).await;
    }

    pub async fn clear_interrupt(&self, session_id: &str) {
        self.inner.clear_interrupt(session_id).await;
    }
}

#[async_trait]
impl AgentLoop for LlmAgentLoop {
    async fn run(&self, request: LoopRequest) -> AgentResult<LoopResponse> {
        self.inner.run(request).await
    }
}

impl Clone for LlmAgentLoop {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}
