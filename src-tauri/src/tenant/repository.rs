//! Tenant Repository - Data access abstraction for multi-tenant support
//!
//! This module provides Repository pattern for tenant data access,
//! enabling dependency injection and testability.

use async_trait::async_trait;
use sqlx::{FromRow, SqlitePool};

use super::types::{FeatureFlags, RateLimit, Tenant, TenantConfig, TenantPlan, TenantStatus};
use super::errors::TenantError;

/// Helper to convert TenantPlan to string
pub fn plan_to_str(plan: &TenantPlan) -> &'static str {
    match plan {
        TenantPlan::Free => "free",
        TenantPlan::Starter => "starter",
        TenantPlan::Business => "business",
        TenantPlan::Enterprise => "enterprise",
    }
}

/// Helper to convert string to TenantPlan
pub fn str_to_plan(s: &str) -> TenantPlan {
    match s {
        "starter" => TenantPlan::Starter,
        "business" => TenantPlan::Business,
        "enterprise" => TenantPlan::Enterprise,
        _ => TenantPlan::Free,
    }
}

/// Helper to convert TenantStatus to string
pub fn status_to_str(status: &TenantStatus) -> &'static str {
    match status {
        TenantStatus::Active => "active",
        TenantStatus::Suspended => "suspended",
        TenantStatus::Trial => "trial",
    }
}

/// Helper to convert string to TenantStatus
pub fn str_to_status(s: &str) -> TenantStatus {
    match s {
        "suspended" => TenantStatus::Suspended,
        "trial" => TenantStatus::Trial,
        _ => TenantStatus::Active,
    }
}

// ============================================================================
// Repository Traits
// ============================================================================

/// Repository trait for tenant data access
#[async_trait]
pub trait TenantRepository: Send + Sync {
    async fn get_by_id(&self, id: &str) -> Result<Option<Tenant>, TenantError>;
    async fn get_by_code(&self, code: &str) -> Result<Option<Tenant>, TenantError>;
    async fn list(&self) -> Result<Vec<Tenant>, TenantError>;
    async fn create(&self, tenant: &Tenant) -> Result<(), TenantError>;
    async fn update(&self, tenant: &Tenant) -> Result<(), TenantError>;
    async fn delete(&self, id: &str) -> Result<(), TenantError>;
    async fn count(&self) -> Result<TenantStatsData, TenantError>;
}

/// Repository trait for tenant config data access
#[async_trait]
pub trait TenantConfigRepository: Send + Sync {
    async fn get_by_tenant_id(&self, tenant_id: &str) -> Result<Option<TenantConfig>, TenantError>;
    async fn upsert(&self, config: &TenantConfig) -> Result<(), TenantError>;
}

// ============================================================================
// Database Row Types
// ============================================================================

#[derive(Debug, FromRow)]
struct TenantRow {
    id: String,
    name: String,
    code: String,
    plan: String,
    max_users: i32,
    max_storage: i64,
    features: Option<String>,
    status: String,
    created_at: i64,
    updated_at: i64,
}

impl From<TenantRow> for Tenant {
    fn from(row: TenantRow) -> Self {
        let features: Vec<String> = row
            .features
            .and_then(|f| serde_json::from_str(&f).ok())
            .unwrap_or_default();
        
        Tenant {
            id: row.id,
            name: row.name,
            code: row.code,
            plan: str_to_plan(&row.plan),
            max_users: row.max_users,
            max_storage: row.max_storage,
            features,
            status: str_to_status(&row.status),
            created_at: row.created_at,
        }
    }
}

#[derive(Debug, FromRow)]
struct TenantConfigRow {
    tenant_id: String,
    feature_flags: Option<String>,
    rate_limit: Option<String>,
    storage_usage: i64,
    updated_at: i64,
}

impl From<TenantConfigRow> for TenantConfig {
    fn from(row: TenantConfigRow) -> Self {
        let feature_flags: FeatureFlags = row
            .feature_flags
            .and_then(|f| serde_json::from_str(&f).ok())
            .unwrap_or(FeatureFlags {
                hr_enabled: false,
                finance_enabled: false,
                sales_enabled: false,
                warehouse_enabled: false,
                approval_enabled: false,
                knowledge_enabled: false,
            });
        
        let rate_limit: RateLimit = row
            .rate_limit
            .and_then(|r| serde_json::from_str(&r).ok())
            .unwrap_or(RateLimit {
                requests_per_minute: 60,
                requests_per_hour: 1000,
            });
        
        TenantConfig {
            tenant_id: row.tenant_id,
            feature_flags,
            rate_limit,
            storage_usage: row.storage_usage,
        }
    }
}

#[derive(Debug, FromRow)]
struct TenantStatsRow {
    total: Option<i64>,
    active: Option<i64>,
    trial: Option<i64>,
}

/// Tenant statistics data structure
#[derive(Debug, Clone)]
pub struct TenantStatsData {
    pub tenant_count: i64,
    pub active_tenants: i64,
    pub trial_tenants: i64,
}

