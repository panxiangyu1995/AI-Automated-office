//! Media tools module.
//!
//! Provides image understanding and text-to-speech capabilities.
//!
//! # Tools
//!
//! - `image_understand`: Analyze images using vision models
//! - `tts_speak`: Convert text to speech
//!
//! # Architecture
//!
//! These tools integrate with LLM vision capabilities for image understanding
//! and TTS providers for speech synthesis.

pub mod image_understand;
pub mod tts_speak;

use std::collections::HashMap;
use std::sync::Arc;

use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;

/// Register all media tools to the registry and executor map
pub fn register_media_tools(
    registry: &mut ToolRegistry,
    executors: &mut HashMap<String, Arc<dyn ToolExecutor>>,
) {
    // === image_understand ===
    let descriptor = ToolDescriptor {
        id: "image_understand".to_string(),
        name: "Image Understand".to_string(),
        description: "Analyze and understand images using vision models. Supports URL and base64 image data."
            .to_string(),
        category: ToolCategory::Media,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: false,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: true,
            has_side_effects: false,
            supports_retry: true,
            estimated_duration: Some(5000),
        },
        permissions: None,
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec![
                "media".to_string(),
                "image".to_string(),
                "vision".to_string(),
                "understand".to_string(),
            ],
            category: "media".to_string(),
            subcategory: Some("image".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::media".to_string()),
        handler_function: Some("image_understand".to_string()),
    };
    registry.register(descriptor);
    executors.insert(
        "image_understand".to_string(),
        Arc::new(image_understand::ImageUnderstandExecutor::new()),
    );

    // === tts_speak ===
    let descriptor = ToolDescriptor {
        id: "tts_speak".to_string(),
        name: "TTS Speak".to_string(),
        description: "Convert text to speech using TTS providers. Supports voice selection and speed control."
            .to_string(),
        category: ToolCategory::Media,
        parameters: vec![],
        return_type: None,
        execution_mode: ToolExecutionMode::Async,
        capabilities: ToolCapabilities {
            supports_streaming: true,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: false,
            has_side_effects: true,
            supports_retry: true,
            estimated_duration: Some(3000),
        },
        permissions: None,
        dependencies: None,
        context_requirements: None,
        metadata: ToolMetadata {
            author: Some("AI-Automated-Office".to_string()),
            version: "1.0.0".to_string(),
            license: None,
            homepage: None,
            repository: None,
            tags: vec![
                "media".to_string(),
                "tts".to_string(),
                "speech".to_string(),
                "audio".to_string(),
            ],
            category: "media".to_string(),
            subcategory: Some("tts".to_string()),
        },
        enabled: true,
        deprecated: None,
        deprecation_message: None,
        handler_module: Some("agent::tools::media".to_string()),
        handler_function: Some("tts_speak".to_string()),
    };
    registry.register(descriptor);
    executors.insert(
        "tts_speak".to_string(),
        Arc::new(tts_speak::TtsSpeakExecutor::new()),
    );
}
