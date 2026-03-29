//! Provider Configuration Service
//!
//! Manages LLM provider configurations with three-level hierarchy:
//! - Level 1: Platform Official API (managed by platform)
//! - Level 2: Tenant-level configuration (managed by tenant admin)
//! - Level 3: User-level configuration (managed by individual user)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::crypto::CryptoService;
use super::provider_trait::LlmProviderError;

/// Configuration level priority (higher = higher priority)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ConfigLevel {
    /// Platform official API
    Official = 3,
    /// Tenant-level configuration
    Tenant = 2,
    /// User-level configuration
    User = 1,
}

impl std::fmt::Display for ConfigLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigLevel::Official => write!(f, "official"),
            ConfigLevel::Tenant => write!(f, "tenant"),
            ConfigLevel::User => write!(f, "user"),
        }
    }
}

/// Provider configuration entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    /// Unique configuration ID
    pub id: String,
    /// Provider type (zhipu, deepseek, minimax, openai)
    pub provider_type: String,
    /// API endpoint (for OpenAI compatible providers)
    pub api_endpoint: Option<String>,
    /// Encrypted API key
    pub encrypted_api_key: String,
    /// Model to use
    pub model: String,
    /// Configuration level
    pub level: String,
    /// Tenant ID (for tenant/user level configs)
    pub tenant_id: Option<String>,
    /// User ID (for user level configs)
    pub user_id: Option<String>,
    /// Whether this config is active
    pub is_active: bool,
    /// Created timestamp
    pub created_at: i64,
    /// Updated timestamp
    pub updated_at: i64,
}

impl ProviderConfig {
    /// Create a new provider config
    pub fn new(
        provider_type: impl Into<String>,
        api_key: &str,
        model: impl Into<String>,
        level: ConfigLevel,
    ) -> Result<Self, LlmProviderError> {
        let crypto = CryptoService::global();
        let encrypted_api_key = crypto
            .encrypt(api_key)
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?;

        Ok(Self {
            id: uuid::Uuid::new_v4().to_string(),
            provider_type: provider_type.into(),
            api_endpoint: None,
            encrypted_api_key,
            model: model.into(),
            level: level.to_string(),
            tenant_id: None,
            user_id: None,
            is_active: true,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        })
    }

    /// Create a tenant-level config
    pub fn with_tenant_id(mut self, tenant_id: impl Into<String>) -> Self {
        self.tenant_id = Some(tenant_id.into());
        self
    }

    /// Create a user-level config
    pub fn with_user_id(mut self, user_id: impl Into<String>) -> Self {
        self.user_id = Some(user_id.into());
        self
    }

    /// Set API endpoint
    pub fn with_api_endpoint(mut self, endpoint: impl Into<String>) -> Self {
        self.api_endpoint = Some(endpoint.into());
        self
    }

    /// Decrypt the API key
    pub fn get_api_key(&self) -> Result<String, LlmProviderError> {
        let crypto = CryptoService::global();
        crypto
            .decrypt(&self.encrypted_api_key)
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))
    }
}

/// In-memory provider configuration store
/// In production, this would be backed by SQLite
#[derive(Debug, Default)]
pub struct ProviderConfigStore {
    /// Official (platform) configurations
    official: HashMap<String, ProviderConfig>,
    /// Tenant-level configurations: tenant_id -> provider_type -> config
    tenant: HashMap<String, HashMap<String, ProviderConfig>>,
    /// User-level configurations: user_id -> provider_type -> config
    user: HashMap<String, HashMap<String, ProviderConfig>>,
}

/// Provider configuration service
#[derive(Debug, Clone)]
pub struct ProviderConfigService {
    store: Arc<RwLock<ProviderConfigStore>>,
}

impl ProviderConfigService {
    /// Create a new ProviderConfigService
    pub fn new() -> Self {
        Self {
            store: Arc::new(RwLock::new(ProviderConfigStore::default())),
        }
    }

    /// Save a provider configuration
    pub async fn save_config(&self, config: ProviderConfig) -> Result<(), LlmProviderError> {
        let mut store = self.store.write().await;

        match config.level.as_str() {
            "official" => {
                store.official.insert(config.provider_type.clone(), config);
            }
            "tenant" => {
                let tenant_id = config.tenant_id.clone().ok_or_else(|| {
                    LlmProviderError::InvalidConfig("Tenant ID required".to_string())
                })?;
                let entry = store.tenant.entry(tenant_id).or_default();
                entry.insert(config.provider_type.clone(), config);
            }
            "user" => {
                let user_id = config.user_id.clone().ok_or_else(|| {
                    LlmProviderError::InvalidConfig("User ID required".to_string())
                })?;
                let entry = store.user.entry(user_id).or_default();
                entry.insert(config.provider_type.clone(), config);
            }
            _ => {
                return Err(LlmProviderError::InvalidConfig(format!(
                    "Invalid config level: {}",
                    config.level
                )));
            }
        }

        Ok(())
    }

    /// Get the active configuration for a user request
    ///
    /// Priority: User config > Tenant config > Official config
    pub async fn get_active_config(
        &self,
        tenant_id: Option<&str>,
        user_id: Option<&str>,
        provider_type: &str,
    ) -> Result<Option<ProviderConfig>, LlmProviderError> {
        let store = self.store.read().await;

        // Priority 1: User-level config
        if let Some(user_id) = user_id {
            if let Some(user_configs) = store.user.get(user_id) {
                if let Some(config) = user_configs.get(provider_type) {
                    if config.is_active {
                        return Ok(Some(config.clone()));
                    }
                }
            }
        }

        // Priority 2: Tenant-level config
        if let Some(tenant_id) = tenant_id {
            if let Some(tenant_configs) = store.tenant.get(tenant_id) {
                if let Some(config) = tenant_configs.get(provider_type) {
                    if config.is_active {
                        return Ok(Some(config.clone()));
                    }
                }
            }
        }

        // Priority 3: Official config
        if let Some(config) = store.official.get(provider_type) {
            if config.is_active {
                return Ok(Some(config.clone()));
            }
        }

        Ok(None)
    }

