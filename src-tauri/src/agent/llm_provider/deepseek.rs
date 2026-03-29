//! DeepSeek Provider Implementation
//!
//! Implementation of LlmProvider for DeepSeek API.

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

/// DeepSeek API endpoint
const DEEPSEEK_API_ENDPOINT: &str = "https://api.deepseek.com/chat/completions";

/// DeepSeek model identifiers
#[derive(Debug, Clone)]
pub enum DeepSeekModel {
    /// DeepSeek Chat model
    DeepSeekChat,
    /// DeepSeek Coder model
    DeepSeekCoder,
}

impl DeepSeekModel {
    pub fn as_str(&self) -> &'static str {
        match self {
            DeepSeekModel::DeepSeekChat => "deepseek-chat",
            DeepSeekModel::DeepSeekCoder => "deepseek-coder",
        }
    }
}

impl Default for DeepSeekModel {
    fn default() -> Self {
        DeepSeekModel::DeepSeekChat
    }
}

/// DeepSeek provider configuration
#[derive(Debug, Clone)]
pub struct DeepSeekConfig {
    /// API key for authentication
    api_key: String,
    /// API endpoint (can be overridden for proxy)
    api_endpoint: String,
    /// Default model to use
    model: DeepSeekModel,
    /// Request timeout in seconds
    timeout_secs: u64,
}

impl DeepSeekConfig {
    /// Create a new DeepSeekConfig with the given API key
    pub fn new(api_key: impl Into<String>) -> Self {
        Self {
            api_key: api_key.into(),
            api_endpoint: DEEPSEEK_API_ENDPOINT.to_string(),
            model: DeepSeekModel::default(),
            timeout_secs: 60,
        }
    }

    /// Set a custom API endpoint
    pub fn with_endpoint(mut self, endpoint: impl Into<String>) -> Self {
        self.api_endpoint = endpoint.into();
        self
    }

    /// Set the model
    pub fn with_model(mut self, model: DeepSeekModel) -> Self {
        self.model = model;
        self
    }

    /// Set timeout
    pub fn with_timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = secs;
        self
    }
}

/// DeepSeek Provider
#[derive(Debug, Clone)]
pub struct DeepSeekProvider {
    config: DeepSeekConfig,
    #[allow(dead_code)]
    http_client: Client,
}

impl DeepSeekProvider {
    /// Create a new DeepSeekProvider with the given API key
    pub fn new(api_key: impl Into<String>) -> Self {
        Self::with_config(DeepSeekConfig::new(api_key))
    }

    /// Create a new DeepSeekProvider with explicit configuration
    pub fn with_config(config: DeepSeekConfig) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");
        Self {
            config,
            http_client,
        }
    }

    /// Build the request body for DeepSeek API
    fn build_request_body(&self, request: &LlmRequest) -> DeepSeekRequestBody {
        let messages: Vec<DeepSeekMessage> = request
            .messages
            .iter()
            .map(|msg| DeepSeekMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect();

        let tools = request.tools.as_ref().map(|tools| {
            tools.iter()
                .map(|t| DeepSeekTool {
                    tool_type: "function".to_string(),
                    function: DeepSeekFunction {
                        name: t.name.clone(),
                        description: t.description.clone(),
                        parameters: t.parameters.clone(),
                    },
                })
                .collect()
        });

        DeepSeekRequestBody {
            model: self.config.model.as_str().to_string(),
            messages,
            stream: request.stream,
            tools,
            tool_choice: request.tools.as_ref().map(|_| "auto".to_string()),
        }
    }
}

#[async_trait]
impl LlmProvider for DeepSeekProvider {
    fn provider_id(&self) -> &str {
        "deepseek"
    }

