//! LLM Provider Trait Definition
//!
//! This module defines the core LlmProvider trait and associated types
//! for interacting with various LLM backends (Zhipu, DeepSeek, Minimax, etc.)

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::pin::Pin;
use tokio_stream::Stream;

// ============ Request/Response Types ============

/// LLM completion request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmRequest {
    /// Session identifier for tracking
    pub session_id: String,
    /// Trace identifier for debugging
    pub trace_id: String,
    /// List of messages in the conversation
    pub messages: Vec<LlmMessage>,
    /// Optional tool descriptors for function calling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<LlmToolDescriptor>>,
    /// Whether to stream the response
    pub stream: bool,
    /// Optional metadata for additional context
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// A single message in the conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmMessage {
    /// Message role: "system", "user", or "assistant"
    pub role: String,
    /// Message content
    pub content: String,
    /// Optional tool calls made by the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<LlmToolCall>>,
}

/// A tool call made by the model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmToolCall {
    /// Unique identifier for this tool call
    pub id: String,
    /// The function to call
    pub function: LlmToolFunction,
}

/// The function to call
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmToolFunction {
    /// Function name
    pub name: String,
    /// Function arguments as JSON string
    pub arguments: String,
}

/// Tool descriptor for the model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmToolDescriptor {
    /// Tool unique identifier
    pub id: String,
    /// Tool name
    pub name: String,
    /// Tool description
    pub description: String,
    /// JSON Schema for tool parameters
    pub parameters: serde_json::Value,
}

/// LLM completion response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmResponse {
    /// Response content
    pub content: String,
    /// Optional tool calls made by the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<LlmToolCall>>,
    /// Token usage information
    pub usage: LlmTokenUsage,
    /// Optional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Token usage information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmTokenUsage {
    /// Tokens used in the prompt
    pub prompt_tokens: i32,
    /// Tokens generated in the completion
    pub completion_tokens: i32,
    /// Total tokens used
    pub total_tokens: i32,
}

/// A chunk in a streaming response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmStreamChunk {
    /// Content of this chunk
    pub content: String,
    /// Whether this is the final chunk
    pub is_final: bool,
    /// Token usage (only in final chunk)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage: Option<LlmTokenUsage>,
}

// ============ Provider Trait ============

/// Trait for LLM providers
///
/// All LLM providers (Zhipu, DeepSeek, Minimax, OpenAI compatible, etc.)
/// must implement this trait.
#[async_trait]
pub trait LlmProvider: Send + Sync {
    /// Get the provider identifier
    fn provider_id(&self) -> &str;

    /// Get the provider display name
    fn provider_name(&self) -> &str;

    /// Check if the provider is healthy and accessible
    async fn health_check(&self) -> Result<bool, LlmProviderError>;

    /// Make a synchronous completion request
    async fn complete(&self, request: LlmRequest) -> Result<LlmResponse, LlmProviderError>;

    /// Make a streaming completion request
    async fn complete_stream(
        &self,
        request: LlmRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, LlmProviderError>> + Send>>, LlmProviderError>;

    /// Whether this provider supports streaming
    fn supports_streaming(&self) -> bool {
        true
    }

    /// Whether this provider supports tool calling
    fn supports_tools(&self) -> bool {
        true
    }

    /// List of models supported by this provider
    fn supported_models(&self) -> Vec<String>;
}

// ============ Provider Error ============

/// Errors that can occur when using an LLM provider
#[derive(Debug, thiserror::Error)]
pub enum LlmProviderError {
    /// API key is not configured
    #[error("API key not configured")]
    ApiKeyNotConfigured,

    /// API request failed
    #[error("API request failed: {0}")]
    RequestFailed(String),

    /// Failed to parse API response
    #[error("API response parse error: {0}")]
    ResponseParseError(String),

    /// Authentication failed
    #[error("Authentication failed: {0}")]
    AuthFailed(String),

    /// Rate limit exceeded
    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),

    /// Token quota exceeded
    #[error("Token quota exceeded")]
    QuotaExceeded,

    /// Context length exceeded
    #[error("Context length exceeded")]
    ContextLengthExceeded,

    /// Provider is unavailable
    #[error("Provider unavailable: {0}")]
    ProviderUnavailable(String),

    /// Request timed out
    #[error("Timeout after {0}ms")]
    Timeout(u64),

    /// Stream was interrupted
    #[error("Stream interrupted")]
    StreamInterrupted,

    /// Invalid configuration
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_usage_serialization() {
        let usage = LlmTokenUsage {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        };
        let json = serde_json::to_string(&usage).unwrap();
        assert!(json.contains("prompt_tokens"));
        assert!(json.contains("30"));
    }

    #[test]
    fn test_stream_chunk_serialization() {
        let chunk = LlmStreamChunk {
            content: "Hello".to_string(),
            is_final: false,
            usage: None,
        };
        let json = serde_json::to_string(&chunk).unwrap();
        assert!(json.contains("Hello"));
        assert!(json.contains("is_final"));
    }

    #[test]
    fn test_provider_error_display() {
        let err = LlmProviderError::ApiKeyNotConfigured;
        assert_eq!(err.to_string(), "API key not configured");

        let err = LlmProviderError::Timeout(5000);
        assert_eq!(err.to_string(), "Timeout after 5000ms");
    }
}
