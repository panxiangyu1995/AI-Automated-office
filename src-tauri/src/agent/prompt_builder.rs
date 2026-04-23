//! Prompt Builder and Provider Request Path
//!
//! This module implements the prompt assembly and provider request path for the Agent runtime.
//! It provides:
//! - PromptBuilder for constructing prompts with system context, runtime context, and tool visibility
//! - Provider traits with timeout, retry, and error mapping support
//! - Request/Response contracts for provider communication


// Re-export all types from prompt_types for backward compatibility
pub use crate::agent::prompt_types::{
    ProviderId, ProviderConfig, ToolDescriptor, SystemPromptComponents,
    CustomPromptSection, RuntimeContext, PromptBuildOptions,
    BuiltPrompt, PromptBuildMetadata, ProviderChatRequest, ProviderMessage, ProviderChatResponse,
    ProviderResponseMetadata, ErrorMappingConfig,
};

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

use super::{AgentError, AgentResult};

/// Prompt builder for constructing prompts
#[derive(Clone)]
pub struct PromptBuilder {
    system_components: SystemPromptComponents,
    runtime_context: RuntimeContext,
    error_mapping: ErrorMappingConfig,
}

impl PromptBuilder {
    /// Create a new PromptBuilder with default components
    pub fn new() -> Self {
        Self {
            system_components: SystemPromptComponents {
                base: Self::default_base_prompt(),
                user_context: None,
                page_context: None,
                tools_section: None,
                safety_section: None,
                custom_sections: Vec::new(),
            },
            runtime_context: RuntimeContext::default(),
            error_mapping: ErrorMappingConfig::default(),
        }
    }

    /// Set the base system prompt
    pub fn with_base_prompt(mut self, base: String) -> Self {
        self.system_components.base = base;
        self
    }

    /// Set user context
    pub fn with_user_context(mut self, context: RuntimeContext) -> Self {
        self.runtime_context = context;
        self
    }

    /// Set user context section specifically
    pub fn with_user_context_section(mut self, section: String) -> Self {
        self.system_components.user_context = Some(section);
        self
    }

    /// Set page context section
    pub fn with_page_context_section(mut self, section: String) -> Self {
        self.system_components.page_context = Some(section);
        self
    }

    /// Set tools section
    pub fn with_tools_section(mut self, section: String) -> Self {
        self.system_components.tools_section = Some(section);
        self
    }

    /// Set safety section
    pub fn with_safety_section(mut self, section: String) -> Self {
        self.system_components.safety_section = Some(section);
        self
    }

    /// Add a custom section
    pub fn add_custom_section(mut self, title: String, content: String, priority: i32) -> Self {
        self.system_components.custom_sections.push(CustomPromptSection {
            title,
            content,
            priority,
        });
        self
    }

    /// Set error mapping configuration
    pub fn with_error_mapping(mut self, config: ErrorMappingConfig) -> Self {
        self.error_mapping = config;
        self
    }

    /// Build the system prompt
    pub fn build_system_prompt(&self) -> String {
        let mut parts = Vec::new();

        // Base prompt
        parts.push(self.system_components.base.clone());

        // User context
        if let Some(ref user_ctx) = self.system_components.user_context {
            parts.push(format!("\n\n## User Context\n{}", user_ctx));
        } else if self.runtime_context.user_id != "anonymous" {
            parts.push(self.build_user_context_section());
        }

        // Page context
        if let Some(ref page_ctx) = self.system_components.page_context {
            parts.push(format!("\n\n## Current Page Context\n{}", page_ctx));
        } else if self.runtime_context.current_route.is_some() {
            parts.push(self.build_page_context_section());
        }

        // Tool definitions
        // Note: Tools are handled separately in the request to provider

        // Safety section
        if let Some(ref safety) = self.system_components.safety_section {
            parts.push(format!("\n\n## Safety Guidelines\n{}", safety));
        }

        // Custom sections (sorted by priority)
        let mut custom = self.system_components.custom_sections.clone();
        custom.sort_by_key(|s| s.priority);
        for section in custom {
            parts.push(format!("\n\n## {}\n{}", section.title, section.content));
        }

        parts.join("\n")
    }

