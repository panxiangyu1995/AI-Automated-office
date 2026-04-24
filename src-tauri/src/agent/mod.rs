//! Agent runtime core module.

pub mod audit;
pub mod audit_types;
pub mod audit_siem;
pub mod builtin_agent;
pub mod config_cache;
pub mod context_compression;
pub mod correction;
pub mod delivery;
pub mod error_recovery;
pub mod failover;
pub mod resource_security;
pub mod events;
pub mod execution;
pub mod heartbeat;
pub mod intercom;
pub mod knowledge_retrieval;
pub mod dual_agent_provider;
pub mod llm_agent_provider;
pub mod lifecycle_hooks;
pub mod progress_tracking;
pub mod layered_memory;
pub mod memory;
pub mod execution_integration;
pub mod mock_provider;
pub mod skill;
pub mod monitoring;
pub mod monitoring_types;
pub mod config;
pub mod mode;
pub mod nested;
pub mod checkpoint;
pub mod permission;
pub mod result;
pub mod routing;
pub mod routing_types;
pub mod template;
pub mod agent_orchestrator;
pub mod provider;
pub mod llm_provider;
pub mod prompt_builder;
pub mod prompt_types;
pub mod runtime_session;
pub mod security;
pub mod security_types;
pub mod tools;
pub mod websocket;
pub mod message_sync;
pub mod context_compression_integration;
pub mod subagent;
pub mod router;
pub mod model_router;
pub mod pilot;
pub mod prompt_guardrails;

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::agent::dual_agent_provider::DualAgentProvider;
use crate::agent::llm_agent_provider::LlmAgentProvider;
use crate::agent::llm_provider::config::AgentMode;
use crate::agent::llm_provider::provider_manager::LlmProviderManager;
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
    #[error("provider creation failed: {0}")]
    ProviderCreation(String),
    #[error("configuration error: {0}")]
    Config(String),
    // 扩展错误类型 - Task 212 unwrap消除
    #[error("subagent not found: {0}")]
    SubagentNotFound(String),
    #[error("provider not available: {0}")]
    ProviderNotAvailable(String),
    #[error("routing error: {0}")]
    RoutingError(String),
    #[error("tool execution error: {0}")]
    ToolExecutionError(String),
    #[error("registry error: {0}")]
    RegistryError(String),
    #[error("lock error: {0}")]
    LockError(String),
    #[error("parse error: {0}")]
    ParseError(String),
    #[error("database error: {0}")]
    DatabaseError(String),
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

/// Configuration for initializing AgentRuntimeState with real LLM providers
#[derive(Debug, Clone)]
pub struct RuntimeConfig {
    /// Provider type: "zhipu", "deepseek", "minimax", "openai-compatible"
    pub provider_type: String,
    /// API key (will be encrypted for storage)
    pub api_key: String,
    /// Model to use
    pub model: String,
    /// API endpoint (for OpenAI compatible providers)
    pub api_endpoint: Option<String>,
    /// Tenant ID (for multi-tenant scenarios)
    pub tenant_id: Option<String>,
    /// User ID (for user-level config)
    pub user_id: Option<String>,
    /// Plan mode configuration (optional, for Plan/Act dual config)
    pub plan_mode_config: Option<PlanModeConfig>,
}

/// Configuration for Plan mode in dual config
#[derive(Debug, Clone)]
pub struct PlanModeConfig {
    pub provider_type: String,
    pub api_key: String,
    pub model: String,
    pub api_endpoint: Option<String>,
}

#[derive(Clone)]
pub struct AgentRuntimeState {
    /// Agent provider wrapped in RwLock for interior mutability
    provider: Arc<RwLock<Arc<dyn AgentProvider>>>,
    cancellations: Arc<RwLock<HashSet<String>>>,
    /// Provider configuration
    config: Arc<RwLock<Option<RuntimeConfig>>>,
    /// Agent messages storage for intercom
    messages: Arc<RwLock<HashMap<String, intercom::types::AgentMessage>>>,
    /// Execution contexts for builtin agent types (session_id -> context)
    /// pub(crate) so commands/agent.rs can access
    pub(crate) execution_contexts: Arc<RwLock<HashMap<String, execution_integration::AgentExecutionContext>>>,
}

