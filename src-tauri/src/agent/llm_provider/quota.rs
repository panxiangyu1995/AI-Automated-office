//! Quota Service for LLM API Usage Management
//!
//! Manages token quotas for platform official APIs.
//! User-configured APIs are only logged, not limited.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Quota error types
#[derive(Debug, thiserror::Error)]
pub enum QuotaError {
    #[error("Quota exceeded")]
    QuotaExceeded,

    #[error("Quota not found")]
    QuotaNotFound,

    #[error("Invalid quota configuration")]
    InvalidConfig(String),

    #[error("Storage error: {0}")]
    StorageError(String),
}

/// Token usage record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    /// Tokens used in the prompt
    pub prompt_tokens: i32,
    /// Tokens generated in the completion
    pub completion_tokens: i32,
    /// Total tokens used
    pub total_tokens: i32,
}

/// Quota configuration for a tenant
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaConfig {
    /// Monthly token quota
    pub monthly_quota: i64,
    /// Current usage this month
    pub current_usage: i64,
    /// Last reset timestamp
    pub last_reset: i64,
    /// Whether quota is enabled
    pub enabled: bool,
}

impl Default for QuotaConfig {
    fn default() -> Self {
        Self {
            monthly_quota: 1_000_000, // 1M tokens default
            current_usage: 0,
            last_reset: chrono::Utc::now().timestamp(),
            enabled: true,
        }
    }
}

/// Usage record for user APIs (logged but not limited)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageRecord {
    /// Record ID
    pub id: String,
    /// Tenant ID
    pub tenant_id: String,
    /// User ID (optional)
    pub user_id: Option<String>,
    /// Provider type
    pub provider_type: String,
    /// Model used
    pub model: String,
    /// Token usage
    pub usage: TokenUsage,
    /// Timestamp
    pub timestamp: i64,
    /// Whether this was an official API call
    pub is_official: bool,
}

/// In-memory quota store
/// In production, this would be backed by SQLite
#[derive(Debug, Default)]
pub struct QuotaStore {
    /// Tenant quotas: tenant_id -> QuotaConfig
    quotas: HashMap<String, QuotaConfig>,
    /// Usage records: tenant_id -> Vec<UsageRecord>
    usage_records: HashMap<String, Vec<UsageRecord>>,
}

/// Quota service for managing API quotas
#[derive(Debug, Clone)]
pub struct QuotaService {
    store: Arc<RwLock<QuotaStore>>,
}

impl QuotaService {
    /// Create a new QuotaService
    pub fn new() -> Self {
        Self {
            store: Arc::new(RwLock::new(QuotaStore::default())),
        }
    }

    /// Set quota for a tenant
    pub async fn set_quota(&self, tenant_id: &str, monthly_quota: i64) -> Result<(), QuotaError> {
        let mut store = self.store.write().await;

        let config = store.quotas.entry(tenant_id.to_string()).or_default();
        config.monthly_quota = monthly_quota;

        Ok(())
    }

    /// Get quota for a tenant
    pub async fn get_quota(&self, tenant_id: &str) -> Result<QuotaConfig, QuotaError> {
        let store = self.store.read().await;

        store
            .quotas
            .get(tenant_id)
            .cloned()
            .ok_or(QuotaError::QuotaNotFound)
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
        let mut store = self.store.write().await;

        // Check if we need to reset (new month)
        let now = chrono::Utc::now().timestamp();
        let month_start = Self::get_month_start_timestamp(now);

        let config = store.quotas.entry(tenant_id.to_string()).or_default();

        // Reset if new month
        if config.last_reset < month_start {
            config.current_usage = 0;
            config.last_reset = now;
        }

        // Check if quota is enabled and would be exceeded
        if config.enabled {
            let new_usage = config.current_usage + usage.total_tokens as i64;
            if new_usage > config.monthly_quota {
                return Err(QuotaError::QuotaExceeded);
            }
            config.current_usage = new_usage;
        }

        // Record usage
        let record = UsageRecord {
            id: uuid::Uuid::new_v4().to_string(),
            tenant_id: tenant_id.to_string(),
            user_id: user_id.map(String::from),
            provider_type: provider_type.to_string(),
            model: model.to_string(),
            usage: usage.clone(),
            timestamp: now,
            is_official: true,
        };

        store
            .usage_records
            .entry(tenant_id.to_string())
            .or_default()
            .push(record);

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
        let mut store = self.store.write().await;

        let now = chrono::Utc::now().timestamp();

        let record = UsageRecord {
            id: uuid::Uuid::new_v4().to_string(),
            tenant_id: tenant_id.to_string(),
            user_id: user_id.map(String::from),
            provider_type: provider_type.to_string(),
            model: model.to_string(),
            usage: usage.clone(),
            timestamp: now,
            is_official: false, // User-configured API
        };

        store
            .usage_records
            .entry(tenant_id.to_string())
            .or_default()
            .push(record);

        Ok(())
    }

    /// Get usage records for a tenant
    pub async fn get_usage_records(
        &self,
        tenant_id: &str,
        limit: Option<usize>,
    ) -> Result<Vec<UsageRecord>, QuotaError> {
        let store = self.store.read().await;

        let mut records = store
            .usage_records
            .get(tenant_id)
            .cloned()
            .unwrap_or_default();

        // Sort by timestamp descending
        records.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        if let Some(limit) = limit {
            records.truncate(limit);
        }

        Ok(records)
    }

