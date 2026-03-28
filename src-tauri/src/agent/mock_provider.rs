//! Mock Provider for Testing
//!
//! A simple mock provider that returns predefined responses for testing
//! the Agent runtime without requiring a real LLM connection.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use super::{AgentMessage, AgentResult, AgentProvider};
use super::provider::{ProviderRequest, ProviderResponse};

/// Mock provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockProviderConfig {
    /// Simulated response delay in milliseconds
    pub delay_ms: Option<u64>,
    /// Whether to simulate tool calls
    pub simulate_tool_calls: bool,
    /// Custom responses keyed by message content pattern
    pub custom_responses: Vec<CustomResponse>,
}

/// Custom response pattern
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomResponse {
    /// Pattern to match in user message
    pub pattern: String,
    /// Response to return when pattern matches
    pub response: String,
}

impl Default for MockProviderConfig {
    fn default() -> Self {
        Self {
            delay_ms: Some(500),
            simulate_tool_calls: false,
            custom_responses: Vec::new(),
        }
    }
}

/// Mock provider for testing
pub struct MockProvider {
    config: MockProviderConfig,
}

impl MockProvider {
    /// Create a new MockProvider with default config
    pub fn new() -> Self {
        Self {
            config: MockProviderConfig::default(),
        }
    }

    /// Create a MockProvider with custom config
    pub fn with_config(config: MockProviderConfig) -> Self {
        Self { config }
    }

    /// Generate response based on user message
    fn generate_response(&self, messages: &[AgentMessage]) -> String {
        // Get the last user message
        let last_user_message = messages
            .iter()
            .rev()
            .find(|m| m.role == "user")
            .map(|m| m.content.as_str())
            .unwrap_or("");

        // Check custom responses first
        for custom in &self.config.custom_responses {
            if last_user_message.to_lowercase().contains(&custom.pattern.to_lowercase()) {
                return custom.response.clone();
            }
        }

        // Default responses based on message content
        let content_lower = last_user_message.to_lowercase();

        if content_lower.contains("hello") || content_lower.contains("hi") {
            "Hello! I'm your AI assistant. How can I help you today?".to_string()
        } else if content_lower.contains("help") {
            "I can help you with various tasks including:\n\n\
             - Answering questions about the system\n\
             - Assisting with document creation\n\
             - Navigating the ERP features\n\
             - And more!\n\n\
             What would you like assistance with?".to_string()
        } else if content_lower.contains("weather") {
            "I'm sorry, I don't have access to real-time weather data. \
             However, I can help you with all the features of this ERP system! \
             Is there something specific you'd like to accomplish?".to_string()
        } else if content_lower.contains("thank") {
            "You're welcome! Is there anything else I can help you with?".to_string()
        } else if content_lower.contains("bye") || content_lower.contains("goodbye") {
            "Goodbye! Have a great day! 👋".to_string()
        } else if content_lower.contains("what can you do") || content_lower.contains("capabilities") {
            "As an AI assistant in this ERP system, I can:\n\n\
             1. **Answer questions** about the system and workflows\n\
             2. **Guide you** through using various features\n\
             3. **Help with tasks** like creating documents or forms\n\
             4. **Provide information** about your organization\n\
             5. **Assist with troubleshooting** common issues\n\n\
             Just let me know what you need!".to_string()
        } else if content_lower.is_empty() {
            "I received an empty message. Could you please provide more details about what you need?".to_string()
        } else {
            // Generic response that echoes understanding
            format!(
                "I understand you're asking about: \"{}\"\n\n\
                 As a mock assistant in the test environment, I'm configured to respond to \
                 simple patterns. In a real environment, this would be connected to an LLM.\n\n\
                 Is there something specific I can help you with in the ERP system?",
                if last_user_message.len() > 50 {
                    &last_user_message[..50]
                } else {
                    last_user_message
                }
            )
        }
    }

    /// Apply simulated delay
    async fn apply_delay(&self) {
        if let Some(delay_ms) = self.config.delay_ms {
            tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
        }
    }
}