    /// Build user context section
    fn build_user_context_section(&self) -> String {
        let mut ctx = Vec::new();
        ctx.push(format!("User ID: {}", self.runtime_context.user_id));
        if let Some(ref name) = self.runtime_context.user_name {
            ctx.push(format!("Name: {}", name));
        }
        if let Some(ref role) = self.runtime_context.user_role {
            ctx.push(format!("Role: {}", role));
        }
        if let Some(ref dept_id) = self.runtime_context.department_id {
            ctx.push(format!("Department ID: {}", dept_id));
        }
        if let Some(ref dept_name) = self.runtime_context.department_name {
            ctx.push(format!("Department: {}", dept_name));
        }
        if !self.runtime_context.enabled_features.is_empty() {
            ctx.push(format!(
                "Enabled Features: {}",
                self.runtime_context.enabled_features.join(", ")
            ));
        }
        format!("## User Context\n{}", ctx.join("\n"))
    }

    /// Build page context section
    fn build_page_context_section(&self) -> String {
        let mut ctx = Vec::new();
        if let Some(ref route) = self.runtime_context.current_route {
            ctx.push(format!("Route: {}", route));
        }
        if let Some(ref mode) = self.runtime_context.page_mode {
            ctx.push(format!("Page Mode: {}", mode));
        }
        if !self.runtime_context.active_resources.is_empty() {
            ctx.push(format!(
                "Active Resources: {}",
                self.runtime_context.active_resources.join(", ")
            ));
        }
        format!("## Current Page Context\n{}", ctx.join("\n"))
    }

    /// Build a complete prompt with options
    pub fn build(&self, user_message: &str, options: &PromptBuildOptions) -> BuiltPrompt {
        let now = chrono::Utc::now().timestamp_millis();
        let system_prompt = self.build_system_prompt();

        // Apply tool visibility filtering
        let tools: Vec<ToolDescriptor> = if options.include_tools {
            if options.tool_visibility.is_some() {
                // Return empty - actual tool filtering happens in provider request
                Vec::new()
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        };

        let visible_tool_count = tools.len();

        BuiltPrompt {
            system_prompt,
            user_message: user_message.to_string(),
            tools,
            metadata: PromptBuildMetadata {
                history_count: 0, // Set by caller
                visible_tool_count,
                context_included: self.runtime_context.user_id != "anonymous",
                built_at: now,
            },
        }
    }

    /// Map provider error to runtime error
    pub fn map_error(&self, provider_error: &str) -> AgentError {
        // Check custom mappings first
        for mapping in &self.error_mapping.custom_mappings {
            if provider_error.contains(&mapping.pattern) {
                return AgentError::Execution(mapping.message.clone());
            }
        }

        // Default mappings
        let error_lower = provider_error.to_lowercase();
        if error_lower.contains("timeout") {
            AgentError::Execution("Request timed out. Please try again.".to_string())
        } else if error_lower.contains("rate limit") || error_lower.contains("429") {
            AgentError::Execution("Rate limit exceeded. Please wait and try again.".to_string())
        } else if error_lower.contains("unauthorized") || error_lower.contains("401") {
            AgentError::Execution("Authentication failed. Please check your API key.".to_string())
        } else if error_lower.contains("invalid request") || error_lower.contains("400") {
            AgentError::Execution("Invalid request. Please check your input.".to_string())
        } else if error_lower.contains("context length") || error_lower.contains("token limit") {
            AgentError::Execution("Conversation is too long. Please start a new session.".to_string())
        } else {
            AgentError::Execution(provider_error.to_string())
        }
    }

    /// Default base prompt
    fn default_base_prompt() -> String {
        r#"You are an AI assistant for an enterprise ERP system called AI-Automated-office.

Your role is to help users accomplish tasks efficiently and safely within their organization's workflow.

## Core Principles
1. **Helpfulness**: Provide accurate, actionable assistance to users
2. **Transparency**: Be clear about what you can and cannot do
3. **Safety**: Never perform actions that could harm data or systems
4. **Privacy**: Respect user data and organizational boundaries

## Communication Style
- Be concise and professional
- Use clear, structured responses
- Ask clarifying questions when needed
- Confirm important actions before execution

## Capabilities
- Answer questions about the system and workflows
- Help navigate and use ERP features
- Assist with data entry and document creation
- Coordinate across different departments

## Limitations
- Cannot access external websites without explicit user request
- Cannot modify system configurations without proper permissions
- Cannot share data across different tenants/organizations"#
            .to_string()
    }
}

impl Default for PromptBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Retry policy for provider requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryPolicy {
    /// Maximum number of retry attempts
    pub max_attempts: u32,
    /// Base delay in milliseconds
    pub base_delay_ms: u64,
    /// Maximum delay cap in milliseconds
    pub max_delay_ms: u64,
    /// Multiplier for exponential backoff
    pub backoff_multiplier: f64,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            base_delay_ms: 1000,
            max_delay_ms: 30000,
            backoff_multiplier: 2.0,
        }
    }
}

