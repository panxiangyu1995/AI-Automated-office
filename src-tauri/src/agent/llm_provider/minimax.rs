//! Minimax Provider Implementation
//!
//! Implementation of LlmProvider for Minimax API.

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

/// Minimax API endpoint (using Azure-compatible format)
const MINIMAX_API_ENDPOINT: &str = "https://api.minimax.chat/v1/chat/completions";

/// Minimax model identifiers
#[derive(Debug, Clone)]
pub enum MinimaxModel {
    /// ABAB Chat model
    AbabChat,
    /// ABAB Coder model
    AbabCoder,
}

impl MinimaxModel {
    pub fn as_str(&self) -> &'static str {
        match self {
            MinimaxModel::AbabChat => "abab6-chat",
            MinimaxModel::AbabCoder => "abab6.5s-chat",
        }
    }
}

impl Default for MinimaxModel {
    fn default() -> Self {
        MinimaxModel::AbabChat
    }
}

/// Minimax provider configuration
#[derive(Debug, Clone)]
pub struct MinimaxConfig {
    /// API key for authentication
    api_key: String,
    /// Group ID for Minimax
    group_id: String,
    /// API endpoint (can be overridden for proxy)
    api_endpoint: String,
    /// Default model to use
    model: MinimaxModel,
    /// Request timeout in seconds
    timeout_secs: u64,
}

impl MinimaxConfig {
    /// Create a new MinimaxConfig with the given API key and group ID
    pub fn new(api_key: impl Into<String>, group_id: impl Into<String>) -> Self {
        Self {
            api_key: api_key.into(),
            group_id: group_id.into(),
            api_endpoint: MINIMAX_API_ENDPOINT.to_string(),
            model: MinimaxModel::default(),
            timeout_secs: 60,
        }
    }

    /// Set a custom API endpoint
    pub fn with_endpoint(mut self, endpoint: impl Into<String>) -> Self {
        self.api_endpoint = endpoint.into();
        self
    }

    /// Set the model
    pub fn with_model(mut self, model: MinimaxModel) -> Self {
        self.model = model;
        self
    }

    /// Set timeout
    pub fn with_timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = secs;
        self
    }
}

/// Minimax Provider
#[derive(Debug, Clone)]
pub struct MinimaxProvider {
    config: MinimaxConfig,
    #[allow(dead_code)]
    http_client: Client,
}

impl MinimaxProvider {
    /// Create a new MinimaxProvider with the given API key and group ID
    pub fn new(api_key: impl Into<String>, group_id: impl Into<String>) -> Self {
        Self::with_config(MinimaxConfig::new(api_key, group_id))
    }

    /// Create a new MinimaxProvider with explicit configuration
    pub fn with_config(config: MinimaxConfig) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");
        Self {
            config,
            http_client,
        }
    }

    /// Build the request body for Minimax API
    fn build_request_body(&self, request: &LlmRequest) -> MinimaxRequestBody {
        let messages: Vec<MinimaxMessage> = request
            .messages
            .iter()
            .map(|msg| MinimaxMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect();

        let tools = request.tools.as_ref().map(|tools| {
            tools.iter()
                .map(|t| MinimaxTool {
                    tool_type: "function".to_string(),
                    function: MinimaxFunction {
                        name: t.name.clone(),
                        description: t.description.clone(),
                        parameters: t.parameters.clone(),
                    },
                })
                .collect()
        });

        MinimaxRequestBody {
            model: self.config.model.as_str().to_string(),
            messages,
            stream: request.stream,
            tools,
            tool_choice: request.tools.as_ref().map(|_| "auto".to_string()),
        }
    }
}

#[async_trait]
impl LlmProvider for MinimaxProvider {
    fn provider_id(&self) -> &str {
        "minimax"
    }