    /// Get all configurations for a tenant
    pub async fn get_tenant_configs(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<ProviderConfig>, LlmProviderError> {
        let store = self.store.read().await;

        let configs = store
            .tenant
            .get(tenant_id)
            .map(|m| m.values().cloned().collect())
            .unwrap_or_default();

        Ok(configs)
    }

    /// Get all configurations for a user
    pub async fn get_user_configs(
        &self,
        user_id: &str,
    ) -> Result<Vec<ProviderConfig>, LlmProviderError> {
        let store = self.store.read().await;

        let configs = store
            .user
            .get(user_id)
            .map(|m| m.values().cloned().collect())
            .unwrap_or_default();

        Ok(configs)
    }

    /// Get the official configuration for a provider type
    pub async fn get_official_config(
        &self,
        provider_type: &str,
    ) -> Result<Option<ProviderConfig>, LlmProviderError> {
        let store = self.store.read().await;

        Ok(store.official.get(provider_type).cloned())
    }

    /// Delete a configuration
    pub async fn delete_config(
        &self,
        level: ConfigLevel,
        tenant_id: Option<&str>,
        user_id: Option<&str>,
        provider_type: &str,
    ) -> Result<bool, LlmProviderError> {
        let mut store = self.store.write().await;

        match level {
            ConfigLevel::Official => {
                Ok(store.official.remove(provider_type).is_some())
            }
            ConfigLevel::Tenant => {
                let tenant_id = tenant_id.ok_or_else(|| {
                    LlmProviderError::InvalidConfig("Tenant ID required".to_string())
                })?;
                if let Some(tenant_configs) = store.tenant.get_mut(tenant_id) {
                    Ok(tenant_configs.remove(provider_type).is_some())
                } else {
                    Ok(false)
                }
            }
            ConfigLevel::User => {
                let user_id = user_id.ok_or_else(|| {
                    LlmProviderError::InvalidConfig("User ID required".to_string())
                })?;
                if let Some(user_configs) = store.user.get_mut(user_id) {
                    Ok(user_configs.remove(provider_type).is_some())
                } else {
                    Ok(false)
                }
            }
        }
    }

    /// Initialize default official configurations
    pub async fn init_official_configs(&self) -> Result<(), LlmProviderError> {
        // Zhipu official config
        let zhipu_config = ProviderConfig::new("zhipu", "", "glm-4", ConfigLevel::Official)?;
        self.save_config(zhipu_config).await?;

        // DeepSeek official config
        let deepseek_config = ProviderConfig::new("deepseek", "", "deepseek-chat", ConfigLevel::Official)?;
        self.save_config(deepseek_config).await?;

        // Minimax official config
        let minimax_config = ProviderConfig::new("minimax", "", "abab6-chat", ConfigLevel::Official)?;
        self.save_config(minimax_config).await?;

        Ok(())
    }
}

impl Default for ProviderConfigService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_save_and_get_config() {
        let service = ProviderConfigService::new();

        let config = ProviderConfig::new("zhipu", "test-api-key", "glm-4", ConfigLevel::Official)
            .unwrap()
            .with_tenant_id("tenant-1");

        service.save_config(config.clone()).await.unwrap();

        let retrieved = service
            .get_active_config(Some("tenant-1"), None, "zhipu")
            .await
            .unwrap();

        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().provider_type, "zhipu");
    }

    #[tokio::test]
    async fn test_priority_user_over_tenant() {
        let service = ProviderConfigService::new();

        // Tenant config
        let tenant_config = ProviderConfig::new("zhipu", "tenant-key", "glm-4", ConfigLevel::Tenant)
            .unwrap()
            .with_tenant_id("tenant-1");

        // User config (should take priority)
        let user_config = ProviderConfig::new("zhipu", "user-key", "glm-4-flash", ConfigLevel::User)
            .unwrap()
            .with_tenant_id("tenant-1")
            .with_user_id("user-1");

        service.save_config(tenant_config).await.unwrap();
        service.save_config(user_config.clone()).await.unwrap();

        let retrieved = service
            .get_active_config(Some("tenant-1"), Some("user-1"), "zhipu")
            .await
            .unwrap();

        assert!(retrieved.is_some());
        // Should return user config due to priority
        assert_eq!(retrieved.unwrap().model, "glm-4-flash");
    }

    #[tokio::test]
    async fn test_fallback_to_official() {
        let service = ProviderConfigService::new();

        // Only official config
        let official_config = ProviderConfig::new("zhipu", "official-key", "glm-4", ConfigLevel::Official)
            .unwrap();

        service.save_config(official_config).await.unwrap();

        let retrieved = service
            .get_active_config(Some("tenant-1"), Some("user-1"), "zhipu")
            .await
            .unwrap();

        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().model, "glm-4");
    }

    #[tokio::test]
    async fn test_delete_config() {
        let service = ProviderConfigService::new();

        let config = ProviderConfig::new("zhipu", "test-key", "glm-4", ConfigLevel::Official)
            .unwrap();

        service.save_config(config).await.unwrap();

        let deleted = service
            .delete_config(ConfigLevel::Official, None, None, "zhipu")
            .await
            .unwrap();

        assert!(deleted);

        let retrieved = service.get_active_config(None, None, "zhipu").await.unwrap();
        assert!(retrieved.is_none());
    }
}
