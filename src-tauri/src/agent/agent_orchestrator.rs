use std::collections::HashSet;
use std::sync::Arc;

use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::Utc;

use super::agent_loop::{AgentLoop, StandardAgentLoop};
use super::events::RuntimeEventEmitter;
use super::prompt_builder::{
    AgentProviderExt, BuiltPrompt, ProviderChatRequest, ProviderChatResponse,
    ProviderConfig, ProviderId, ProviderMessage, ProviderResponseMetadata,
    ProviderSelector, PromptBuilder, PromptBuildOptions,
    RetryPolicy, RuntimeContext, ToolDescriptor,
};
use super::provider::{AgentProvider, LoopMode, LoopRequest, ProviderRequest};
use super::runtime_session::RuntimeSessionService;
use super::tools::pipeline::ToolExecutionPipeline;
use super::{
    AgentError,
    AgentExecutionRequest,
    AgentExecutionResponse,
    AgentExecutionStatus,
    AgentMessage,
    AgentResult,
};

pub struct AgentOrchestrator {
    provider: Arc<dyn AgentProvider>,
    runtime: Arc<RuntimeSessionService>,
    cancellations: Arc<RwLock<HashSet<String>>>,
    /// Prompt builder for constructing prompts
    prompt_builder: PromptBuilder,
    /// Provider selector for multi-provider support
    provider_selector: ProviderSelector,
    /// Default provider configuration
    default_config: ProviderConfig,
    /// Tool execution pipeline (optional, enables multi-turn tool execution)
    tool_pipeline: Option<Arc<ToolExecutionPipeline>>,
}

impl Clone for AgentOrchestrator {
    fn clone(&self) -> Self {
        Self {
            provider: Arc::clone(&self.provider),
            runtime: Arc::clone(&self.runtime),
            cancellations: Arc::clone(&self.cancellations),
            prompt_builder: self.prompt_builder.clone(),
            provider_selector: self.provider_selector.clone(),
            default_config: self.default_config.clone(),
            tool_pipeline: self.tool_pipeline.clone(),
        }
    }
}

impl AgentOrchestrator {
    pub fn new(
        provider: Arc<dyn AgentProvider>,
        runtime: RuntimeSessionService,
        cancellations: Arc<RwLock<HashSet<String>>>,
    ) -> Self {
        Self {
            provider,
            runtime: Arc::new(runtime),
            cancellations,
            prompt_builder: PromptBuilder::new(),
            provider_selector: ProviderSelector::new(),
            default_config: ProviderConfig::default(),
            tool_pipeline: None,
        }
    }

    pub fn with_tool_pipeline(mut self, pipeline: Arc<ToolExecutionPipeline>) -> Self {
        self.tool_pipeline = Some(pipeline);
        self
    }

    /// Create orchestrator with prompt builder configured
    pub fn with_prompt_builder(
        provider: Arc<dyn AgentProvider>,
        runtime: RuntimeSessionService,
        cancellations: Arc<RwLock<HashSet<String>>>,
        prompt_builder: PromptBuilder,
    ) -> Self {
        Self {
            provider,
            runtime: Arc::new(runtime),
            cancellations,
            prompt_builder,
            provider_selector: ProviderSelector::new(),
            default_config: ProviderConfig::default(),
            tool_pipeline: None,
        }
    }

    /// Create orchestrator with full configuration
    pub fn with_config(
        provider: Arc<dyn AgentProvider>,
        runtime: RuntimeSessionService,
        cancellations: Arc<RwLock<HashSet<String>>>,
        prompt_builder: PromptBuilder,
        provider_selector: ProviderSelector,
        config: ProviderConfig,
    ) -> Self {
        Self {
            provider,
            runtime: Arc::new(runtime),
            cancellations,
            prompt_builder,
            provider_selector,
            default_config: config,
            tool_pipeline: None,
        }
    }

    /// Get the prompt builder reference
    pub fn prompt_builder(&self) -> &PromptBuilder {
        &self.prompt_builder
    }

