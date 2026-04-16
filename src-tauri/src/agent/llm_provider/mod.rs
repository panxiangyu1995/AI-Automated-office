//! LLM Provider Module
//!
//! This module provides LLM provider abstractions and implementations
//! for various LLM backends (Zhipu, DeepSeek, Minimax, OpenAI compatible).

pub mod provider_trait;

pub use provider_trait::{
    LlmMessage, LlmProvider, LlmProviderError, LlmRequest, LlmResponse,
};

// Alias for backward compatibility
pub use LlmProvider as LlmClient;

// Re-export error types for convenience

// ============ Provider Implementations ============

pub mod zhipu;

pub mod deepseek;
pub mod dashscope;
pub mod minimax;
pub mod openai_compatible;

// Re-export providers
pub use zhipu::{ZhipuProvider, ZhipuConfig};
pub use deepseek::{DeepSeekProvider, DeepSeekConfig};
pub use dashscope::{DashScopeProvider, DashScopeConfig, DashScopeModel};
pub use minimax::{MinimaxProvider, MinimaxConfig};
pub use openai_compatible::{OpenAICompatibleProvider, OpenAICompatibleConfig};

// ============ Configuration Services ============

pub mod crypto;
pub mod config;
pub mod quota;
pub mod config_service;
pub mod quota_service;

// Re-export services
pub use config::ProviderConfigService;

// ============ Provider Manager ============

pub mod provider_manager;
pub use provider_manager::LlmProviderManager;

// ============ Token Cache ============

pub mod token_cache;

// ============ Token Refresh Service ============

pub mod token_refresh;
pub use token_refresh::TokenRefreshService;

// ============ Integration Tests ============

#[cfg(test)]
mod tests;
