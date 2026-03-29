//! Provider Configuration Service with SQLite Backend
//!
//! Manages LLM provider configurations with three-level hierarchy:
//! - Level 1: Platform Official API (managed by platform)
//! - Level 2: Tenant-level configuration (managed by tenant admin)
//! - Level 3: User-level configuration (managed by individual user)

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::agent::llm_provider::config::{ConfigLevel, ProviderConfig};
use crate::agent::llm_provider::LlmProviderError;
use crate::storage::provider_config_store::ProviderConfigStore;

/// Provider configuration service with SQLite backend
#[derive(Debug, Clone)]
pub struct SqliteProviderConfigService {
    store: Arc<RwLock<ProviderConfigStore>>,
}

impl SqliteProviderConfigService {
    /// Create a new service with the given store
    pub fn new(store: ProviderConfigStore) -> Self {
        Self {
            store: Arc::new(RwLock::new(store)),
        }
    }

    /// Save a provider configuration
    pub async fn save_config(&self, config: ProviderConfig) -> Result<(), LlmProviderError> {
        let store = self.store.read().await;
        store
            .save_config(&config)
            .await
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))
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
            if let Some(config) = store
                .get_config(ConfigLevel::User, tenant_id, Some(user_id), provider_type)
                .await
                .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?
            {
                return Ok(Some(config));
            }
        }

        // Priority 2: Tenant-level config
        if let Some(tenant_id) = tenant_id {
            if let Some(config) = store
                .get_config(ConfigLevel::Tenant, Some(tenant_id), None, provider_type)
                .await
                .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?
            {
                return Ok(Some(config));
            }
        }

        // Priority 3: Official config
        store
            .get_official_config(provider_type)
            .await
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))
    }

    /// Get all configurations for a tenant
    pub async fn get_tenant_configs(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<ProviderConfig>, LlmProviderError> {
        let store = self.store.read().await;
        store
            .get_tenant_configs(tenant_id)
            .await
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))
    }

    /// Get all configurations for a user
    pub async fn get_user_configs(
        &self,
        user_id: &str,
    ) -> Result<Vec<ProviderConfig>, LlmProviderError> {
        let store = self.store.read().await;
        store
            .get_user_configs(user_id)
            .await
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))
    }

    /// Get the official configuration for a provider type
    pub async fn get_official_config(
        &self,
        provider_type: &str,
    ) -> Result<Option<ProviderConfig>, LlmProviderError> {
        let store = self.store.read().await;
        store
            .get_official_config(provider_type)
            .await
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))
    }

    /// Delete a configuration
    pub async fn delete_config(
        &self,
        id: &str,
    ) -> Result<bool, LlmProviderError> {
        let store = self.store.read().await;
        store
            .delete_config(id)
            .await
            .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))
    }
}
