//! Quota Service with SQLite Backend
//!
//! Manages token quotas for platform official APIs.
//! User-configured APIs are only logged, not limited.

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::agent::llm_provider::quota::{QuotaError, TokenUsage, UsageRecord};
use crate::storage::quota_store::QuotaStore;

/// Quota service with SQLite backend
#[derive(Debug, Clone)]
pub struct SqliteQuotaService {
    store: Arc<RwLock<QuotaStore>>,
}

impl SqliteQuotaService {
    /// Create a new service with the given store
    pub fn new(store: QuotaStore) -> Self {
        Self {
            store: Arc::new(RwLock::new(store)),
        }
    }

    /// Check and consume quota for an official API call
    ///
    /// Returns error if quota is exceeded
    pub async fn check_and_consume(
        &self,
        tenant_id: &str,
        user_id: Option<&str>,
        provider_type: &str,
        model: &str,
        usage: &TokenUsage,
    ) -> Result<(), QuotaError> {
        let store = self.store.read().await;

        // Get current quota
        let quota = store
            .get_platform_quota(provider_type)
            .await
            .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        if let Some(quota) = quota {
            // Check if quota would be exceeded
            let new_usage = quota.used_tokens + usage.total_tokens as i64;
            if new_usage > quota.total_tokens {
                return Err(QuotaError::QuotaExceeded);
            }

            // Update quota
            store
                .update_quota_used(provider_type, usage.total_tokens as i64)
                .await
                .map_err(|e| QuotaError::StorageError(e.to_string()))?;
        }

        // Record usage
        let record = UsageRecord {
            id: uuid::Uuid::new_v4().to_string(),
            tenant_id: tenant_id.to_string(),
            user_id: user_id.map(String::from),
            provider_type: provider_type.to_string(),
            model: model.to_string(),
            usage: usage.clone(),
            timestamp: chrono::Utc::now().timestamp(),
            is_official: true,
        };

        store
            .record_usage(&record)
            .await
            .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        Ok(())
    }

    /// Record usage for user-configured APIs (logged only, no limits)
    pub async fn record_user_api_usage(
        &self,
        tenant_id: &str,
        user_id: Option<&str>,
        provider_type: &str,
        model: &str,
        usage: &TokenUsage,
    ) -> Result<(), QuotaError> {
        let store = self.store.read().await;

        let record = UsageRecord {
            id: uuid::Uuid::new_v4().to_string(),
            tenant_id: tenant_id.to_string(),
            user_id: user_id.map(String::from),
            provider_type: provider_type.to_string(),
            model: model.to_string(),
            usage: usage.clone(),
            timestamp: chrono::Utc::now().timestamp(),
            is_official: false,
        };

        store
            .record_usage(&record)
            .await
            .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        Ok(())
    }
}
