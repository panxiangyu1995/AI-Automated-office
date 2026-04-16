//! Prompt builder type definitions
//!
//! Contains types, enums, and structs for prompt assembly and provider communication.

use serde::{Deserialize, Serialize};

/// Provider identifier for multi-provider support
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ProviderId {
    /// OpenAI compatible provider
    OpenAI,
    /// Zhipu AI provider
    Zhipu,
    /// Minimax provider
    Minimax,
    /// DeepSeek provider
    DeepSeek,
    /// Custom provider identifier
    Custom(String),
}

impl Default for ProviderId {
    fn default() -> Self {
        Self::OpenAI
    }
}

impl std::fmt::Display for ProviderId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProviderId::OpenAI => write!(f, "openai"),
            ProviderId::Zhipu => write!(f, "zhipu"),
            ProviderId::Minimax => write!(f, "minimax"),
            ProviderId::DeepSeek => write!(f, "deepseek"),
            ProviderId::Custom(name) => write!(f, "custom:{}", name),
        }
    }
}

/// Provider configuration for request execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    /// Provider identifier
    pub provider_id: ProviderId,
    /// API endpoint URL
    pub endpoint: Option<String>,
    /// API key for authentication
    pub api_key: Option<String>,
    /// Model name to use
    pub model: String,
    /// Request timeout in seconds
    pub timeout_secs: Option<u64>,
    /// Maximum retry attempts
    pub max_retries: Option<u32>,
    /// Base delay for exponential backoff (milliseconds)
    pub retry_base_delay_ms: Option<u64>,
    /// Additional provider-specific settings
    pub settings: Option<serde_json::Value>,
}

impl Default for ProviderConfig {
    fn default() -> Self {
        Self {
            provider_id: ProviderId::OpenAI,
            endpoint: None,
            api_key: None,
            model: "gpt-4".to_string(),
            timeout_secs: Some(60),
            max_retries: Some(3),
            retry_base_delay_ms: Some(1000),
            settings: None,
        }
    }
}

/// Tool descriptor for prompt injection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDescriptor {
    /// Tool unique identifier
    pub id: String,
    /// Tool name
    pub name: String,
    /// Tool description
    pub description: String,
    /// Parameter schema (JSON Schema format)
    pub parameters: serde_json::Value,
    /// Whether tool is sensitive/dangerous
    pub is_sensitive: bool,
    /// Tool category
    pub category: Option<String>,
}

impl ToolDescriptor {
    pub fn new(id: String, name: String, description: String) -> Self {
        Self {
            id,
            name,
            description,
            parameters: serde_json::json!({"type": "object", "properties": {}}),
            is_sensitive: false,
            category: None,
        }
    }
}

/// System prompt components for prompt assembly
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemPromptComponents {
    /// Base system prompt
    pub base: String,
    /// User context section
    pub user_context: Option<String>,
    /// Page/resource context section
    pub page_context: Option<String>,
    /// Tool definitions section
    pub tools_section: Option<String>,
    /// Safety and guidelines section
    pub safety_section: Option<String>,
    /// Custom sections
    pub custom_sections: Vec<CustomPromptSection>,
}

/// Custom prompt section
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomPromptSection {
    pub title: String,
    pub content: String,
    pub priority: i32,
}

/// Runtime context for prompt injection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeContext {
    /// Tenant identifier
    pub tenant_id: String,
    /// User identifier
    pub user_id: String,
    /// Session identifier
    pub session_id: String,
    /// User display name
    pub user_name: Option<String>,
    /// User primary role
    pub user_role: Option<String>,
    /// Department identifier
    pub department_id: Option<String>,
    /// Department name
    pub department_name: Option<String>,
    /// Enabled features for this user/tenant
    pub enabled_features: Vec<String>,
    /// Current page route
    pub current_route: Option<String>,
    /// Current page mode
    pub page_mode: Option<String>,
    /// Active resource identifiers
    pub active_resources: Vec<String>,
    /// Custom context data
    pub custom_data: Option<serde_json::Value>,
}

impl Default for RuntimeContext {
    fn default() -> Self {
        Self {
            tenant_id: "default".to_string(),
            user_id: "anonymous".to_string(),
            session_id: "default".to_string(),
            user_name: None,
            user_role: None,
            department_id: None,
            department_name: None,
            enabled_features: Vec::new(),
            current_route: None,
            page_mode: None,
            active_resources: Vec::new(),
            custom_data: None,
        }
    }
}

/// Tool visibility configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolVisibility {
    /// List of visible tool IDs
    pub visible_tools: Vec<String>,
    /// List of hidden tool IDs
    pub hidden_tools: Vec<String>,
    /// Tool categories to include
    pub include_categories: Vec<String>,
    /// Tool categories to exclude
    pub exclude_categories: Vec<String>,
    /// Whether to show all tools (no filtering)
    pub show_all: bool,
}