impl RetryPolicy {
    /// Calculate delay for a given attempt number
    pub fn calculate_delay(&self, attempt: u32) -> Duration {
        let delay = self.base_delay_ms as f64 * self.backoff_multiplier.powi(attempt as i32 - 1);
        let delay = delay.min(self.max_delay_ms as f64);
        Duration::from_millis(delay as u64)
    }

    /// Check if should retry based on error
    pub fn should_retry(&self, error: &AgentError, attempt: u32) -> bool {
        if attempt >= self.max_attempts {
            return false;
        }

        match error {
            // Retry on these errors
            AgentError::Execution(msg) => {
                let msg_lower = msg.to_lowercase();
                !msg_lower.contains("authentication")
                    && !msg_lower.contains("unauthorized")
                    && !msg_lower.contains("invalid request")
                    && !msg_lower.contains("context length")
            }
            // Don't retry on these
            AgentError::ProviderNotConfigured => false,
            AgentError::Interrupted => false,
            AgentError::Storage(_) => true, // Storage errors might be transient
            AgentError::ProviderCreation(_) => false, // Provider creation errors are not transient
            AgentError::Config(_) => false, // Config errors are not transient
            // Task 212: Additional error variants - don't retry
            AgentError::SubagentNotFound(_) => false,
            AgentError::ProviderNotAvailable(_) => false,
            AgentError::RoutingError(_) => false,
            AgentError::ToolExecutionError(_) => false,
            AgentError::RegistryError(_) => false,
            AgentError::LockError(_) => false,
            AgentError::ParseError(_) => false,
            AgentError::DatabaseError(_) => false,
        }
    }
}

/// Extended provider trait with timeout and retry support
#[async_trait]
pub trait AgentProviderExt: Send + Sync {
    /// Get the provider identifier
    fn provider_id(&self) -> ProviderId;

    /// Get provider configuration
    fn config(&self) -> ProviderConfig;

    /// Check if provider supports tools
    fn supports_tools(&self) -> bool {
        false
    }

    /// Complete a chat request with full context
    async fn complete_chat(
        &self,
        request: ProviderChatRequest,
    ) -> AgentResult<ProviderChatResponse>;

    /// Complete with automatic retry
    async fn complete_with_retry(
        &self,
        request: ProviderChatRequest,
        retry_policy: &RetryPolicy,
    ) -> AgentResult<ProviderChatResponse> {
        let mut attempt = 0;
        let mut last_error: AgentError = AgentError::Execution("No attempts made".to_string());

        loop {
            match self.complete_chat(request.clone()).await {
                Ok(response) => return Ok(response),
                Err(error) => {
                    if !retry_policy.should_retry(&error, attempt) {
                        return Err(error);
                    }
                    last_error = error;
                }
            }

            if attempt >= retry_policy.max_attempts {
                return Err(last_error);
            }

            let delay = retry_policy.calculate_delay(attempt);
            tokio::time::sleep(delay).await;
            attempt += 1;
        }
    }
}