    /// Update the runtime context for prompt building
    pub fn with_runtime_context(mut self, context: RuntimeContext) -> Self {
        self.prompt_builder = self.prompt_builder.clone().with_user_context(context);
        self
    }

    pub async fn interrupt(&self, session_id: &str) -> bool {
        let mut cancellations = self.cancellations.write().await;
        cancellations.insert(session_id.to_string())
    }

    async fn clear_interrupt(&self, session_id: &str) {
        let mut cancellations = self.cancellations.write().await;
        cancellations.remove(session_id);
    }

    async fn is_interrupted(&self, session_id: &str) -> bool {
        let cancellations = self.cancellations.read().await;
        cancellations.contains(session_id)
    }

    pub async fn execute(
        &self,
        request: AgentExecutionRequest,
    ) -> AgentResult<AgentExecutionResponse> {
        self.execute_with_events(request, None).await
    }

    pub async fn execute_with_events(
        &self,
        request: AgentExecutionRequest,
        mut emitter: Option<&mut RuntimeEventEmitter>,
    ) -> AgentResult<AgentExecutionResponse> {
        self.clear_interrupt(&request.session_id).await;
        if self.is_interrupted(&request.session_id).await {
            return Err(AgentError::Interrupted);
        }

        let start_time = Utc::now().timestamp_millis();
        let trace_id = Uuid::new_v4().to_string();
        self.runtime
            .ensure_session(&request.session_id, &request.user_id)
            .await?;

        if let Some(event_emitter) = emitter.as_deref_mut() {
            event_emitter.session_start(Some(serde_json::json!({
                "userId": request.user_id,
                "traceId": trace_id,
            })));
        }

        let user_metadata = with_trace_metadata(request.metadata.clone(), &trace_id, "user");
        let user_message = self.runtime
            .append_message(
                &request.session_id,
                "user",
                Some(request.message.clone()),
                user_metadata,
            )
            .await?;

        if let Some(event_emitter) = emitter.as_deref_mut() {
            let payload = serde_json::json!({
                "role": "user",
                "content": request.message,
            });
            event_emitter.message_start(user_message.id.clone(), payload.clone());
            event_emitter.message_end(user_message.id.clone(), payload);
        }

        let history = self.runtime.list_messages(&request.session_id).await?;
        let mut messages = Vec::new();
        for message in history {
            if let Some(content) = message.content {
                messages.push(AgentMessage {
                    role: message.role,
                    content,
                    metadata: message.metadata,
                });
            }
        }

        let provider_response = match self
            .provider
            .complete(ProviderRequest {
                session_id: request.session_id.clone(),
                trace_id: trace_id.clone(),
                messages,
                metadata: None,
            })
            .await
        {
            Ok(response) => response,
            Err(err) => {
                if let Some(event_emitter) = emitter.as_deref_mut() {
                    event_emitter.error(serde_json::json!({
                        "code": "UNKNOWN_ERROR",
                        "message": err.to_string(),
                        "recoverable": false
                    }));
                    let duration = Utc::now().timestamp_millis() - start_time;
                    event_emitter.session_end(serde_json::json!({
                        "reason": "error",
                        "duration": duration,
                    }));
                }
                return Err(err);
            }
        };

        if self.is_interrupted(&request.session_id).await {
            return Ok(AgentExecutionResponse {
                session_id: request.session_id,
                trace_id,
                status: AgentExecutionStatus::Interrupted,
                content: None,
                error: Some("execution interrupted".to_string()),
            });
        }

        let assistant_metadata =
            with_trace_metadata(provider_response.metadata.clone(), &trace_id, "assistant");
        let assistant_message = self.runtime
            .append_message(
                &request.session_id,
                "assistant",
                Some(provider_response.content.clone()),
                assistant_metadata,
            )
            .await?;

        if let Some(event_emitter) = emitter.as_deref_mut() {
            let payload = serde_json::json!({
                "role": "assistant",
                "content": provider_response.content,
            });
            event_emitter.message_start(assistant_message.id.clone(), payload.clone());
            event_emitter.message_end(assistant_message.id.clone(), payload);
        }

        if let Some(event_emitter) = emitter.as_deref_mut() {
            let duration = Utc::now().timestamp_millis() - start_time;
            event_emitter.session_end(serde_json::json!({
                "reason": "completed",
                "duration": duration,
            }));
        }

        Ok(AgentExecutionResponse {
            session_id: request.session_id,
            trace_id,
            status: AgentExecutionStatus::Completed,
            content: Some(provider_response.content),
            error: None,
        })
    }

