//! Tenant 模块数据类型

use serde::{Deserialize, Serialize};

pub use super::errors::TenantError;
pub use super::repository::{
    TenantRepository, TenantConfigRepository,
    SqliteTenantRepository, SqliteTenantConfigRepository,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tenant {
    pub id: String,
    pub name: String,
    pub code: String,
    pub plan: TenantPlan,
    pub max_users: i32,
    pub max_storage: i64,
    pub features: Vec<String>,
    pub created_at: i64,
    pub status: TenantStatus,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TenantPlan { Free, Starter, Business, Enterprise }
impl Default for TenantPlan { fn default() -> Self { Self::Free } }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TenantStatus { Active, Suspended, Trial }
impl Default for TenantStatus { fn default() -> Self { Self::Active } }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantConfig {
    pub tenant_id: String,
    pub feature_flags: FeatureFlags,
    pub rate_limit: RateLimit,
    pub storage_usage: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeatureFlags {
    pub hr_enabled: bool,
    pub finance_enabled: bool,
    pub sales_enabled: bool,
    pub warehouse_enabled: bool,
    pub approval_enabled: bool,
    pub knowledge_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RateLimit {
    pub requests_per_minute: i32,
    pub requests_per_hour: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenantStats {
    pub tenant_count: i64,
    pub active_tenants: i64,
    pub trial_tenants: i64,
}

impl Tenant {
    pub fn new_default() -> Self {
        Self {
            id: "tenant-001".to_string(),
            name: "示例企业".to_string(),
            code: "demo".to_string(),
            plan: TenantPlan::Business,
            max_users: 100,
            max_storage: 10 * 1024 * 1024 * 1024,
            features: vec!["hr".to_string(), "finance".to_string(), "sales".to_string(), "warehouse".to_string(), "approval".to_string()],
            created_at: chrono::Utc::now().timestamp(),
            status: TenantStatus::Active,
        }
    }
}

impl Default for TenantConfig {
    fn default() -> Self {
        Self {
            tenant_id: "tenant-001".to_string(),
            feature_flags: FeatureFlags {
                hr_enabled: true,
                finance_enabled: true,
                sales_enabled: true,
                warehouse_enabled: true,
                approval_enabled: true,
                knowledge_enabled: false,
            },
            rate_limit: RateLimit { requests_per_minute: 60, requests_per_hour: 1000 },
            storage_usage: 0,
        }
    }
}
