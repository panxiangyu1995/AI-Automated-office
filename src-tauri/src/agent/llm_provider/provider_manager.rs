//! LLM Provider Manager
//!
//! Creates and manages LLM providers from configuration.

use std::sync::Arc;

use crate::agent::llm_provider::config::ProviderConfig;
use crate::agent::llm_provider::LlmProviderError;
use crate::agent::llm_provider::{
    DashScopeProvider, DeepSeekProvider, MinimaxProvider, OpenAICompatibleProvider, ZhipuProvider,
    DashScopeConfig, ZhipuConfig, DeepSeekConfig, MinimaxConfig, OpenAICompatibleConfig,
};

/// Result type for provider creation
pub type ProviderResult<T> = Result<T, LlmProviderError>;

/// Manages creation of LLM providers from configuration
pub struct LlmProviderManager;

impl LlmProviderManager {
    /// Create a provider from a ProviderConfig
    pub fn create_provider(config: &ProviderConfig) -> ProviderResult<Arc<dyn crate::agent::llm_provider::LlmProvider>> {
        let api_key = config.get_api_key()?;

        let provider: Arc<dyn crate::agent::llm_provider::LlmProvider> = match config.provider_type.as_str() {
            "zhipu" => {
                let zhipu_model = ZhipuConfig::model_from_str(&config.model)
                    .unwrap_or_default();
                let zhipu_config = ZhipuConfig::new(api_key)
                    .with_model(zhipu_model);
                Arc::new(ZhipuProvider::with_config(zhipu_config))
            }
            "deepseek" => {
                let deepseek_model = DeepSeekConfig::model_from_str(&config.model)
                    .unwrap_or_default();
                let deepseek_config = DeepSeekConfig::new(api_key)
                    .with_model(deepseek_model);
                Arc::new(DeepSeekProvider::with_config(deepseek_config))
            }
            "minimax" => {
                // Minimax requires group_id which is not in ProviderConfig
                // Use a default or fail
                let minimax_config = MinimaxConfig::new(api_key, "default_group");
                Arc::new(MinimaxProvider::with_config(minimax_config))
            }
            "dashscope" | "bailian" => {
                let mut dashscope_config = DashScopeConfig::new(api_key);
                if !config.model.is_empty() {
                    let model = match config.model.as_str() {
                        "qwen-max" => crate::agent::llm_provider::DashScopeModel::QwenMax,
                        "qwen-plus" => crate::agent::llm_provider::DashScopeModel::QwenPlus,
                        "qwen-turbo" => crate::agent::llm_provider::DashScopeModel::QwenTurbo,
                        "qwen-long" => crate::agent::llm_provider::DashScopeModel::QwenLong,
                        "qwq" => crate::agent::llm_provider::DashScopeModel::QwQ,
                        other => crate::agent::llm_provider::DashScopeModel::Custom(other.to_string()),
                    };
                    dashscope_config = dashscope_config.with_model(model);
                }
                if let Some(ref endpoint) = config.api_endpoint {
                    dashscope_config = dashscope_config.with_endpoint(endpoint.clone());
                }
                Arc::new(DashScopeProvider::with_config(dashscope_config))
            }
            "openai-compatible" | "openai" => {
                let mut openai_config = OpenAICompatibleConfig::new(
                    config.api_endpoint.clone().unwrap_or_else(|| "https://api.openai.com/v1/chat/completions".to_string())
                );
                openai_config = openai_config.with_api_key(api_key);
                if !config.model.is_empty() {
                    openai_config = openai_config.with_model(
                        OpenAICompatibleConfig::model_from_str(&config.model)
                    );
                }
                Arc::new(OpenAICompatibleProvider::with_config(openai_config))
            }
            _ => {
                return Err(LlmProviderError::InvalidConfig(format!(
                    "Unknown provider type: {}",
                    config.provider_type
                )));
            }
        };

        Ok(provider)
    }

    /// Create a Zhipu provider with API key
    pub fn create_zhipu_provider(api_key: &str, model: &str) -> ProviderResult<Arc<dyn crate::agent::llm_provider::LlmProvider>> {
        let zhipu_model = ZhipuConfig::model_from_str(model)
            .unwrap_or_default();
        let config = ZhipuConfig::new(api_key.to_string())
            .with_model(zhipu_model);
        Ok(Arc::new(ZhipuProvider::with_config(config)))
    }

    /// Create a DeepSeek provider with API key
    pub fn create_deepseek_provider(api_key: &str, model: &str) -> ProviderResult<Arc<dyn crate::agent::llm_provider::LlmProvider>> {
        let deepseek_model = DeepSeekConfig::model_from_str(model)
            .unwrap_or_default();
        let config = DeepSeekConfig::new(api_key.to_string())
            .with_model(deepseek_model);
        Ok(Arc::new(DeepSeekProvider::with_config(config)))
    }

    /// Create an OpenAI-compatible provider (e.g., for Ollama)
    pub fn create_openai_compatible_provider(
        endpoint: &str,
        api_key: Option<&str>,
        model: &str,
    ) -> ProviderResult<Arc<dyn crate::agent::llm_provider::LlmProvider>> {
        let mut config = OpenAICompatibleConfig::new(endpoint.to_string());
        if let Some(key) = api_key {
            config = config.with_api_key(key.to_string());
        }
        if !model.is_empty() {
            config = config.with_model(
                OpenAICompatibleConfig::model_from_str(model)
            );
        }
        Ok(Arc::new(OpenAICompatibleProvider::with_config(config)))
    }

    /// Create a DashScope provider with API key
    pub fn create_dashscope_provider(api_key: &str, model: &str) -> ProviderResult<Arc<dyn crate::agent::llm_provider::LlmProvider>> {
        let model = match model {
            "qwen-max" => crate::agent::llm_provider::DashScopeModel::QwenMax,
            "qwen-plus" => crate::agent::llm_provider::DashScopeModel::QwenPlus,
            "qwen-turbo" => crate::agent::llm_provider::DashScopeModel::QwenTurbo,
            "qwen-long" => crate::agent::llm_provider::DashScopeModel::QwenLong,
            "qwq" => crate::agent::llm_provider::DashScopeModel::QwQ,
            other => crate::agent::llm_provider::DashScopeModel::Custom(other.to_string()),
        };
        let config = DashScopeConfig::new(api_key.to_string())
            .with_model(model);
        Ok(Arc::new(DashScopeProvider::with_config(config)))
    }
}