/// Provider selector for multi-provider support
#[derive(Clone)]
pub struct ProviderSelector {
    providers: Arc<std::collections::HashMap<ProviderId, Arc<dyn AgentProviderExt>>>,
    default_provider: ProviderId,
}

impl ProviderSelector {
    /// Create a new provider selector
    pub fn new() -> Self {
        Self {
            providers: Arc::new(std::collections::HashMap::new()),
            default_provider: ProviderId::OpenAI,
        }
    }

    /// Register a provider
    pub fn register_provider(
        self,
        id: ProviderId,
        provider: Arc<dyn AgentProviderExt>,
    ) -> Self {
        let mut providers = (*self.providers).clone();
        providers.insert(id, provider);
        Self {
            providers: Arc::new(providers),
            ..self
        }
    }

    /// Set the default provider
    pub fn with_default(mut self, id: ProviderId) -> Self {
        self.default_provider = id;
        self
    }

    /// Select a provider by ID
    pub fn select(&self, id: &ProviderId) -> Option<Arc<dyn AgentProviderExt>> {
        self.providers.get(id).cloned()
    }

    /// Get the default provider
    pub fn default(&self) -> Option<Arc<dyn AgentProviderExt>> {
        self.select(&self.default_provider)
    }

    /// Get all registered provider IDs
    pub fn available_providers(&self) -> Vec<ProviderId> {
        self.providers.keys().cloned().collect()
    }
}

impl Default for ProviderSelector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_builder_default() {
        let builder = PromptBuilder::new();
        let prompt = builder.build_system_prompt();
        assert!(prompt.contains("AI-Automated-office"));
    }

    #[test]
    fn test_prompt_builder_with_context() {
        let builder = PromptBuilder::new()
            .with_user_context(RuntimeContext {
                user_id: "user123".to_string(),
                user_name: Some("Test User".to_string()),
                user_role: Some("admin".to_string()),
                department_name: Some("Engineering".to_string()),
                ..Default::default()
            });

        let prompt = builder.build_system_prompt();
        assert!(prompt.contains("user123"));
        assert!(prompt.contains("Test User"));
        assert!(prompt.contains("admin"));
    }

    #[test]
    fn test_tool_visibility_default() {
        let visibility = ToolVisibility::default();
        let tool = ToolDescriptor::new("tool1".to_string(), "test".to_string(), "A test tool".to_string());
        assert!(visibility.is_visible(&tool));
    }

    #[test]
    fn test_tool_visibility_filtering() {
        let visibility = ToolVisibility {
            visible_tools: vec!["tool1".to_string(), "tool2".to_string()],
            hidden_tools: vec!["tool3".to_string()],
            ..Default::default()
        };

        let tool1 = ToolDescriptor::new("tool1".to_string(), "test1".to_string(), "Test 1".to_string());
        let tool2 = ToolDescriptor::new("tool2".to_string(), "test2".to_string(), "Test 2".to_string());
        let tool3 = ToolDescriptor::new("tool3".to_string(), "test3".to_string(), "Test 3".to_string());
        let tool4 = ToolDescriptor::new("tool4".to_string(), "test4".to_string(), "Test 4".to_string());

        assert!(visibility.is_visible(&tool1));
        assert!(visibility.is_visible(&tool2));
        assert!(!visibility.is_visible(&tool3));
        assert!(!visibility.is_visible(&tool4)); // Not in visible list
    }

    #[test]
    fn test_retry_policy_delay() {
        let policy = RetryPolicy::default();
        assert_eq!(policy.calculate_delay(1), Duration::from_millis(1000));
        assert_eq!(policy.calculate_delay(2), Duration::from_millis(2000));
        assert_eq!(policy.calculate_delay(3), Duration::from_millis(4000));
    }

    #[test]
    fn test_provider_id_display() {
        assert_eq!(ProviderId::OpenAI.to_string(), "openai");
        assert_eq!(ProviderId::Zhipu.to_string(), "zhipu");
        assert_eq!(ProviderId::Custom("custom".to_string()).to_string(), "custom:custom");
    }
}
