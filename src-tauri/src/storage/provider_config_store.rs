//! Provider Config Store
//!
//! SQLite-backed storage for LLM provider configurations.

use anyhow::{Context, Result};
use sqlx::{Row, SqlitePool};

use crate::agent::llm_provider::config::{ConfigLevel, ProviderConfig, RoutingConfig};
use crate::agent::llm_provider::LlmProviderError;

/// Provider config store backed by SQLite
#[derive(Debug, Clone)]
pub struct ProviderConfigStore {
    pool: SqlitePool,
}

impl ProviderConfigStore {
    /// Create a new store with the given connection pool
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Save a provider configuration
    pub async fn save_config(&self, config: &ProviderConfig) -> Result<(), LlmProviderError> {
        let level_str = config.level.as_str();
        let is_deleted = if config.level == "deleted" { 1 } else { 0 };
        let routing_config_json = config.routing_config.as_ref().map(|rc| serde_json::to_string(rc).ok()).flatten();

        sqlx::query(
            r#"
            INSERT INTO provider_configs (
                id, config_key, provider_id, provider_name, api_endpoint,
                api_key_encrypted, model, priority, is_active, config_level,
                tenant_id, user_id, created_at, updated_at, is_deleted, version,
                routing_config
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                api_endpoint = excluded.api_endpoint,
                api_key_encrypted = excluded.api_key_encrypted,
                model = excluded.model,
                priority = excluded.priority,
                is_active = excluded.is_active,
                updated_at = excluded.updated_at,
                is_deleted = excluded.is_deleted,
                version = version + 1,
                routing_config = excluded.routing_config
            "#,
        )
        .bind(&config.id)
        .bind(format!("{}_{}_{}", config.level, config.tenant_id.as_deref().unwrap_or(""), config.provider_type))
        .bind(&config.provider_type)
        .bind(format!("{:?} Provider", config.provider_type))
        .bind(&config.api_endpoint)
        .bind(&config.encrypted_api_key)
        .bind(&config.model)
        .bind(0)
        .bind(if config.is_active { 1 } else { 0 })
        .bind(level_str)
        .bind(&config.tenant_id)
        .bind(&config.user_id)
        .bind(config.created_at)
        .bind(config.updated_at)
        .bind(is_deleted)
        .bind(&routing_config_json)
        .execute(&self.pool)
        .await
        .context("failed to save provider config")
        .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?;

        Ok(())
    }

    /// Get active config by level and provider type
    pub async fn get_config(
        &self,
        level: ConfigLevel,
        tenant_id: Option<&str>,
        user_id: Option<&str>,
        provider_type: &str,
    ) -> Result<Option<ProviderConfig>, LlmProviderError> {
        let level_str = level.to_string();

        let row = sqlx::query(
            r#"
            SELECT id, provider_id, api_endpoint, api_key_encrypted, model,
                   config_level, tenant_id, user_id, is_active, created_at, updated_at
            FROM provider_configs
            WHERE config_level = ?
              AND provider_id = ?
              AND is_deleted = 0
              AND is_active = 1
              AND (? OR tenant_id = ?)
              AND (? OR user_id = ?)
            ORDER BY
                CASE config_level
                    WHEN 'user' THEN 1
                    WHEN 'tenant' THEN 2
                    WHEN 'official' THEN 3
                END
            LIMIT 1
            "#,
        )
        .bind(&level_str)
        .bind(provider_type)
        .bind(tenant_id.is_none())
        .bind(tenant_id)
        .bind(user_id.is_none())
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("failed to query provider config")
        .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?;

        match row {
            Some(r) => Ok(Some(map_config(r))),
            None => Ok(None),
        }
    }

    /// Get all configs for a tenant
    pub async fn get_tenant_configs(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<ProviderConfig>, LlmProviderError> {
        let rows = sqlx::query(
            r#"
            SELECT id, provider_id, api_endpoint, api_key_encrypted, model,
                   config_level, tenant_id, user_id, is_active, created_at, updated_at
            FROM provider_configs
            WHERE tenant_id = ? AND is_deleted = 0 AND is_active = 1
            "#,
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .context("failed to query tenant configs")
        .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?;

        Ok(rows.into_iter().map(map_config).collect())
    }

    /// Get all configs for a user
    pub async fn get_user_configs(
        &self,
        user_id: &str,
    ) -> Result<Vec<ProviderConfig>, LlmProviderError> {
        let rows = sqlx::query(
            r#"
            SELECT id, provider_id, api_endpoint, api_key_encrypted, model,
                   config_level, tenant_id, user_id, is_active, created_at, updated_at
            FROM provider_configs
            WHERE user_id = ? AND is_deleted = 0 AND is_active = 1
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .context("failed to query user configs")
        .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?;

        Ok(rows.into_iter().map(map_config).collect())
    }

    /// Get official config
    pub async fn get_official_config(
        &self,
        provider_type: &str,
    ) -> Result<Option<ProviderConfig>, LlmProviderError> {
        let row = sqlx::query(
            r#"
            SELECT id, provider_id, api_endpoint, api_key_encrypted, model,
                   config_level, tenant_id, user_id, is_active, created_at, updated_at
            FROM provider_configs
            WHERE config_level = 'official'
              AND provider_id = ?
              AND is_deleted = 0
              AND is_active = 1
            LIMIT 1
            "#,
        )
        .bind(provider_type)
        .fetch_optional(&self.pool)
        .await
        .context("failed to query official config")
        .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?;

        match row {
            Some(r) => Ok(Some(map_config(r))),
            None => Ok(None),
        }
    }

    /// Delete a config (soft delete)
    pub async fn delete_config(&self, id: &str) -> Result<bool, LlmProviderError> {
        let result = sqlx::query(
            r#"
            UPDATE provider_configs
            SET is_deleted = 1, updated_at = ?
            WHERE id = ? AND is_deleted = 0
            "#,
        )
        .bind(chrono::Utc::now().timestamp())
        .bind(id)
        .execute(&self.pool)
        .await
        .context("failed to delete config")
        .map_err(|e| LlmProviderError::InvalidConfig(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }
}

/// Map a database row to ProviderConfig
fn map_config(row: sqlx::sqlite::SqliteRow) -> ProviderConfig {
    let routing_config: Option<RoutingConfig> = row.get::<Option<String>, _>("routing_config")
        .and_then(|json| serde_json::from_str(&json).ok());

    ProviderConfig {
        id: row.get("id"),
        provider_type: row.get("provider_id"),
        api_endpoint: row.get("api_endpoint"),
        encrypted_api_key: row.get("api_key_encrypted"),
        model: row.get("model"),
        level: row.get("config_level"),
        tenant_id: row.get("tenant_id"),
        user_id: row.get("user_id"),
        is_active: row.get::<i32, _>("is_active") == 1,
        routing_config,
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}
