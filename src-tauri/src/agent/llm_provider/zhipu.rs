//! Zhipu AI Provider Implementation
//!
//! Implementation of LlmProvider for Zhipu AI (智谱AI) API.

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

/// Zhipu AI API endpoint
const ZHIPU_API_ENDPOINT: &str = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

/// Zhipu AI model identifiers
#[derive(Debug, Clone)]
pub enum ZhipuModel {
    /// GLM-4 model
    Glm4,
    /// GLM-4V vision model
    Glm4V,
    /// GLM-3 model
    Glm3,
}

impl ZhipuModel {
    pub fn as_str(&self) -> &'static str {
        match self {
            ZhipuModel::Glm4 => "glm-4",
            ZhipuModel::Glm4V => "glm-4v",
            ZhipuModel::Glm3 => "glm-3-turbo",
        }
    }
}

impl Default for ZhipuModel {
    fn default() -> Self {
        ZhipuModel::Glm4
    }
}

/// Zhipu provider configuration
#[derive(Debug, Clone)]
pub struct ZhipuConfig {
    /// API key for authentication
    api_key: String,
    /// API endpoint (can be overridden for proxy)
    api_endpoint: String,
    /// Default model to use
    model: ZhipuModel,
    /// Request timeout in seconds
    timeout_secs: u64,
}

impl ZhipuConfig {
    /// Create a new ZhipuConfig with the given API key
    pub fn new(api_key: impl Into<String>) -> Self {
        Self {
            api_key: api_key.into(),
            api_endpoint: ZHIPU_API_ENDPOINT.to_string(),
            model: ZhipuModel::default(),
            timeout_secs: 60,
        }
    }

    /// Set a custom API endpoint
    pub fn with_endpoint(mut self, endpoint: impl Into<String>) -> Self {
        self.api_endpoint = endpoint.into();
        self
    }

    /// Set the model
    pub fn with_model(mut self, model: ZhipuModel) -> Self {
        self.model = model;
        self
    }

    /// Set timeout
    pub fn with_timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = secs;
        self
    }
}

/// Zhipu AI Provider
#[derive(Debug, Clone)]
pub struct ZhipuProvider {
    config: ZhipuConfig,
    #[allow(dead_code)]
    http_client: Client,
}

impl ZhipuProvider {
    /// Create a new ZhipuProvider with the given API key
    pub fn new(api_key: impl Into<String>) -> Self {
        Self::with_config(ZhipuConfig::new(api_key))
    }

    /// Create a new ZhipuProvider with explicit configuration
    pub fn with_config(config: ZhipuConfig) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");
        Self {
            config,
            http_client,
        }
    }

    /// Build the request body for Zhipu API
    fn build_request_body(&self, request: &LlmRequest) -> ZhipuRequestBody {
        let messages: Vec<ZhipuMessage> = request
            .messages
            .iter()
            .map(|msg| ZhipuMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect();

        let tools = request.tools.as_ref().map(|tools| {
            tools.iter()
                .map(|t| ZhipuTool {
                    tool_type: "function".to_string(),
                    function: ZhipuFunction {
                        name: t.name.clone(),
                        description: t.description.clone(),
                        parameters: t.parameters.clone(),
                    },
                })
                .collect()
        });

        ZhipuRequestBody {
            model: self.config.model.as_str().to_string(),
            messages,
            stream: request.stream,
            tools,
            tool_choice: request.tools.as_ref().map(|_| "auto".to_string()),
        }
    }
}

#[async_trait]
impl LlmProvider for ZhipuProvider {
    fn provider_id(&self) -> &str {
        "zhipu"
    }

    fn provider_name(&self) -> &str {
        "Zhipu AI"
    }

    async fn health_check(&self) -> Result<bool, LlmProviderError> {
        // Try a minimal completion to check API availability
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

        let zhipu_response: ZhipuResponse = response
            .json()
            .await
            .map_err(|e| LlmProviderError::ResponseParseError(e.to_string()))?;

        Ok(LlmResponse {
            content: zhipu_response.choices.first()
                .map(|c| c.message.content.clone())
                .unwrap_or_default(),
            tool_calls: zhipu_response.choices.first()
                .and_then(|c| c.message.tool_calls.clone())
                .map(|tc| tc.into_iter().map(|t| t.into()).collect()),
            usage: LlmTokenUsage {
                prompt_tokens: zhipu_response.usage.prompt_tokens,
                completion_tokens: zhipu_response.usage.completion_tokens,
                total_tokens: zhipu_response.usage.total_tokens,
            },
            metadata: None,
        })
    }

