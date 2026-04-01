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

pub mod deepseek;
pub mod minimax;
pub mod openai_compatible;

// Re-export providers
pub use zhipu::{ZhipuProvider, ZhipuConfig, ZhipuModel};
pub use deepseek::{DeepSeekProvider, DeepSeekConfig, DeepSeekModel};
pub use minimax::{MinimaxProvider, MinimaxConfig, MinimaxModel};
pub use openai_compatible::{OpenAICompatibleProvider, OpenAICompatibleConfig, OpenAICompatibleModel};

// ============ Configuration Services ============

pub mod crypto;
pub mod config;
pub mod quota;
pub mod config_service;
pub mod quota_service;

// Re-export services
pub use crypto::CryptoService;
pub use config::{ProviderConfigService, ProviderConfig, ConfigLevel};
pub use quota::{QuotaService, QuotaError, TokenUsage, UsageRecord, UsageStats};
pub use config_service::SqliteProviderConfigService;
pub use quota_service::SqliteQuotaService;

// ============ Provider Manager ============

pub mod provider_manager;
pub use provider_manager::LlmProviderManager;

// ============ Token Cache ============

pub mod token_cache;
pub use token_cache::{OfficialTokenCache, OfficialTokenCacheService, TokenInfo, TokenType};

// ============ Token Refresh Service ============

pub mod token_refresh;
pub use token_refresh::{TokenRefreshConfig, TokenRefreshService, TokenRefreshCallback, TokenRefreshError};

// ============ Integration Tests ============

#[cfg(test)]
mod tests;