/// Alias for backward compatibility
pub type AgentState = AgentRuntimeState;

impl AgentRuntimeState {
    /// Create AgentRuntimeState with MockProvider (default - for backward compatibility)
    pub fn new() -> Self {
        Self {
            provider: Arc::new(RwLock::new(Arc::new(mock_provider::MockProvider::new()))),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
            config: Arc::new(RwLock::new(None)),
            messages: Arc::new(RwLock::new(HashMap::new())),
            execution_contexts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create AgentRuntimeState with a real LLM provider from configuration
    pub async fn with_config(config: RuntimeConfig) -> Result<Self, AgentError> {
        let provider = Self::create_provider_from_config(&config).await?;

        Ok(Self {
            provider: Arc::new(RwLock::new(provider)),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
            config: Arc::new(RwLock::new(Some(config))),
            messages: Arc::new(RwLock::new(HashMap::new())),
            execution_contexts: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Create Agent Provider from configuration
    /// Uses DualAgentProvider for Plan/Act dual mode, or single LlmAgentProvider otherwise
    async fn create_provider_from_config(config: &RuntimeConfig) -> Result<Arc<dyn AgentProvider>, AgentError> {
        let act_llm = Self::create_llm_provider(
            &config.provider_type,
            &config.api_key,
            &config.model,
            config.api_endpoint.as_deref(),
        )?;

        let plan_llm = if let Some(plan_config) = &config.plan_mode_config {
            Some(Self::create_llm_provider(
                &plan_config.provider_type,
                &plan_config.api_key,
                &plan_config.model,
                plan_config.api_endpoint.as_deref(),
            )?)
        } else {
            None
        };

        if plan_llm.is_some() {
            Ok(Arc::new(DualAgentProvider::new(act_llm, plan_llm)))
        } else {
            Ok(Arc::new(LlmAgentProvider::new(act_llm)))
        }
    }

    /// Create an LLM provider from parameters
    fn create_llm_provider(
        provider_type: &str,
        api_key: &str,
        model: &str,
        api_endpoint: Option<&str>,
    ) -> Result<Arc<dyn crate::agent::llm_provider::LlmProvider>, AgentError> {
        match provider_type {
            "zhipu" => LlmProviderManager::create_zhipu_provider(api_key, model)
                .map_err(|e| AgentError::ProviderCreation(e.to_string())),
            "deepseek" => LlmProviderManager::create_deepseek_provider(api_key, model)
                .map_err(|e| AgentError::ProviderCreation(e.to_string())),
            "openai-compatible" | "openai" => {
                let endpoint = api_endpoint.unwrap_or("https://api.openai.com/v1/chat/completions");
                LlmProviderManager::create_openai_compatible_provider(endpoint, Some(api_key), model)
                    .map_err(|e| AgentError::ProviderCreation(e.to_string()))
            }
            "minimax" => {
                // Minimax requires group_id - use a default
                let config = crate::agent::llm_provider::MinimaxConfig::new(api_key.to_string(), "default");
                let provider = crate::agent::llm_provider::MinimaxProvider::with_config(config);
                Ok(Arc::new(provider))
            }
            _ => Err(AgentError::Config(format!(
                "Unknown provider type: {}. Supported: zhipu, deepseek, minimax, openai-compatible",
                provider_type
            ))),
        }
    }

    /// Create AgentRuntimeState with MockProvider (for testing)
    pub fn with_mock_provider() -> Self {
        Self {
            provider: Arc::new(RwLock::new(Arc::new(mock_provider::MockProvider::new()))),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
            config: Arc::new(RwLock::new(None)),
            messages: Arc::new(RwLock::new(HashMap::new())),
            execution_contexts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create AgentRuntimeState with MockProviderWithTools (for testing tool calls)
    pub fn with_mock_provider_with_tools() -> Self {
        Self {
            provider: Arc::new(RwLock::new(Arc::new(mock_provider::MockProviderWithTools::new()))),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
            config: Arc::new(RwLock::new(None)),
            messages: Arc::new(RwLock::new(HashMap::new())),
            execution_contexts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create AgentRuntimeState with a specific LLM provider (convenience method)
    pub async fn with_llm_provider(llm: Arc<dyn crate::agent::llm_provider::LlmProvider>) -> Self {
        let agent_provider = LlmAgentProvider::new(llm);
        Self {
            provider: Arc::new(RwLock::new(Arc::new(agent_provider))),
            cancellations: Arc::new(RwLock::new(HashSet::new())),
            config: Arc::new(RwLock::new(None)),
            messages: Arc::new(RwLock::new(HashMap::new())),
            execution_contexts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Set the agent provider (replaces current provider)
    /// Uses interior mutability via RwLock
    pub async fn set_provider(&self, provider: Arc<dyn AgentProvider>) {
        let mut guard = self.provider.write().await;
        *guard = provider;
    }

    /// Set the LLM provider directly (creates LlmAgentProvider wrapper)
    pub async fn set_llm_provider(&self, llm: Arc<dyn crate::agent::llm_provider::LlmProvider>) {
        let agent_provider = LlmAgentProvider::new(llm);
        self.set_provider(Arc::new(agent_provider)).await;
    }

    /// Update provider configuration and recreate provider
    pub async fn update_config(&self, config: RuntimeConfig) -> Result<(), AgentError> {
        let provider = Self::create_provider_from_config(&config).await?;
        self.set_provider(Arc::new(provider)).await;
        
        let mut config_guard = self.config.write().await;
        *config_guard = Some(config);
        
        Ok(())
    }

    pub fn provider(&self) -> Arc<dyn AgentProvider> {
        Arc::clone(&*self.provider.blocking_read())
    }

    /// Get the provider for async operations
    pub async fn get_provider(&self) -> Arc<dyn AgentProvider> {
        Arc::clone(&*self.provider.read().await)
    }

    /// Get current configuration
    pub async fn get_config(&self) -> Option<RuntimeConfig> {
        self.config.read().await.clone()
    }

    /// Check if a real provider is configured (not MockProvider)
    pub fn has_real_provider(&self) -> bool {
        self.config.blocking_read().is_some()
    }

    pub fn cancellations(&self) -> Arc<RwLock<HashSet<String>>> {
        Arc::clone(&self.cancellations)
    }

    pub async fn interrupt(&self, session_id: &str) -> bool {
        let mut cancellations = self.cancellations.write().await;
        cancellations.insert(session_id.to_string())
    }

    // =========================================================================
    // Agent Intercom Methods (FR59-FR68)
    // =========================================================================

    /// Get all messages for a specific agent
    pub fn get_agent_messages(&self, agent_id: &str) -> Vec<intercom::types::AgentMessage> {
        let messages = self.messages.blocking_read();
        messages.values()
            .filter(|m| m.receiver_id == agent_id || m.sender_id == agent_id)
            .cloned()
            .collect()
    }

    /// Update message status
    pub async fn update_message_status(
        &mut self,
        message_id: &str,
        status: intercom::types::MessageStatus,
    ) -> Result<(), intercom::types::AgentIntercomError> {
        let mut messages = self.messages.write().await;
        if let Some(msg) = messages.get_mut(message_id) {
            msg.status = status;
            Ok(())
        } else {
            Err(intercom::types::AgentIntercomError::MessageNotFound {
                message_id: message_id.to_string(),
            })
        }
    }

    /// Save an agent message
    pub async fn save_agent_message(
        &mut self,
        message: &intercom::types::AgentMessage,
    ) -> Result<(), intercom::types::AgentIntercomError> {
        let mut messages = self.messages.write().await;
        messages.insert(message.id.clone(), message.clone());
        Ok(())
    }

    /// Deliver an agent message (mark as delivered)
    pub async fn deliver_agent_message(
        &mut self,
        message: &intercom::types::AgentMessage,
    ) -> Result<(), intercom::types::AgentIntercomError> {
        let mut messages = self.messages.write().await;
        if let Some(msg) = messages.get_mut(&message.id) {
            msg.status = intercom::types::MessageStatus::Delivered;
            msg.delivered_at = Some(chrono::Utc::now());
            Ok(())
        } else {
            Err(intercom::types::AgentIntercomError::MessageNotFound {
                message_id: message.id.clone(),
            })
        }
    }
}
