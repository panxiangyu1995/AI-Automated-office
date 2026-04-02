//! Text-to-Speech tool implementation.
//!
//! Provides TTS synthesis using various providers.

use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Supported output formats
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Mp3,
    Wav,
    Ogg,
    Pcm,
}

impl Default for OutputFormat {
    fn default() -> Self {
        Self::Mp3
    }
}

/// Parameters for TTS synthesis
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TtsSpeakParams {
    /// Text to convert to speech
    pub text: String,

    /// Voice ID or name (provider-specific)
    #[serde(default)]
    pub voice: Option<String>,

    /// Speech speed (0.5 - 2.0, default 1.0)
    #[serde(default)]
    pub speed: Option<f32>,

    /// Output format (mp3/wav/ogg/pcm)
    #[serde(default)]
    pub output_format: Option<OutputFormat>,

    /// Language code (e.g., "en-US")
    #[serde(default)]
    pub language: Option<String>,

    /// Save to file path (optional)
    #[serde(default)]
    pub output_path: Option<String>,
}

/// TTS synthesis result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TtsSpeakResult {
    /// Audio data as base64 (if not saved to file)
    pub audio_data: Option<String>,

    /// URL to audio file (if uploaded)
    pub audio_url: Option<String>,

    /// Path where audio was saved
    pub saved_path: Option<String>,

    /// Audio duration in seconds
    pub duration_seconds: f32,

    /// Number of characters processed
    pub char_count: usize,

    /// Provider used
    pub provider: String,

    /// Voice used
    pub voice: String,

    /// Processing duration
    pub duration_ms: u64,
}

/// Mock TTS provider
pub struct MockTtsProvider;

impl MockTtsProvider {
    /// Simulate TTS synthesis
    pub async fn synthesize(&self, params: &TtsSpeakParams) -> Result<TtsSpeakResult, String> {
        let start = Instant::now();

        // Calculate mock duration based on text length
        let char_count = params.text.chars().count();
        let speed = params.speed.unwrap_or(1.0);
        let duration_seconds = (char_count as f32 / 10.0 / speed).max(0.1);

        // Simulate processing time
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        Ok(TtsSpeakResult {
            audio_data: Some("MOCK_AUDIO_BASE64_DATA".to_string()),
            audio_url: None,
            saved_path: params.output_path.clone(),
            duration_seconds,
            char_count,
            provider: "mock-tts-provider".to_string(),
            voice: params.voice.clone().unwrap_or_else(|| "default".to_string()),
            duration_ms: start.elapsed().as_millis() as u64,
        })
    }
}

/// TTS speak executor
pub struct TtsSpeakExecutor {
    provider: MockTtsProvider,
}

impl TtsSpeakExecutor {
    pub fn new() -> Self {
        Self {
            provider: MockTtsProvider,
        }
    }
}

impl Default for TtsSpeakExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for TtsSpeakExecutor {
    async fn execute(
        &self,
        params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let tts_params: TtsSpeakParams = match serde_json::from_value(params) {
            Ok(p) => p,
            Err(e) => {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: format!("Invalid parameters: {}", e),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        };

        // Validate text
        if tts_params.text.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "text cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate text length (reasonable limit)
        if tts_params.text.len() > 10000 {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "text exceeds maximum length of 10000 characters".to_string(),
                details: Some(serde_json::json!({
                    "current_length": tts_params.text.len(),
                    "max_length": 10000
                })),
                recoverable: true,
                retryable: false,
            });
        }

        // Validate speed
        if let Some(speed) = tts_params.speed {
            if !(0.1..=4.0).contains(&speed) {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: "speed must be between 0.1 and 4.0".to_string(),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        }

        // Synthesize speech
        match self.provider.synthesize(&tts_params).await {
            Ok(result) => Ok(serde_json::to_value(result).map_err(|e| {
                ToolExecutionError {
                    code: ToolErrorCode::InternalError,
                    message: format!("Failed to serialize response: {}", e),
                    details: None,
                    recoverable: false,
                    retryable: false,
                }
            })?),
            Err(e) => Err(ToolExecutionError {
                code: ToolErrorCode::ExecutionError,
                message: e,
                details: None,
                recoverable: true,
                retryable: true,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_tts_speak_basic() {
        let executor = TtsSpeakExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["media:write".to_string()],
            metadata: None,
        };

        let params = serde_json::json!({
            "text": "Hello, this is a test."
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: TtsSpeakResult = serde_json::from_value(result.unwrap()).unwrap();
        assert!(response.audio_data.is_some());
        assert_eq!(response.provider, "mock-tts-provider");
    }

    #[tokio::test]
    async fn test_tts_speak_with_options() {
        let executor = TtsSpeakExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["media:write".to_string()],
            metadata: None,
        };

        let params = serde_json::json!({
            "text": "Testing TTS with options.",
            "voice": "en-US-Neural",
            "speed": 1.5,
            "output_format": "wav"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: TtsSpeakResult = serde_json::from_value(result.unwrap()).unwrap();
        assert_eq!(response.voice, "en-US-Neural");
    }

    #[tokio::test]
    async fn test_tts_speak_validation() {
        let executor = TtsSpeakExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["media:write".to_string()],
            metadata: None,
        };

        // Empty text
        let params = serde_json::json!({
            "text": ""
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Invalid speed
        let params = serde_json::json!({
            "text": "Test",
            "speed": 5.0
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }
}