impl Default for MockProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AgentProvider for MockProvider {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        // Apply delay
        self.apply_delay().await;

        // Generate response
        let content = self.generate_response(&request.messages);

        Ok(ProviderResponse {
            content,
            tool_calls: None,
            metadata: Some(serde_json::json!({
                "provider": "mock",
                "model": "mock-model",
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 20,
                    "total_tokens": 30
                }
            })),
        })
    }
}

// ==================== Mock Provider with Tool Support ====================

/// Mock provider that simulates tool calls for testing
pub struct MockProviderWithTools {
    config: MockProviderConfig,
}

impl MockProviderWithTools {
    pub fn new() -> Self {
        let mut config = MockProviderConfig::default();
        config.simulate_tool_calls = true;
        Self { config }
    }

    async fn apply_delay(&self) {
        if let Some(delay_ms) = self.config.delay_ms {
            tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
        }
    }

    fn generate_response(&self, messages: &[AgentMessage]) -> (String, Option<serde_json::Value>) {
        let last_user_message = messages
            .iter()
            .rev()
            .find(|m| m.role == "user")
            .map(|m| m.content.as_str())
            .unwrap_or("");

        let content_lower = last_user_message.to_lowercase();

        // Check for tool call simulation
        if content_lower.contains("search") || content_lower.contains("find") {
            let tool_calls = serde_json::json!([
                {
                    "id": "tool_call_1",
                    "type": "function",
                    "function": {
                        "name": "search_knowledge_base",
                        "arguments": format!("{{\"query\": \"{}\"}}", last_user_message)
                    }
                }
            ]);
            return (
                "I'll search for that information in the knowledge base.".to_string(),
                Some(tool_calls),
            );
        }

        if content_lower.contains("create") && content_lower.contains("user") {
            let tool_calls = serde_json::json!([
                {
                    "id": "tool_call_2",
                    "type": "function",
                    "function": {
                        "name": "create_user_account",
                        "arguments": "{{\"username\": \"new_user\", \"email\": \"user@example.com\"}}"
                    }
                }
            ]);
            return (
                "I'll help you create a new user account with the provided details.".to_string(),
                Some(tool_calls),
            );
        }

        // Default mock response
        let response = format!(
            "Mock response to: \"{}\". This is a simulated response for testing.",
            if last_user_message.len() > 50 {
                &last_user_message[..50]
            } else {
                last_user_message
            }
        );
        (response, None)
    }
}

impl Default for MockProviderWithTools {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AgentProvider for MockProviderWithTools {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        self.apply_delay().await;

        let (content, tool_calls) = self.generate_response(&request.messages);

        Ok(ProviderResponse {
            content,
            tool_calls,
            metadata: Some(serde_json::json!({
                "provider": "mock_with_tools",
                "model": "mock-model",
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 20,
                    "total_tokens": 30
                }
            })),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mock_provider_basic() {
        let provider = MockProvider::new();

        let messages = vec![
            AgentMessage {
                role: "user".to_string(),
                content: "Hello".to_string(),
                metadata: None,
            },
        ];

        let request = ProviderRequest {
            session_id: "test".to_string(),
            trace_id: "trace".to_string(),
            messages,
            metadata: None,
        };

        let response = provider.complete(request).await.unwrap();
        assert!(response.content.contains("Hello"));
    }

    #[tokio::test]
    async fn test_mock_provider_custom_response() {
        let mut config = MockProviderConfig::default();
        config.custom_responses = vec![CustomResponse {
            pattern: "secret".to_string(),
            response: "You found the secret!".to_string(),
        }];

        let provider = MockProvider::with_config(config);

        let messages = vec![AgentMessage {
            role: "user".to_string(),
            content: "Tell me about the secret".to_string(),
            metadata: None,
        }];

        let request = ProviderRequest {
            session_id: "test".to_string(),
            trace_id: "trace".to_string(),
            messages,
            metadata: None,
        };

        let response = provider.complete(request).await.unwrap();
        assert!(response.content.contains("secret"));
    }
}
