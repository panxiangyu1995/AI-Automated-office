//! LLM Provider Module
//!
//! This module provides LLM provider abstractions and implementations
//! for various LLM backends (Zhipu, DeepSeek, Minimax, OpenAI compatible).

pub mod provider_trait;

pub use provider_trait::{
    LlmMessage, LlmProvider, LlmProviderError, LlmRequest, LlmResponse, LlmStreamChunk,
    LlmToolCall, LlmToolDescriptor, LlmToolFunction, LlmTokenUsage,
};

// Re-export error types for convenience
pub use provider_trait::LlmProviderError as ProviderError;

// ============ Provider Implementations ============

pub mod zhipu;

// TODO: Uncomment when implementations are added
// pub mod deepseek;
// pub mod minimax;
// pub mod openai_compatible;

// Re-export providers when implemented
pub use zhipu::{ZhipuProvider, ZhipuConfig, ZhipuModel};
// pub use deepseek::DeepSeekProvider;
// pub use minimax::MinimaxProvider;
// pub mod openai_compatible::OpenAICompatibleProvider;

// ============ Configuration Services ============

// TODO: Uncomment when services are implemented
// pub mod config;
// pub mod quota;
// pub mod crypto;

// Re-export services when implemented
// pub use config::ProviderConfigService;
// pub use quota::QuotaService;
// pub use crypto::CryptoService;
