//! OpenAI Compatible Provider Implementation
//!
//! Implementation of LlmProvider for OpenAI-compatible APIs.
//! Supports local deployments and custom API endpoints without authentication.

use async_trait::async_trait;
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::pin::Pin;
use tokio_stream::Stream;

use super::provider_trait::{
    LlmMessage, LlmProvider, LlmProviderError, LlmRequest, LlmResponse, LlmStreamChunk,
    LlmTokenUsage,
};

/// Default OpenAI-compatible API endpoint
const DEFAULT_OPENAI_ENDPOINT: &str = "https://api.openai.com/v1/chat/completions";

/// OpenAI-compatible model identifier
#[derive(Debug, Clone)]
pub struct OpenAICompatibleModel(pub String);

impl OpenAICompatibleModel {
    pub fn new(model: impl Into<String>) -> Self {
        Self(model.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Default for OpenAICompatibleModel {
    fn default() -> Self {
        Self("gpt-4".to_string())
    }
}

/// OpenAI-compatible provider configuration
#[derive(Debug, Clone)]
pub struct OpenAICompatibleConfig {
    /// API endpoint URL
    api_endpoint: String,
    /// API key (optional for local deployments)
    api_key: Option<String>,
    /// Default model to use
    model: OpenAICompatibleModel,
    /// Request timeout in seconds
    timeout_secs: u64,
    /// Whether to require API key
    require_auth: bool,
}

impl OpenAICompatibleConfig {
    /// Create a new config with the given endpoint
    pub fn new(endpoint: impl Into<String>) -> Self {
        Self {
            api_endpoint: endpoint.into(),
            api_key: None,
            model: OpenAICompatibleModel::default(),
            timeout_secs: 60,
            require_auth: false,
        }
    }

    /// Create a new config with default OpenAI endpoint
    pub fn default_openai(api_key: impl Into<String>) -> Self {
        Self {
            api_endpoint: DEFAULT_OPENAI_ENDPOINT.to_string(),
            api_key: Some(api_key.into()),
            model: OpenAICompatibleModel::default(),
            timeout_secs: 60,
            require_auth: true,
        }
    }

    /// Set API key
    pub fn with_api_key(mut self, api_key: impl Into<String>) -> Self {
        self.api_key = Some(api_key.into());
        self
    }

    /// Set the model
    pub fn with_model(mut self, model: OpenAICompatibleModel) -> Self {
        self.model = model;
        self
    }

    /// Set timeout
    pub fn with_timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = secs;
        self
    }

    /// Set whether to require authentication
    pub fn with_require_auth(mut self, require: bool) -> Self {
        self.require_auth = require;
        self
    }
}

/// OpenAI-compatible Provider
#[derive(Debug, Clone)]
pub struct OpenAICompatibleProvider {
    config: OpenAICompatibleConfig,
    #[allow(dead_code)]
    http_client: Client,
}

impl OpenAICompatibleProvider {
    /// Create a new provider with a custom endpoint
    pub fn new(endpoint: impl Into<String>) -> Self {
        Self::with_config(OpenAICompatibleConfig::new(endpoint))
    }

    /// Create a new provider with default OpenAI endpoint
    pub fn new_openai(api_key: impl Into<String>) -> Self {
        Self::with_config(OpenAICompatibleConfig::default_openai(api_key))
    }

    /// Create a new provider with explicit configuration
    pub fn with_config(config: OpenAICompatibleConfig) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");
        Self {
            config,
            http_client,
        }
    }

    /// Build the request body
    fn build_request_body(&self, request: &LlmRequest) -> OpenAIRequestBody {
        let messages: Vec<OpenAIMessage> = request
            .messages
            .iter()
            .map(|msg| OpenAIMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect();

        let tools = request.tools.as_ref().map(|tools| {
            tools.iter()
                .map(|t| OpenAITool {
                    tool_type: "function".to_string(),
                    function: OpenAIFunction {
                        name: t.name.clone(),
                        description: t.description.clone(),
                        parameters: t.parameters.clone(),
                    },
                })
                .collect()
        });

        OpenAIRequestBody {
            model: self.config.model.as_str().to_string(),
            messages,
            stream: request.stream,
            tools,
            tool_choice: request.tools.as_ref().map(|_| "auto".to_string()),
        }
    }
}

#[async_trait]
impl LlmProvider for OpenAICompatibleProvider {
    fn provider_id(&self) -> &str {
        "openai_compatible"
    }

    fn provider_name(&self) -> &str {
        "OpenAI Compatible"
    }

    async fn health_check(&self) -> Result<bool, LlmProviderError> {
        let request = LlmRequest {
            session_id: "health_check".to_string(),
            trace_id: uuid::Uuid::new_v4().to_string(),
            messages: vec![LlmMessage {
                role: "user".to_string(),
                content: "Hi".to_string(),
                tool_calls: None,
            }],
            tools: None,
            stream: false,
            metadata: None,
        };

        match self.complete(request).await {
            Ok(_) => Ok(true),
            Err(e) => Err(e),
        }
    }

    async fn complete(&self, request: LlmRequest) -> Result<LlmResponse, LlmProviderError> {
        let body = self.build_request_body(&request);

        let client = Client::new();
        let mut req_builder = client
            .post(&self.config.api_endpoint)
            .header("Content-Type", "application/json");

        // Add auth header if API key is provided
        if let Some(api_key) = &self.config.api_key {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = req_builder
            .json(&body)
            .send()
            .await
            .map_err(|e| LlmProviderError::RequestFailed(e.to_string()))?;

        let status = response.status();
        if !status.is_success() {
            let error_body = response.text().await.unwrap_or_default();
            return Err(match status.as_u16() {
                401 | 403 => LlmProviderError::AuthFailed(error_body),
                429 => LlmProviderError::RateLimitExceeded(error_body),
                _ => LlmProviderError::RequestFailed(format!(
                    "HTTP {}: {}",
                    status.as_u16(),
                    error_body
                )),
            });
        }

        let openai_response: OpenAIResponse = response
            .json()
            .await
            .map_err(|e| LlmProviderError::ResponseParseError(e.to_string()))?;

        Ok(LlmResponse {
            content: openai_response.choices.first()
                .map(|c| c.message.content.clone())
                .unwrap_or_default(),
            tool_calls: openai_response.choices.first()
                .and_then(|c| c.message.tool_calls.clone())
                .map(|tc| tc.into_iter().map(|t| t.into()).collect()),
            usage: LlmTokenUsage {
                prompt_tokens: openai_response.usage.prompt_tokens,
                completion_tokens: openai_response.usage.completion_tokens,
                total_tokens: openai_response.usage.total_tokens,
            },
            metadata: None,
        })
    }

    async fn complete_stream(
        &self,
        request: LlmRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, LlmProviderError>> + Send>>, LlmProviderError> {
        let body = self.build_request_body(&request);
        let body = OpenAIRequestBody {
            stream: true,
            ..body
        };

        let client = Client::new();
        let mut req_builder = client
            .post(&self.config.api_endpoint)
            .header("Content-Type", "application/json");

        if let Some(api_key) = &self.config.api_key {
            req_builder = req_builder.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = req_builder
            .json(&body)
            .send()
            .await
            .map_err(|e| LlmProviderError::RequestFailed(e.to_string()))?;

        let status = response.status();
        if !status.is_success() {
            let error_body = response.text().await.unwrap_or_default();
            return Err(match status.as_u16() {
                401 | 403 => LlmProviderError::AuthFailed(error_body),
                429 => LlmProviderError::RateLimitExceeded(error_body),
                _ => LlmProviderError::RequestFailed(format!(
                    "HTTP {}: {}",
                    status.as_u16(),
                    error_body
                )),
            });
        }

        let stream = response.bytes_stream();
        let stream = stream.map(|result| {
            match result {
                Ok(bytes) => {
                    let chunk_str = String::from_utf8_lossy(&bytes).to_string();
                    for line in chunk_str.lines() {
                        if line.starts_with("data: ") {
                            let data = &line[6..];
                            if data == "[DONE]" {
                                return Ok(LlmStreamChunk {
                                    content: String::new(),
                                    is_final: true,
                                    usage: None,
                                });
                            }
                            if let Ok(resp) = serde_json::from_str::<OpenAIStreamResponse>(data) {
                                let content = resp.choices.first()
                                    .and_then(|c| c.delta.content.clone())
                                    .unwrap_or_default();
                                let is_final = resp.choices.first()
                                    .and_then(|c| c.finish_reason.clone())
                                    .is_some();

                                return Ok(LlmStreamChunk {
                                    content,
                                    is_final,
                                    usage: None,
                                });
                            }
                        }
                    }
                    Err(LlmProviderError::ResponseParseError("Invalid SSE data".to_string()))
                }
                Err(_) => Err(LlmProviderError::StreamInterrupted),
            }
        });

        Ok(Box::pin(stream))
    }

    fn supports_streaming(&self) -> bool {
        true
    }

    fn supports_tools(&self) -> bool {
        true
    }

    fn supported_models(&self) -> Vec<String> {
        vec![
            "gpt-4".to_string(),
            "gpt-3.5-turbo".to_string(),
            "gpt-4-turbo".to_string(),
        ]
    }
}

// ============ OpenAI-compatible API Types ============

#[derive(Debug, Serialize)]
struct OpenAIRequestBody {
    model: String,
    messages: Vec<OpenAIMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<OpenAITool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct OpenAITool {
    #[serde(rename = "type")]
    tool_type: String,
    function: OpenAIFunction,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct OpenAIFunction {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<OpenAIChoice>,
    usage: OpenAIUsage,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    index: u32,
    message: OpenAIChoiceMessage,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoiceMessage {
    role: String,
    content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<OpenAIToolCall>>,
}

#[derive(Debug, Deserialize, Clone)]
struct OpenAIToolCall {
    id: String,
    #[serde(rename = "type")]
    tool_type: String,
    function: OpenAIToolFunction,
}

#[derive(Debug, Deserialize, Clone)]
struct OpenAIToolFunction {
    name: String,
    arguments: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIUsage {
    prompt_tokens: i32,
    completion_tokens: i32,
    total_tokens: i32,
}

// ============ SSE Streaming Types ============

#[derive(Debug, Deserialize)]
struct OpenAIStreamResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<OpenAIStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAIStreamChoice {
    index: u32,
    delta: OpenAIDelta,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAIDelta {
    role: Option<String>,
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<OpenAIToolCall>>,
}

// ============ Type Conversions ============

impl From<OpenAIToolCall> for super::provider_trait::LlmToolCall {
    fn from(t: OpenAIToolCall) -> Self {
        super::provider_trait::LlmToolCall {
            id: t.id,
            function: super::provider_trait::LlmToolFunction {
                name: t.function.name,
                arguments: t.function.arguments,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_with_endpoint() {
        let config = OpenAICompatibleConfig::new("http://localhost:8080/v1/chat/completions");
        assert_eq!(config.api_endpoint, "http://localhost:8080/v1/chat/completions");
        assert!(!config.require_auth);
    }

    #[test]
    fn test_config_with_api_key() {
        let config = OpenAICompatibleConfig::default_openai("sk-test");
        assert_eq!(config.api_endpoint, DEFAULT_OPENAI_ENDPOINT);
        assert!(config.require_auth);
        assert_eq!(config.api_key.as_ref().unwrap(), "sk-test");
    }

    #[test]
    fn test_config_builder() {
        let config = OpenAICompatibleConfig::new("http://localhost:11434/v1/chat/completions")
            .with_api_key("test-key")
            .with_model(OpenAICompatibleModel::new("llama2"))
            .with_timeout(120);

        assert!(config.require_auth);
        assert_eq!(config.model.as_str(), "llama2");
        assert_eq!(config.timeout_secs, 120);
    }

    #[test]
    fn test_build_request_body() {
        let provider = OpenAICompatibleProvider::new("http://localhost:8080");
        let request = LlmRequest {
            session_id: "session_1".to_string(),
            trace_id: "trace_1".to_string(),
            messages: vec![
                LlmMessage {
                    role: "user".to_string(),
                    content: "Hello!".to_string(),
                    tool_calls: None,
                },
            ],
            tools: None,
            stream: false,
            metadata: None,
        };

        let body = provider.build_request_body(&request);
        assert_eq!(body.model, "gpt-4");
        assert_eq!(body.messages.len(), 1);
    }

    #[tokio::test]
    async fn test_provider_creation() {
        let provider = OpenAICompatibleProvider::new("http://localhost:8080");
        assert_eq!(provider.provider_id(), "openai_compatible");
        assert_eq!(provider.provider_name(), "OpenAI Compatible");
        assert!(provider.supports_streaming());
        assert!(provider.supports_tools());
    }

    #[tokio::test]
    async fn test_local_deployment_no_auth() {
        // Test that provider works without API key (local deployment)
        let provider = OpenAICompatibleProvider::new("http://localhost:11434/v1/chat/completions");
        assert_eq!(provider.provider_id(), "openai_compatible");
        // No API key should be fine for local deployments
        assert!(provider.config.api_key.is_none());
    }
}