    async fn complete_stream(
        &self,
        request: LlmRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, LlmProviderError>> + Send>>, LlmProviderError> {
        let body = self.build_request_body(&request);
        // Enable streaming
        let body = ZhipuRequestBody {
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

        // Create SSE stream from response bytes
        let stream = response.bytes_stream();
        let stream = stream.map(|result| {
            match result {
                Ok(bytes) => {
                    let chunk_str = String::from_utf8_lossy(&bytes).to_string();
                    // Parse SSE format: "data: {...}\n\n"
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
                            if let Ok(resp) = serde_json::from_str::<ZhipuStreamResponse>(data) {
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
                    // Skip this chunk if no valid data
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
            "glm-4".to_string(),
            "glm-4v".to_string(),
            "glm-3-turbo".to_string(),
        ]
    }
}

// ============ Zhipu API Types ============

#[derive(Debug, Serialize)]
struct ZhipuRequestBody {
    model: String,
    messages: Vec<ZhipuMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<ZhipuTool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ZhipuMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ZhipuTool {
    #[serde(rename = "type")]
    tool_type: String,
    function: ZhipuFunction,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ZhipuFunction {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct ZhipuResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<ZhipuChoice>,
    usage: ZhipuUsage,
}

#[derive(Debug, Deserialize)]
struct ZhipuChoice {
    index: u32,
    message: ZhipuChoiceMessage,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ZhipuChoiceMessage {
    role: String,
    content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<ZhipuToolCall>>,
}

#[derive(Debug, Deserialize, Clone)]
struct ZhipuToolCall {
    id: String,
    #[serde(rename = "type")]
    tool_type: String,
    function: ZhipuToolFunction,
}

#[derive(Debug, Deserialize, Clone)]
struct ZhipuToolFunction {
    name: String,
    arguments: String,
}

#[derive(Debug, Deserialize)]
struct ZhipuUsage {
    prompt_tokens: i32,
    completion_tokens: i32,
    total_tokens: i32,
}

// ============ SSE Streaming Types ============

#[derive(Debug, Deserialize)]
struct ZhipuStreamResponse {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<ZhipuStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct ZhipuStreamChoice {
    index: u32,
    delta: ZhipuDelta,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ZhipuDelta {
    role: Option<String>,
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<ZhipuToolCall>>,
}

// ============ Type Conversions ============

impl From<ZhipuToolCall> for super::provider_trait::LlmToolCall {
    fn from(t: ZhipuToolCall) -> Self {
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
    fn test_zhipu_config_default() {
        let config = ZhipuConfig::new("test_api_key");
        assert_eq!(config.api_key, "test_api_key");
        assert_eq!(config.model.as_str(), "glm-4");
    }

    #[test]
    fn test_zhipu_config_builder() {
        let config = ZhipuConfig::new("test_key")
            .with_endpoint("https://custom.endpoint.com")
            .with_model(ZhipuModel::Glm3)
            .with_timeout(120);

        assert_eq!(config.api_key, "test_key");
        assert_eq!(config.api_endpoint, "https://custom.endpoint.com");
        assert_eq!(config.model.as_str(), "glm-3-turbo");
        assert_eq!(config.timeout_secs, 120);
    }

    #[test]
    fn test_build_request_body() {
        let provider = ZhipuProvider::new("test_key");
        let request = LlmRequest {
            session_id: "session_1".to_string(),
            trace_id: "trace_1".to_string(),
            messages: vec![
                LlmMessage {
                    role: "system".to_string(),
                    content: "You are a helpful assistant.".to_string(),
                    tool_calls: None,
                },
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
        assert_eq!(body.model, "glm-4");
        assert_eq!(body.messages.len(), 2);
        assert_eq!(body.messages[0].role, "system");
        assert_eq!(body.messages[1].role, "user");
    }

    #[tokio::test]
    async fn test_zhipu_provider_creation() {
        let provider = ZhipuProvider::new("test_key");
        assert_eq!(provider.provider_id(), "zhipu");
        assert_eq!(provider.provider_name(), "Zhipu AI");
        assert!(provider.supports_streaming());
        assert!(provider.supports_tools());
    }
}