    /// Get current usage stats for a tenant
    pub async fn get_usage_stats(
        &self,
        tenant_id: &str,
    ) -> Result<UsageStats, QuotaError> {
        let store = self.store.read().await;

        let config = store
            .quotas
            .get(tenant_id)
            .cloned()
            .unwrap_or_default();

        let records = store
            .usage_records
            .get(tenant_id)
            .cloned()
            .unwrap_or_default();

        let total_tokens: i64 = records.iter().map(|r| r.usage.total_tokens as i64).sum();
        let official_tokens: i64 = records
            .iter()
            .filter(|r| r.is_official)
            .map(|r| r.usage.total_tokens as i64)
            .sum();
        let user_tokens: i64 = records
            .iter()
            .filter(|r| !r.is_official)
            .map(|r| r.usage.total_tokens as i64)
            .sum();

        Ok(UsageStats {
            monthly_quota: config.monthly_quota,
            current_usage: config.current_usage,
            total_usage: total_tokens,
            official_usage: official_tokens,
            user_usage: user_tokens,
            last_reset: config.last_reset,
        })
    }

    /// Reset quota for a tenant
    pub async fn reset_quota(&self, tenant_id: &str) -> Result<(), QuotaError> {
        let mut store = self.store.write().await;

        if let Some(config) = store.quotas.get_mut(tenant_id) {
            config.current_usage = 0;
            config.last_reset = chrono::Utc::now().timestamp();
        }

        Ok(())
    }

    /// Get the start of the current month timestamp
    fn get_month_start_timestamp(now: i64) -> i64 {
        use chrono::{Datelike, TimeZone, Utc};

        let dt = Utc.timestamp_opt(now, 0).single().unwrap_or_default();
        let month_start = Utc.with_ymd_and_hms(dt.year(), dt.month(), 1, 0, 0, 0).single();
        month_start.unwrap_or_default().timestamp()
    }
}

impl Default for QuotaService {
    fn default() -> Self {
        Self::new()
    }
}

/// Usage statistics for a tenant
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    /// Monthly quota limit
    pub monthly_quota: i64,
    /// Current usage this month
    pub current_usage: i64,
    /// Total usage ever recorded
    pub total_usage: i64,
    /// Usage via official APIs
    pub official_usage: i64,
    /// Usage via user-configured APIs
    pub user_usage: i64,
    /// Last reset timestamp
    pub last_reset: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_set_and_get_quota() {
        let service = QuotaService::new();

        service.set_quota("tenant-1", 500_000).await.unwrap();

        let quota = service.get_quota("tenant-1").await.unwrap();
        assert_eq!(quota.monthly_quota, 500_000);
    }

    #[tokio::test]
    async fn test_quota_exceeded() {
        let service = QuotaService::new();

        // Set a very low quota
        service.set_quota("tenant-1", 100).await.unwrap();

        let usage = TokenUsage {
            prompt_tokens: 50,
            completion_tokens: 60,
            total_tokens: 110,
        };

        let result = service
            .check_and_consume("tenant-1", None, "zhipu", "glm-4", &usage)
            .await;

        assert!(matches!(result, Err(QuotaError::QuotaExceeded)));
    }

    #[tokio::test]
    async fn test_quota_consumption() {
        let service = QuotaService::new();

        // Set quota of 1000 tokens
        service.set_quota("tenant-1", 1000).await.unwrap();

        let usage1 = TokenUsage {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300,
        };

        // First call should succeed
        service
            .check_and_consume("tenant-1", None, "zhipu", "glm-4", &usage1)
            .await
            .unwrap();

        let usage2 = TokenUsage {
            prompt_tokens: 100,
            completion_tokens: 600,
            total_tokens: 700,
        };

        // Second call should fail (would exceed 1000)
        let result = service
            .check_and_consume("tenant-1", None, "zhipu", "glm-4", &usage2)
            .await;

        assert!(matches!(result, Err(QuotaError::QuotaExceeded)));
    }

    #[tokio::test]
    async fn test_record_user_api_usage() {
        let service = QuotaService::new();

        let usage = TokenUsage {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300,
        };

        // Should always succeed (user APIs are logged but not limited)
        service
            .record_user_api_usage("tenant-1", Some("user-1"), "openai", "gpt-4", &usage)
            .await
            .unwrap();

        let records = service.get_usage_records("tenant-1", None).await.unwrap();
        assert_eq!(records.len(), 1);
        assert!(!records[0].is_official);
    }

    #[tokio::test]
    async fn test_usage_stats() {
        let service = QuotaService::new();

        service.set_quota("tenant-1", 1_000_000).await.unwrap();

        let usage1 = TokenUsage {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300,
        };

        service
            .check_and_consume("tenant-1", None, "zhipu", "glm-4", &usage1)
            .await
            .unwrap();

        let usage2 = TokenUsage {
            prompt_tokens: 50,
            completion_tokens: 50,
            total_tokens: 100,
        };

        service
            .record_user_api_usage("tenant-1", Some("user-1"), "openai", "gpt-4", &usage2)
            .await
            .unwrap();

        let stats = service.get_usage_stats("tenant-1").await.unwrap();
        assert_eq!(stats.official_usage, 300);
        assert_eq!(stats.user_usage, 100);
        assert_eq!(stats.total_usage, 400);
    }
}