impl From<TenantStatsRow> for TenantStatsData {
    fn from(row: TenantStatsRow) -> Self {
        TenantStatsData {
            tenant_count: row.total.unwrap_or(0),
            active_tenants: row.active.unwrap_or(0),
            trial_tenants: row.trial.unwrap_or(0),
        }
    }
}

// ============================================================================
// SqliteTenantRepository Implementation
// ============================================================================

/// SQLite implementation of TenantRepository
pub struct SqliteTenantRepository {
    pool: SqlitePool,
}

impl SqliteTenantRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TenantRepository for SqliteTenantRepository {
    async fn get_by_id(&self, id: &str) -> Result<Option<Tenant>, TenantError> {
        let row: Option<TenantRow> = sqlx::query_as(
            "SELECT id, name, code, plan, max_users, max_storage, features, status, created_at, updated_at FROM tenants WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(row.map(Tenant::from))
    }
    
    async fn get_by_code(&self, code: &str) -> Result<Option<Tenant>, TenantError> {
        let row: Option<TenantRow> = sqlx::query_as(
            "SELECT id, name, code, plan, max_users, max_storage, features, status, created_at, updated_at FROM tenants WHERE code = ?"
        )
        .bind(code)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(row.map(Tenant::from))
    }
    
    async fn list(&self) -> Result<Vec<Tenant>, TenantError> {
        let rows: Vec<TenantRow> = sqlx::query_as(
            "SELECT id, name, code, plan, max_users, max_storage, features, status, created_at, updated_at FROM tenants ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(rows.into_iter().map(Tenant::from).collect())
    }
    
    async fn create(&self, tenant: &Tenant) -> Result<(), TenantError> {
        let features_json = serde_json::to_string(&tenant.features)
            .map_err(|e| TenantError::InvalidData(e.to_string()))?;
        
        sqlx::query(
            r#"INSERT INTO tenants (id, name, code, plan, max_users, max_storage, features, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&tenant.id)
        .bind(&tenant.name)
        .bind(&tenant.code)
        .bind(plan_to_str(&tenant.plan))
        .bind(tenant.max_users)
        .bind(tenant.max_storage)
        .bind(&features_json)
        .bind(status_to_str(&tenant.status))
        .bind(tenant.created_at)
        .bind(tenant.created_at)
        .execute(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(())
    }
    
    async fn update(&self, tenant: &Tenant) -> Result<(), TenantError> {
        let features_json = serde_json::to_string(&tenant.features)
            .map_err(|e| TenantError::InvalidData(e.to_string()))?;
        let now = chrono::Utc::now().timestamp();
        
        sqlx::query(
            r#"UPDATE tenants SET name = ?, code = ?, plan = ?, max_users = ?, max_storage = ?, features = ?, status = ?, updated_at = ?
               WHERE id = ?"#
        )
        .bind(&tenant.name)
        .bind(&tenant.code)
        .bind(plan_to_str(&tenant.plan))
        .bind(tenant.max_users)
        .bind(tenant.max_storage)
        .bind(&features_json)
        .bind(status_to_str(&tenant.status))
        .bind(now)
        .bind(&tenant.id)
        .execute(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(())
    }
    
    async fn delete(&self, id: &str) -> Result<(), TenantError> {
        sqlx::query("DELETE FROM tenants WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(())
    }
    
    async fn count(&self) -> Result<TenantStatsData, TenantError> {
        let row: TenantStatsRow = sqlx::query_as(
            r#"SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial
               FROM tenants"#
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;

        Ok(row.into())
    }
}

// ============================================================================
// SqliteTenantConfigRepository Implementation
// ============================================================================

/// SQLite implementation of TenantConfigRepository
pub struct SqliteTenantConfigRepository {
    pool: SqlitePool,
}

impl SqliteTenantConfigRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TenantConfigRepository for SqliteTenantConfigRepository {
    async fn get_by_tenant_id(&self, tenant_id: &str) -> Result<Option<TenantConfig>, TenantError> {
        let row: Option<TenantConfigRow> = sqlx::query_as(
            "SELECT tenant_id, feature_flags, rate_limit, storage_usage, updated_at FROM tenant_configs WHERE tenant_id = ?"
        )
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(row.map(TenantConfig::from))
    }
    
    async fn upsert(&self, config: &TenantConfig) -> Result<(), TenantError> {
        let feature_flags_json = serde_json::to_string(&config.feature_flags)
            .map_err(|e| TenantError::InvalidData(e.to_string()))?;
        let rate_limit_json = serde_json::to_string(&config.rate_limit)
            .map_err(|e| TenantError::InvalidData(e.to_string()))?;
        let now = chrono::Utc::now().timestamp();
        
        sqlx::query(
            r#"INSERT INTO tenant_configs (tenant_id, feature_flags, rate_limit, storage_usage, updated_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(tenant_id) DO UPDATE SET
                   feature_flags = excluded.feature_flags,
                   rate_limit = excluded.rate_limit,
                   storage_usage = excluded.storage_usage,
                   updated_at = excluded.updated_at"#
        )
        .bind(&config.tenant_id)
        .bind(&feature_flags_json)
        .bind(&rate_limit_json)
        .bind(config.storage_usage)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| TenantError::Database(e.to_string()))?;
        
        Ok(())
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_tenant() -> Tenant {
        Tenant {
            id: "test-tenant-1".to_string(),
            name: "Test Company".to_string(),
            code: "test".to_string(),
            plan: TenantPlan::Business,
            max_users: 50,
            max_storage: 5 * 1024 * 1024 * 1024,
            features: vec!["hr".to_string(), "finance".to_string()],
            created_at: chrono::Utc::now().timestamp(),
            status: TenantStatus::Active,
        }
    }

    fn create_test_config() -> TenantConfig {
        TenantConfig {
            tenant_id: "test-tenant-1".to_string(),
            feature_flags: FeatureFlags {
                hr_enabled: true,
                finance_enabled: true,
                sales_enabled: false,
                warehouse_enabled: false,
                approval_enabled: true,
                knowledge_enabled: false,
            },
            rate_limit: RateLimit {
                requests_per_minute: 100,
                requests_per_hour: 2000,
            },
            storage_usage: 0,
        }
    }

    #[tokio::test]
    async fn test_plan_conversion() {
        assert_eq!(plan_to_str(&TenantPlan::Free), "free");
        assert_eq!(plan_to_str(&TenantPlan::Business), "business");
        assert_eq!(str_to_plan("business"), TenantPlan::Business);
        assert_eq!(str_to_plan("unknown"), TenantPlan::Free);
    }

    #[tokio::test]
    async fn test_status_conversion() {
        assert_eq!(status_to_str(&TenantStatus::Active), "active");
        assert_eq!(status_to_str(&TenantStatus::Trial), "trial");
        assert_eq!(str_to_status("trial"), TenantStatus::Trial);
        assert_eq!(str_to_status("unknown"), TenantStatus::Active);
    }

    #[tokio::test]
    async fn test_tenant_repository_crud() {
        use sqlx::sqlite::SqlitePoolOptions;

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create test pool");

        // Create tables
        sqlx::query(
            r#"CREATE TABLE IF NOT EXISTS tenants (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                plan TEXT NOT NULL DEFAULT 'free',
                max_users INTEGER NOT NULL DEFAULT 10,
                max_storage INTEGER NOT NULL DEFAULT 1073741824,
                features TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )"#
        )
        .execute(&pool)
        .await
        .expect("Failed to create tenants table");

        let repo = SqliteTenantRepository::new(pool);
        let tenant = create_test_tenant();

        // Create
        repo.create(&tenant).await.expect("Failed to create tenant");

        // Read by id
        let found = repo.get_by_id("test-tenant-1").await.expect("Failed to get by id");
        assert!(found.is_some());
        assert_eq!(found.unwrap().name, "Test Company");

        // Read by code
        let found = repo.get_by_code("test").await.expect("Failed to get by code");
        assert!(found.is_some());

        // List
        let list = repo.list().await.expect("Failed to list");
        assert_eq!(list.len(), 1);

        // Count
        let stats = repo.count().await.expect("Failed to count");
        assert_eq!(stats.tenant_count, 1);
        assert_eq!(stats.active_tenants, 1);

        // Update
        let mut updated = tenant.clone();
        updated.name = "Updated Company".to_string();
        repo.update(&updated).await.expect("Failed to update");

        let found = repo.get_by_id("test-tenant-1").await.expect("Failed to get after update");
        assert_eq!(found.unwrap().name, "Updated Company");

        // Delete
        repo.delete("test-tenant-1").await.expect("Failed to delete");

        let found = repo.get_by_id("test-tenant-1").await.expect("Failed to get after delete");
        assert!(found.is_none());
    }

    #[tokio::test]
    async fn test_tenant_config_repository() {
        use sqlx::sqlite::SqlitePoolOptions;

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create test pool");

        // Create tables
        sqlx::query(
            r#"CREATE TABLE IF NOT EXISTS tenant_configs (
                tenant_id TEXT PRIMARY KEY,
                feature_flags TEXT NOT NULL,
                rate_limit TEXT NOT NULL,
                storage_usage INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL
            )"#
        )
        .execute(&pool)
        .await
        .expect("Failed to create tenant_configs table");

        let repo = SqliteTenantConfigRepository::new(pool);
        let config = create_test_config();

        // Upsert (insert)
        repo.upsert(&config).await.expect("Failed to upsert config");

        // Get
        let found = repo.get_by_tenant_id("test-tenant-1").await.expect("Failed to get config");
        assert!(found.is_some());
        assert_eq!(found.unwrap().tenant_id, "test-tenant-1");

        // Upsert (update)
        let mut updated = config.clone();
        updated.storage_usage = 1024;
        repo.upsert(&updated).await.expect("Failed to update config");

        let found = repo.get_by_tenant_id("test-tenant-1").await.expect("Failed to get updated config");
        assert_eq!(found.unwrap().storage_usage, 1024);
    }
}