    fn provider_name(&self) -> &str {
        "Minimax"
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
            .header("GroupId", &self.config.group_id)
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

        let minimax_response: MinimaxResponse = response
            .json()
            .await
            .map_err(|e| LlmProviderError::ResponseParseError(e.to_string()))?;

        Ok(LlmResponse {
            content: minimax_response.choices.first()
                .map(|c| c.message.content.clone())
                .unwrap_or_default(),
            tool_calls: minimax_response.choices.first()
                .and_then(|c| c.message.tool_calls.clone())
                .map(|tc| tc.into_iter().map(|t| t.into()).collect()),
            usage: LlmTokenUsage {
                prompt_tokens: minimax_response.usage.prompt_tokens,
                completion_tokens: minimax_response.usage.completion_tokens,
                total_tokens: minimax_response.usage.total_tokens,
            },
            metadata: None,
        })
    }

    async fn complete_stream(
        &self,
        request: LlmRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, LlmProviderError>> + Send>>, LlmProviderError> {
        let body = self.build_request_body(&request);
        let body = MinimaxRequestBody {
            stream: true,
            ..body
        };

        let client = Client::new();
        let response = client
            .post(&self.config.api_endpoint)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .header("GroupId", &self.config.group_id)
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
                            if let Ok(resp) = serde_json::from_str::<MinimaxStreamResponse>(data) {
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
            "abab6-chat".to_string(),
            "abab6.5s-chat".to_string(),
        ]
    }
}

// ============ Minimax API Types ============

#[derive(Debug, Serialize)]
struct MinimaxRequestBody {
    model: String,
    messages: Vec<MinimaxMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<MinimaxTool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct MinimaxMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct MinimaxTool {
    #[serde(rename = "type")]
    tool_type: String,
    function: MinimaxFunction,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct MinimaxFunction {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct MinimaxResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<MinimaxChoice>,
    usage: MinimaxUsage,
}

#[derive(Debug, Deserialize)]
struct MinimaxChoice {
    index: u32,
    message: MinimaxChoiceMessage,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct MinimaxChoiceMessage {
    role: String,
    content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<MinimaxToolCall>>,
}

#[derive(Debug, Deserialize, Clone)]
struct MinimaxToolCall {
    id: String,
    #[serde(rename = "type")]
    tool_type: String,
    function: MinimaxToolFunction,
}

#[derive(Debug, Deserialize, Clone)]
struct MinimaxToolFunction {
    name: String,
    arguments: String,
}

#[derive(Debug, Deserialize)]
struct MinimaxUsage {
    prompt_tokens: i32,
    completion_tokens: i32,
    total_tokens: i32,
}

// ============ SSE Streaming Types ============

#[derive(Debug, Deserialize)]
struct MinimaxStreamResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<MinimaxStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct MinimaxStreamChoice {
    index: u32,
    delta: MinimaxDelta,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct MinimaxDelta {
    role: Option<String>,
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<MinimaxToolCall>>,
}

// ============ Type Conversions ============

impl From<MinimaxToolCall> for super::provider_trait::LlmToolCall {
    fn from(t: MinimaxToolCall) -> Self {
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
    fn test_minimax_config_default() {
        let config = MinimaxConfig::new("test_api_key", "test_group_id");
        assert_eq!(config.api_key, "test_api_key");
        assert_eq!(config.group_id, "test_group_id");
        assert_eq!(config.model.as_str(), "abab6-chat");
    }

    #[test]
    fn test_minimax_config_builder() {
        let config = MinimaxConfig::new("test_key", "test_group")
            .with_endpoint("https://custom.endpoint.com")
            .with_model(MinimaxModel::AbabCoder)
            .with_timeout(120);

        assert_eq!(config.api_key, "test_key");
        assert_eq!(config.group_id, "test_group");
        assert_eq!(config.api_endpoint, "https://custom.endpoint.com");
        assert_eq!(config.model.as_str(), "abab6.5s-chat");
        assert_eq!(config.timeout_secs, 120);
    }

    #[test]
    fn test_build_request_body() {
        let provider = MinimaxProvider::new("test_key", "test_group");
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
        assert_eq!(body.model, "abab6-chat");
        assert_eq!(body.messages.len(), 1);
    }

    #[tokio::test]
    async fn test_minimax_provider_creation() {
        let provider = MinimaxProvider::new("test_key", "test_group");
        assert_eq!(provider.provider_id(), "minimax");
        assert_eq!(provider.provider_name(), "Minimax");
        assert!(provider.supports_streaming());
        assert!(provider.supports_tools());
    }
}
