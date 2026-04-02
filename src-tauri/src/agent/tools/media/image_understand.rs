//! Image understanding tool implementation.
//!
//! Provides image analysis using vision-capable LLM models.

use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Image detail level
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImageDetail {
    /// Low detail - fast processing
    Low,
    /// High detail - comprehensive analysis
    High,
    /// Auto detail - model decides
    Auto,
}

impl Default for ImageDetail {
    fn default() -> Self {
        Self::Auto
    }
}

/// Parameters for image understanding
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageUnderstandParams {
    /// Image URL (either URL or image_data required)
    #[serde(default)]
    pub image_url: Option<String>,

    /// Base64 encoded image data (either URL or image_data required)
    #[serde(default)]
    pub image_data: Option<String>,

    /// Analysis prompt/question
    pub prompt: String,

    /// Detail level (low/high/auto)
    #[serde(default)]
    pub detail: Option<ImageDetail>,

    /// Max tokens in response
    #[serde(default)]
    pub max_tokens: Option<u32>,
}

/// Image understanding result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageUnderstandResult {
    /// Text description of the image
    pub description: String,

    /// Extracted tags/labels
    pub tags: Vec<String>,

    /// Detected objects with confidence
    pub objects: Vec<ObjectDetection>,

    /// Text extracted from image (OCR)
    pub extracted_text: Option<String>,

    /// Raw model response
    pub raw_response: Value,

    /// Processing duration
    pub duration_ms: u64,
}

/// Detected object in image
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ObjectDetection {
    pub label: String,
    pub confidence: f32,
    pub bounding_box: Option<BoundingBox>,
}

/// Bounding box coordinates
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoundingBox {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

/// Image understanding executor
pub struct ImageUnderstandExecutor;

impl ImageUnderstandExecutor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for ImageUnderstandExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for ImageUnderstandExecutor {
    async fn execute(
        &self,
        params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let img_params: ImageUnderstandParams = match serde_json::from_value(params) {
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

        // Validate: at least one of image_url or image_data must be provided
        if img_params.image_url.is_none() && img_params.image_data.is_none() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Either image_url or image_data must be provided".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate prompt
        if img_params.prompt.trim().is_empty() {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "prompt cannot be empty".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        // Validate image_url format if provided
        if let Some(ref url) = img_params.image_url {
            if !url.starts_with("http://") && !url.starts_with("https://") {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: "image_url must be a valid HTTP/HTTPS URL".to_string(),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        }

        // In production, this would call a vision-capable LLM API
        // For now, return a mock response
        let detail_str = match &img_params.detail {
            Some(ImageDetail::Low) => "low",
            Some(ImageDetail::High) => "high",
            Some(ImageDetail::Auto) => "auto",
            None => "auto",
        };

        let result = ImageUnderstandResult {
            description: format!(
                "Image analysis result for: {}. This is a mock response - \
                integrate with a vision-capable LLM (e.g., GPT-4V, Claude Vision) for real analysis.",
                img_params.prompt
            ),
            tags: vec![
                "mock".to_string(),
                "placeholder".to_string(),
                format!("detail_{}", detail_str),
            ],
            objects: vec![
                ObjectDetection {
                    label: "placeholder_object".to_string(),
                    confidence: 0.85,
                    bounding_box: Some(BoundingBox {
                        x: 0.1,
                        y: 0.1,
                        width: 0.3,
                        height: 0.3,
                    }),
                },
            ],
            extracted_text: Some("Mock OCR: No actual text extraction performed.".to_string()),
            raw_response: serde_json::json!({
                "model": "mock-vision-model",
                "detail": detail_str,
                "prompt": img_params.prompt,
                "source": if img_params.image_url.is_some() { "url" } else { "base64" },
            }),
            duration_ms: start.elapsed().as_millis() as u64,
        };

        Ok(serde_json::to_value(result).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::InternalError,
            message: format!("Failed to serialize response: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_image_understand_with_url() {
        let executor = ImageUnderstandExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["media:read".to_string()],
            metadata: None,
        };

        let params = serde_json::json!({
            "image_url": "https://example.com/image.jpg",
            "prompt": "What is in this image?",
            "detail": "high"
        });

        let result = executor.execute(params, &context).await;
        assert!(result.is_ok());

        let response: ImageUnderstandResult = serde_json::from_value(result.unwrap()).unwrap();
        assert!(!response.description.is_empty());
        assert!(!response.tags.is_empty());
    }

    #[tokio::test]
    async fn test_image_understand_validation() {
        let executor = ImageUnderstandExecutor::new();
        let context = ToolExecutionContext {
            session_id: "test".to_string(),
            user_id: "test".to_string(),
            tenant_id: "test".to_string(),
            department_id: None,
            page_id: None,
            resource_id: None,
            permissions: vec!["media:read".to_string()],
            metadata: None,
        };

        // No image provided
        let params = serde_json::json!({
            "prompt": "What is this?"
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Empty prompt
        let params = serde_json::json!({
            "image_url": "https://example.com/image.jpg",
            "prompt": ""
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());

        // Invalid URL
        let params = serde_json::json!({
            "image_url": "not-a-url",
            "prompt": "What is this?"
        });
        let result = executor.execute(params, &context).await;
        assert!(result.is_err());
    }
}
