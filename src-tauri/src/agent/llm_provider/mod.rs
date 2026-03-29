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

pub mod crypto;
pub mod config;
pub mod quota;

// Re-export services
pub use crypto::CryptoService;
pub use config::{ProviderConfigService, ProviderConfig, ConfigLevel};
pub use quota::{QuotaService, QuotaError, TokenUsage, UsageRecord, UsageStats};