    fn provider_name(&self) -> &str {
        "DeepSeek"
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
        let response = client
            .post(&self.config.api_endpoint)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
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

        let deepseek_response: DeepSeekResponse = response
            .json()
            .await
            .map_err(|e| LlmProviderError::ResponseParseError(e.to_string()))?;

        Ok(LlmResponse {
            content: deepseek_response.choices.first()
                .map(|c| c.message.content.clone())
                .unwrap_or_default(),
            tool_calls: deepseek_response.choices.first()
                .and_then(|c| c.message.tool_calls.clone())
                .map(|tc| tc.into_iter().map(|t| t.into()).collect()),
            usage: LlmTokenUsage {
                prompt_tokens: deepseek_response.usage.prompt_tokens,
                completion_tokens: deepseek_response.usage.completion_tokens,
                total_tokens: deepseek_response.usage.total_tokens,
            },
            metadata: None,
        })
    }

    async fn complete_stream(
        &self,
        request: LlmRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, LlmProviderError>> + Send>>, LlmProviderError> {
        let body = self.build_request_body(&request);
        let body = DeepSeekRequestBody {
            stream: true,
            ..body
        };

        let client = Client::new();
        let response = client
            .post(&self.config.api_endpoint)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
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
                            if let Ok(resp) = serde_json::from_str::<DeepSeekStreamResponse>(data) {
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
            "deepseek-chat".to_string(),
            "deepseek-coder".to_string(),
        ]
    }
}

// ============ DeepSeek API Types ============

#[derive(Debug, Serialize)]
struct DeepSeekRequestBody {
    model: String,
    messages: Vec<DeepSeekMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<DeepSeekTool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct DeepSeekMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct DeepSeekTool {
    #[serde(rename = "type")]
    tool_type: String,
    function: DeepSeekFunction,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct DeepSeekFunction {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct DeepSeekResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<DeepSeekChoice>,
    usage: DeepSeekUsage,
}

#[derive(Debug, Deserialize)]
struct DeepSeekChoice {
    index: u32,
    message: DeepSeekChoiceMessage,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeepSeekChoiceMessage {
    role: String,
    content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<DeepSeekToolCall>>,
}

#[derive(Debug, Deserialize, Clone)]
struct DeepSeekToolCall {
    id: String,
    #[serde(rename = "type")]
    tool_type: String,
    function: DeepSeekToolFunction,
}

#[derive(Debug, Deserialize, Clone)]
struct DeepSeekToolFunction {
    name: String,
    arguments: String,
}

#[derive(Debug, Deserialize)]
struct DeepSeekUsage {
    prompt_tokens: i32,
    completion_tokens: i32,
    total_tokens: i32,
}

// ============ SSE Streaming Types ============

#[derive(Debug, Deserialize)]
struct DeepSeekStreamResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<DeepSeekStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct DeepSeekStreamChoice {
    index: u32,
    delta: DeepSeekDelta,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeepSeekDelta {
    role: Option<String>,
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<DeepSeekToolCall>>,
}

// ============ Type Conversions ============

impl From<DeepSeekToolCall> for super::provider_trait::LlmToolCall {
    fn from(t: DeepSeekToolCall) -> Self {
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
    fn test_deepseek_config_default() {
        let config = DeepSeekConfig::new("test_api_key");
        assert_eq!(config.api_key, "test_api_key");
        assert_eq!(config.model.as_str(), "deepseek-chat");
    }

    #[test]
    fn test_deepseek_config_builder() {
        let config = DeepSeekConfig::new("test_key")
            .with_endpoint("https://custom.endpoint.com")
            .with_model(DeepSeekModel::DeepSeekCoder)
            .with_timeout(120);

        assert_eq!(config.api_key, "test_key");
        assert_eq!(config.api_endpoint, "https://custom.endpoint.com");
        assert_eq!(config.model.as_str(), "deepseek-coder");
        assert_eq!(config.timeout_secs, 120);
    }

    #[test]
    fn test_build_request_body() {
        let provider = DeepSeekProvider::new("test_key");
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
        assert_eq!(body.model, "deepseek-chat");
        assert_eq!(body.messages.len(), 1);
    }

    #[tokio::test]
    async fn test_deepseek_provider_creation() {
        let provider = DeepSeekProvider::new("test_key");
        assert_eq!(provider.provider_id(), "deepseek");
        assert_eq!(provider.provider_name(), "DeepSeek");
        assert!(provider.supports_streaming());
        assert!(provider.supports_tools());
    }
}