impl Default for ToolVisibility {
    fn default() -> Self {
        Self {
            visible_tools: Vec::new(),
            hidden_tools: Vec::new(),
            include_categories: Vec::new(),
            exclude_categories: Vec::new(),
            show_all: true,
        }
    }
}

impl ToolVisibility {
    /// Check if a tool should be visible
    pub fn is_visible(&self, tool: &ToolDescriptor) -> bool {
        if self.show_all && self.visible_tools.is_empty() && self.hidden_tools.is_empty() {
            return !self.exclude_categories.iter().any(|cat| {
                tool.category.as_ref().map_or(false, |c| c == cat)
            });
        }

        // Check if explicitly hidden
        if self.hidden_tools.contains(&tool.id) {
            return false;
        }

        // Check category exclusion
        if let Some(ref category) = tool.category {
            if self.exclude_categories.contains(category) {
                return false;
            }
        }

        // If visible_tools is not empty, tool must be in it
        if !self.visible_tools.is_empty() {
            return self.visible_tools.contains(&tool.id);
        }

        // Check category inclusion
        if !self.include_categories.is_empty() {
            return tool.category.as_ref().map_or(false, |c| {
                self.include_categories.contains(c)
            });
        }

        true
    }
}

/// Prompt build options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptBuildOptions {
    /// Include system prompt
    pub include_system: bool,
    /// Include runtime context
    pub include_context: bool,
    /// Include tool definitions
    pub include_tools: bool,
    /// Include conversation history
    pub include_history: bool,
    /// Maximum history messages to include
    pub max_history: Option<usize>,
    /// Tool visibility settings
    pub tool_visibility: Option<ToolVisibility>,
    /// Additional custom instructions
    pub custom_instructions: Option<String>,
}

impl Default for PromptBuildOptions {
    fn default() -> Self {
        Self {
            include_system: true,
            include_context: true,
            include_tools: true,
            include_history: true,
            max_history: Some(50),
            tool_visibility: None,
            custom_instructions: None,
        }
    }
}

/// Built prompt result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuiltPrompt {
    /// Final system prompt content
    pub system_prompt: String,
    /// User message that was passed through
    pub user_message: String,
    /// Tool calls included in the prompt (if any)
    pub tools: Vec<ToolDescriptor>,
    /// Metadata about the build process
    pub metadata: PromptBuildMetadata,
}

/// Metadata about the prompt build
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptBuildMetadata {
    /// Number of messages in history
    pub history_count: usize,
    /// Number of tools made visible
    pub visible_tool_count: usize,
    /// Whether context was included
    pub context_included: bool,
    /// Build timestamp
    pub built_at: i64,
}

/// Provider request with full context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderChatRequest {
    /// Provider configuration
    pub config: ProviderConfig,
    /// Model input messages
    pub messages: Vec<ProviderMessage>,
    /// Tools to make available (if any)
    pub tools: Option<Vec<ToolDescriptor>>,
    /// Request metadata
    pub metadata: Option<serde_json::Value>,
}

/// Provider message format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderMessage {
    /// Message role
    pub role: String,
    /// Message content
    pub content: String,
    /// Optional name for function calls
    pub name: Option<String>,
    /// Tool calls in this message
    pub tool_calls: Option<Vec<ProviderToolCall>>,
}

/// Provider tool call
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderToolCall {
    /// Tool call ID
    pub id: String,
    /// Function to call
    pub function: ProviderToolCallFunction,
}

/// Function call details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderToolCallFunction {
    /// Function name
    pub name: String,
    /// Arguments as JSON string
    pub arguments: String,
}

/// Provider response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderChatResponse {
    /// Response content
    pub content: String,
    /// Tool calls made by the model
    pub tool_calls: Option<Vec<ProviderToolCall>>,
    /// Response metadata
    pub metadata: Option<ProviderResponseMetadata>,
}

/// Provider response metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderResponseMetadata {
    /// Model that generated the response
    pub model: Option<String>,
    /// Token usage information
    pub usage: Option<ProviderTokenUsage>,
    /// Finish reason
    pub finish_reason: Option<String>,
}

/// Token usage from provider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderTokenUsage {
    /// Prompt tokens used
    pub prompt_tokens: Option<i32>,
    /// Completion tokens generated
    pub completion_tokens: Option<i32>,
    /// Total tokens
    pub total_tokens: Option<i32>,
}

/// Error mapping configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorMappingConfig {
    /// Map provider errors to user-friendly messages
    pub map_provider_errors: bool,
    /// Custom error mappings
    pub custom_mappings: Vec<ErrorMapping>,
}

/// Error mapping entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorMapping {
    /// Original error pattern (substring match)
    pub pattern: String,
    /// Mapped error code
    pub code: String,
    /// Mapped user message
    pub message: String,
    /// Whether this error is recoverable
    pub recoverable: bool,
}

impl Default for ErrorMappingConfig {
    fn default() -> Self {
        Self {
            map_provider_errors: true,
            custom_mappings: Vec::new(),
        }
    }
}