    /// Execute using the multi-turn AgentLoop.
    /// This uses StandardAgentLoop for multi-turn tool execution when tool_pipeline is available.
    /// Falls back to single-turn execution if tool_pipeline is not configured.
    pub async fn execute_with_loop(
        &self,
        request: AgentExecutionRequest,
        mode: LoopMode,
        max_turns: usize,
    ) -> AgentResult<AgentExecutionResponse> {
        self.clear_interrupt(&request.session_id).await;
        if self.is_interrupted(&request.session_id).await {
            return Err(AgentError::Interrupted);
        }

        let trace_id = Uuid::new_v4().to_string();

        // Get or create session
        self.runtime
            .ensure_session(&request.session_id, &request.user_id)
            .await?;

        // Build messages from history
        let history = self.runtime.list_messages(&request.session_id).await?;
        let mut messages = Vec::new();
        for msg in history {
            if let Some(content) = msg.content {
                messages.push(AgentMessage {
                    role: msg.role,
                    content,
                    metadata: msg.metadata,
                });
            }
        }

        // Append user message
        messages.push(AgentMessage {
            role: "user".to_string(),
            content: request.message.clone(),
            metadata: None,
        });

        // Build StandardAgentLoop
        let mut loop_instance = StandardAgentLoop::new(Arc::clone(&self.provider))
            .with_session_service(Arc::clone(&self.runtime));

        if let Some(ref pipeline) = self.tool_pipeline {
            loop_instance = loop_instance.with_tool_pipeline(Arc::clone(pipeline));
        }

        let loop_req = LoopRequest {
            session_id: request.session_id.clone(),
            trace_id: trace_id.clone(),
            messages,
            mode,
            max_turns,
            metadata: None,
        };

        // Execute the loop
        match loop_instance.run(loop_req).await {
            Ok(response) => {
                tracing::debug!(
                    "Agent loop completed: {} turns, {} chars",
                    response.total_turns,
                    response.content.len()
                );
                Ok(AgentExecutionResponse {
                    session_id: request.session_id,
                    trace_id,
                    status: AgentExecutionStatus::Completed,
                    content: Some(response.content),
                    error: None,
                })
            }
            Err(AgentError::Interrupted) => {
                Ok(AgentExecutionResponse {
                    session_id: request.session_id,
                    trace_id,
                    status: AgentExecutionStatus::Interrupted,
                    content: None,
                    error: Some("execution interrupted".to_string()),
                })
            }
            Err(e) => Err(e),
        }
    }
}

fn with_trace_metadata(
    metadata: Option<serde_json::Value>,
    trace_id: &str,
    role: &str,
) -> Option<serde_json::Value> {
    let mut base = metadata.unwrap_or_else(|| serde_json::json!({}));
    if let Some(map) = base.as_object_mut() {
        map.insert("trace_id".to_string(), serde_json::Value::String(trace_id.to_string()));
        map.insert("role".to_string(), serde_json::Value::String(role.to_string()));
        Some(base)
    } else {
        Some(serde_json::json!({
            "trace_id": trace_id,
            "role": role,
            "metadata": base
        }))
    }
}

// ==================== Prompt Builder Extension Methods ====================

impl AgentOrchestrator {
    /// Build a prompt using the configured PromptBuilder
    pub fn build_prompt(
        &self,
        user_message: &str,
        options: &PromptBuildOptions,
    ) -> BuiltPrompt {
        self.prompt_builder.build(user_message, options)
    }

