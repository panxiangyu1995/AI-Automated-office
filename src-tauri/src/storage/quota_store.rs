//! Quota Store
//!
//! SQLite-backed storage for API quota management.

use anyhow::{Context, Result};
use sqlx::{Row, SqlitePool};

use crate::agent::llm_provider::quota::{QuotaError, UsageRecord};

/// Quota store backed by SQLite
#[derive(Debug, Clone)]
pub struct QuotaStore {
    pool: SqlitePool,
}

impl QuotaStore {
    /// Create a new store with the given connection pool
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Record API usage
    pub async fn record_usage(&self, record: &UsageRecord) -> Result<(), QuotaError> {
        sqlx::query(
            r#"
            INSERT INTO api_usage_records (
                id, user_id, tenant_id, provider_id, session_id,
                request_type, prompt_tokens, completion_tokens, total_tokens,
                model, usage_recorded_at, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&record.id)
        .bind(&record.user_id)
        .bind(&record.tenant_id)
        .bind(&record.provider_type)
        .bind::<Option<String>>(None)
        .bind("chat")
        .bind(record.usage.prompt_tokens)
        .bind(record.usage.completion_tokens)
        .bind(record.usage.total_tokens)
        .bind(&record.model)
        .bind(record.timestamp)
        .bind::<Option<String>>(None)
        .bind(record.timestamp)
        .execute(&self.pool)
        .await
        .context("failed to record usage")
        .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        Ok(())
    }

    /// Get total usage for a provider within a time range
    pub async fn get_usage_in_period(
        &self,
        provider_id: &str,
        start_time: i64,
        end_time: i64,
    ) -> Result<i64, QuotaError> {
        let row = sqlx::query(
            r#"
            SELECT COALESCE(SUM(total_tokens), 0) as total
            FROM api_usage_records
            WHERE provider_id = ?
              AND usage_recorded_at >= ?
              AND usage_recorded_at < ?
            "#,
        )
        .bind(provider_id)
        .bind(start_time)
        .bind(end_time)
        .fetch_one(&self.pool)
        .await
        .context("failed to get usage")
        .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        let total: i64 = row.get("total");
        Ok(total)
    }

    /// Get usage by user in a period
    pub async fn get_user_usage_in_period(
        &self,
        user_id: &str,
        start_time: i64,
        end_time: i64,
    ) -> Result<i64, QuotaError> {
        let row = sqlx::query(
            r#"
            SELECT COALESCE(SUM(total_tokens), 0) as total
            FROM api_usage_records
            WHERE user_id = ?
              AND usage_recorded_at >= ?
              AND usage_recorded_at < ?
            "#,
        )
        .bind(user_id)
        .bind(start_time)
        .bind(end_time)
        .fetch_one(&self.pool)
        .await
        .context("failed to get user usage")
        .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        let total: i64 = row.get("total");
        Ok(total)
    }

    /// Get usage by tenant in a period
    pub async fn get_tenant_usage_in_period(
        &self,
        tenant_id: &str,
        start_time: i64,
        end_time: i64,
    ) -> Result<i64, QuotaError> {
        let row = sqlx::query(
            r#"
            SELECT COALESCE(SUM(total_tokens), 0) as total
            FROM api_usage_records
            WHERE tenant_id = ?
              AND usage_recorded_at >= ?
              AND usage_recorded_at < ?
            "#,
        )
        .bind(tenant_id)
        .bind(start_time)
        .bind(end_time)
        .fetch_one(&self.pool)
        .await
        .context("failed to get tenant usage")
        .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        let total: i64 = row.get("total");
        Ok(total)
    }

    /// Update platform quota used amount
    pub async fn update_quota_used(
        &self,
        provider_id: &str,
        used_tokens: i64,
    ) -> Result<(), QuotaError> {
        sqlx::query(
            r#"
            UPDATE platform_quotas
            SET used_tokens = used_tokens + ?,
                updated_at = ?
            WHERE provider_id = ?
            "#,
        )
        .bind(used_tokens)
        .bind(chrono::Utc::now().timestamp())
        .bind(provider_id)
        .execute(&self.pool)
        .await
        .context("failed to update quota")
        .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        Ok(())
    }

    /// Get platform quota
    pub async fn get_platform_quota(
        &self,
        provider_id: &str,
    ) -> Result<Option<PlatformQuota>, QuotaError> {
        let row = sqlx::query(
            r#"
            SELECT id, provider_id, quota_type, total_tokens, used_tokens,
                   reset_day, last_reset_at, created_at, updated_at
            FROM platform_quotas
            WHERE provider_id = ? AND is_deleted = 0
            "#,
        )
        .bind(provider_id)
        .fetch_optional(&self.pool)
        .await
        .context("failed to get quota")
        .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        match row {
            Some(r) => Ok(Some(map_quota(r))),
            None => Ok(None),
        }
    }

    /// Reset quota (for monthly reset)
    pub async fn reset_quota(
        &self,
        provider_id: &str,
        new_total: i64,
    ) -> Result<(), QuotaError> {
        let now = chrono::Utc::now().timestamp();
        sqlx::query(
            r#"
            UPDATE platform_quotas
            SET used_tokens = 0,
                total_tokens = ?,
                last_reset_at = ?,
                updated_at = ?
            WHERE provider_id = ?
            "#,
        )
        .bind(new_total)
        .bind(now)
        .bind(now)
        .bind(provider_id)
        .execute(&self.pool)
        .await
        .context("failed to reset quota")
        .map_err(|e| QuotaError::StorageError(e.to_string()))?;

        Ok(())
    }
}

/// Map a database row to PlatformQuota
fn map_quota(row: sqlx::sqlite::SqliteRow) -> PlatformQuota {
    PlatformQuota {
        id: row.get("id"),
        provider_id: row.get("provider_id"),
        quota_type: row.get("quota_type"),
        total_tokens: row.get("total_tokens"),
        used_tokens: row.get("used_tokens"),
        reset_day: row.get("reset_day"),
        last_reset_at: row.get("last_reset_at"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

/// Platform quota structure
#[derive(Debug, Clone)]
pub struct PlatformQuota {
    pub id: String,
    pub provider_id: String,
    pub quota_type: String,
    pub total_tokens: i64,
    pub used_tokens: i64,
    pub reset_day: i32,
    pub last_reset_at: i64,
    pub created_at: i64,
    pub updated_at: i64,
}