    /// Build a prompt with runtime context injected
    pub fn build_prompt_with_context(
        &self,
        user_message: &str,
        runtime_context: RuntimeContext,
        options: &PromptBuildOptions,
    ) -> BuiltPrompt {
        self.prompt_builder
            .clone()
            .with_user_context(runtime_context)
            .build(user_message, options)
    }

    /// Execute with built prompt and tools
    pub async fn execute_with_prompt(
        &self,
        request: AgentExecutionRequest,
        built_prompt: BuiltPrompt,
        tools: Vec<ToolDescriptor>,
        emitter: Option<&mut RuntimeEventEmitter>,
    ) -> AgentResult<AgentExecutionResponse> {
        self.execute_with_events(
            AgentExecutionRequest {
                metadata: Some(serde_json::json!({
                    "built_prompt": built_prompt.system_prompt,
                    "tools_count": tools.len(),
                    "prompt_metadata": built_prompt.metadata,
                })),
                ..request
            },
            emitter,
        )
        .await
    }

    /// Select a provider by ID
    pub fn select_provider(&self, provider_id: &ProviderId) -> Option<Arc<dyn AgentProviderExt>> {
        self.provider_selector.select(provider_id)
    }

    /// Get the default provider configuration
    pub fn default_provider_config(&self) -> &ProviderConfig {
        &self.default_config
    }

    /// Update the default provider configuration
    pub fn set_provider_config(&mut self, config: ProviderConfig) {
        self.default_config = config;
    }

    /// Register a new provider
    pub fn register_provider(
        mut self,
        id: ProviderId,
        provider: Arc<dyn AgentProviderExt>,
    ) -> Self {
        self.provider_selector = self.provider_selector.register_provider(id, provider);
        self
    }

    /// Get available provider IDs
    pub fn available_providers(&self) -> Vec<ProviderId> {
        self.provider_selector.available_providers()
    }

    /// Build provider request from built prompt
    pub fn build_provider_request(
        &self,
        built_prompt: BuiltPrompt,
        messages: Vec<ProviderMessage>,
        config: ProviderConfig,
        tools: Option<Vec<ToolDescriptor>>,
    ) -> ProviderChatRequest {
        ProviderChatRequest {
            config,
            messages,
            tools,
            metadata: Some(serde_json::json!({
                "system_prompt": built_prompt.system_prompt,
                "prompt_metadata": built_prompt.metadata,
            })),
        }
    }

    /// Execute provider request with retry support
    pub async fn execute_provider_with_retry(
        &self,
        request: ProviderChatRequest,
        retry_policy: &RetryPolicy,
    ) -> AgentResult<ProviderChatResponse> {
        // Try extended provider first if available
        if let Some(extended) = self.provider_selector.default() {
            return extended.complete_with_retry(request, retry_policy).await;
        }

        // Fall back to basic provider
        let basic_request = ProviderRequest {
            session_id: "default".to_string(),
            trace_id: Uuid::new_v4().to_string(),
            messages: request.messages.iter().map(|m| AgentMessage {
                role: m.role.clone(),
                content: m.content.clone(),
                metadata: None,
            }).collect(),
            metadata: request.metadata,
        };

        let basic_response = self.provider.complete(basic_request).await?;

        Ok(ProviderChatResponse {
            content: basic_response.content,
            tool_calls: basic_response.tool_calls.map(|tc| {
                tc.as_array().map_or(Vec::new(), |arr| {
                    arr.iter().filter_map(|item| {
                        serde_json::from_value(item.clone()).ok()
                    }).collect()
                })
            }),
            metadata: basic_response.metadata.map(|_m| ProviderResponseMetadata {
                model: None,
                usage: None,
                finish_reason: None,
            }),
        })
    }

    /// Map provider error to user-friendly message
    pub fn map_provider_error(&self, error: &str) -> AgentError {
        self.prompt_builder.map_error(error)
    }
}
