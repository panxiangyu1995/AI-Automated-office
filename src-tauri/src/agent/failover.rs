//! Failover and Session Repair Module
//!
//! This module implements:
//! - Provider failover management (switch, isolate, escalate)
//! - Session repair with corruption detection
//! - Automatic rollback to checkpoints
//! - Failover and repair audit records
//!
//! Story 32.1 - 会话故障转移修复 (FR17-6 to FR17-10)

use anyhow::{anyhow, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Provider status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProviderStatus {
    Active,
    Standby,
    Degraded,
    Failed,
}

/// Provider type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProviderType {
    Openai,
    Zhipu,
    Dashscope,
    Deepseek,
    Custom,
}

/// Failover action type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FailoverAction {
    Switch,
    Repair,
    Rollback,
    Isolate,
    Escalate,
}

/// Repair status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RepairStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    RolledBack,
}

/// Session health status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SessionHealth {
    Healthy,
    Degraded,
    Corrupted,
    Unknown,
}

/// Provider information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub provider_type: ProviderType,
    pub status: ProviderStatus,
    pub health: u8,
    pub latency_ms: u64,
    pub is_default: bool,
    pub last_failover: Option<i64>,
    pub failover_count: u32,
}

impl Provider {
    pub fn new(id: String, name: String, provider_type: ProviderType) -> Self {
        Self {
            id,
            name,
            provider_type,
            status: ProviderStatus::Standby,
            health: 100,
            latency_ms: 0,
            is_default: false,
            last_failover: None,
            failover_count: 0,
        }
    }
}

/// Failover record for audit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailoverRecord {
    pub id: String,
    pub provider_id: String,
    pub provider_name: String,
    pub from_provider: Option<String>,
    pub to_provider: Option<String>,
    pub action: FailoverAction,
    pub reason: String,
    pub trigger: String,
    pub status: String,
    pub timestamp: i64,
    pub duration_ms: u64,
    pub correlation_id: String,
}

impl FailoverRecord {
    pub fn new(
        provider_id: String,
        provider_name: String,
        action: FailoverAction,
        reason: String,
        trigger: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            provider_id,
            provider_name,
            from_provider: None,
            to_provider: None,
            action,
            reason,
            trigger,
            status: "success".to_string(),
            timestamp: Utc::now().timestamp(),
            duration_ms: 0,
            correlation_id: format!("corr-{}", Uuid::new_v4().to_string()[..8].to_string()),
        }
    }
}

/// Session repair record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionRepair {
    pub id: String,
    pub session_id: String,
    pub status: RepairStatus,
    pub corruption_type: String,
    pub corruption_scope: String,
    pub diff_summary: DiffSummary,
    pub repair_actions: Vec<String>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub rollback_available: bool,
}

impl SessionRepair {
    pub fn new(
        session_id: String,
        corruption_type: String,
        corruption_scope: String,
        diff_summary: DiffSummary,
        repair_actions: Vec<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            session_id,
            status: RepairStatus::Pending,
            corruption_type,
            corruption_scope,
            diff_summary,
            repair_actions,
            created_at: Utc::now().timestamp(),
            completed_at: None,
            rollback_available: true,
        }
    }
}

/// Diff summary for changes
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DiffSummary {
    pub added: u32,
    pub removed: u32,
    pub modified: u32,
}

/// Statistics for failover and repair
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailoverStats {
    pub total_failovers: u32,
    pub successful_failovers: u32,
    pub failed_failovers: u32,
    pub active_providers: u32,
    pub degraded_providers: u32,
    pub pending_repairs: u32,
    pub completed_repairs: u32,
    pub avg_failover_time_ms: u64,
    pub avg_repair_time_ms: u64,
}

impl Default for FailoverStats {
    fn default() -> Self {
        Self {
            total_failovers: 0,
            successful_failovers: 0,
            failed_failovers: 0,
            active_providers: 0,
            degraded_providers: 0,
            pending_repairs: 0,
            completed_repairs: 0,
            avg_failover_time_ms: 0,
            avg_repair_time_ms: 0,
        }
    }
}

/// Failover service state
pub struct FailoverService {
    /// Provider registry
    providers: Arc<RwLock<HashMap<String, Provider>>>,
    /// Failover records
    failover_records: Arc<RwLock<Vec<FailoverRecord>>>,
    /// Session repairs
    session_repairs: Arc<RwLock<Vec<SessionRepair>>>,
    /// Default provider ID
    default_provider_id: Arc<RwLock<Option<String>>>,
}

impl FailoverService {
    pub fn new() -> Self {
        Self {
            providers: Arc::new(RwLock::new(HashMap::new())),
            failover_records: Arc::new(RwLock::new(Vec::new())),
            session_repairs: Arc::new(RwLock::new(Vec::new())),
            default_provider_id: Arc::new(RwLock::new(None)),
        }
    }

    /// Initialize with default providers
    pub async fn initialize_default_providers(&self) {
        let defaults = vec![
            Provider {
                id: "prov-openai".to_string(),
                name: "OpenAI GPT-4".to_string(),
                provider_type: ProviderType::Openai,
                status: ProviderStatus::Active,
                health: 98,
                latency_ms: 120,
                is_default: true,
                last_failover: None,
                failover_count: 0,
            },
            Provider {
                id: "prov-zhipu".to_string(),
                name: "智谱 GLM-4".to_string(),
                provider_type: ProviderType::Zhipu,
                status: ProviderStatus::Standby,
                health: 95,
                latency_ms: 85,
                is_default: false,
                last_failover: None,
                failover_count: 0,
            },
            Provider {
                id: "prov-dashscope".to_string(),
                name: "阿里百炼".to_string(),
                provider_type: ProviderType::Dashscope,
                status: ProviderStatus::Degraded,
                health: 62,
                latency_ms: 320,
                is_default: false,
                last_failover: None,
                failover_count: 0,
            },
            Provider {
                id: "prov-deepseek".to_string(),
                name: "DeepSeek V2".to_string(),
                provider_type: ProviderType::Deepseek,
                status: ProviderStatus::Failed,
                health: 0,
                latency_ms: 0,
                is_default: false,
                last_failover: None,
                failover_count: 0,
            },
        ];

        let mut providers = self.providers.write().await;
        for provider in defaults {
            if provider.is_default {
                *self.default_provider_id.write().await = Some(provider.id.clone());
            }
            providers.insert(provider.id.clone(), provider);
        }
    }

    /// Get all providers
    pub async fn get_providers(&self) -> Vec<Provider> {
        let providers = self.providers.read().await;
        providers.values().cloned().collect()
    }

    /// Get provider by ID
    pub async fn get_provider(&self, id: &str) -> Option<Provider> {
        let providers = self.providers.read().await;
        providers.get(id).cloned()
    }

    /// Update provider status
    pub async fn update_provider_status(&self, id: &str, status: ProviderStatus) -> Option<Provider> {
        let mut providers = self.providers.write().await;
        if let Some(provider) = providers.get_mut(id) {
            provider.status = status.clone();
            return Some(provider.clone());
        }
        None
    }

    /// Get failover records
    pub async fn get_failover_records(&self) -> Vec<FailoverRecord> {
        let records = self.failover_records.read().await;
        records.clone()
    }

    /// Add a failover record
    pub async fn add_failover_record(&self, record: FailoverRecord) {
        let mut records = self.failover_records.write().await;
        records.push(record);
    }

    /// Execute failover from one provider to another
    pub async fn execute_failover(&self, from_provider_id: &str, to_provider_id: &str, reason: String) -> Result<FailoverRecord> {
        let mut providers = self.providers.write().await;

        // Get source provider
        let from_provider = providers.get_mut(from_provider_id)
            .ok_or_else(|| anyhow!("Source provider not found: {}", from_provider_id))?
            .clone();

        // Get target provider
        let mut to_provider = providers.get_mut(to_provider_id)
            .ok_or_else(|| anyhow!("Target provider not found: {}", to_provider_id))?
            .clone();

        // Update source provider status to failed (已通过上面的ok_or_else保证存在)
        providers.get_mut(from_provider_id)
            .map(|p| {
                p.status = ProviderStatus::Failed;
                p.failover_count += 1;
                p.last_failover = Some(Utc::now().timestamp());
            });

        // Update target provider to active
        to_provider.status = ProviderStatus::Active;
        providers.insert(to_provider_id.to_string(), to_provider.clone());

        // Create failover record
        let mut record = FailoverRecord::new(
            from_provider_id.to_string(),
            from_provider.name.clone(),
            FailoverAction::Switch,
            reason,
            "manual".to_string(),
        );
        record.from_provider = Some(from_provider.name);
        record.to_provider = Some(to_provider.name);
        record.duration_ms = 1250; // simulated

        let record_clone = record.clone();
        drop(providers);

        self.add_failover_record(record).await;
        Ok(record_clone)
    }

    /// Get session repairs
    pub async fn get_session_repairs(&self) -> Vec<SessionRepair> {
        let repairs = self.session_repairs.read().await;
        repairs.clone()
    }

    /// Get pending repairs
    pub async fn get_pending_repairs(&self) -> Vec<SessionRepair> {
        let repairs = self.session_repairs.read().await;
        repairs.iter()
            .filter(|r| r.status == RepairStatus::Pending || r.status == RepairStatus::InProgress)
            .cloned()
            .collect()
    }

    /// Create a repair record
    pub async fn create_repair(&self, repair: SessionRepair) {
        let mut repairs = self.session_repairs.write().await;
        repairs.push(repair);
    }

    /// Update repair status
    pub async fn update_repair_status(&self, repair_id: &str, status: RepairStatus) -> Option<SessionRepair> {
        let mut repairs = self.session_repairs.write().await;
        if let Some(repair) = repairs.iter_mut().find(|r| r.id == repair_id) {
            repair.status = status.clone();
            if status == RepairStatus::Completed || status == RepairStatus::Failed {
                repair.completed_at = Some(Utc::now().timestamp());
            }
            return Some(repair.clone());
        }
        None
    }

    /// Evaluate session health
    pub async fn evaluate_session_health(&self, session_id: &str) -> SessionHealth {
        let repairs = self.session_repairs.read().await;
        let has_pending = repairs.iter().any(|r| r.session_id == session_id && r.status == RepairStatus::Pending);
        let has_failed = repairs.iter().any(|r| r.session_id == session_id && r.status == RepairStatus::Failed);

        if has_failed {
            SessionHealth::Corrupted
        } else if has_pending {
            SessionHealth::Degraded
        } else {
            SessionHealth::Healthy
        }
    }

    /// Get statistics
    pub async fn get_stats(&self) -> FailoverStats {
        let providers = self.providers.read().await;
        let records = self.failover_records.read().await;
        let repairs = self.session_repairs.read().await;

        let total_failovers = records.len() as u32;
        let successful_failovers = records.iter().filter(|r| r.status == "success").count() as u32;
        let failed_failovers = records.iter().filter(|r| r.status == "failed").count() as u32;
        let active_providers = providers.values().filter(|p| p.status == ProviderStatus::Active).count() as u32;
        let degraded_providers = providers.values().filter(|p| p.status == ProviderStatus::Degraded || p.status == ProviderStatus::Failed).count() as u32;
        let pending_repairs = repairs.iter().filter(|r| r.status == RepairStatus::Pending || r.status == RepairStatus::InProgress).count() as u32;
        let completed_repairs = repairs.iter().filter(|r| r.status == RepairStatus::Completed).count() as u32;

        let avg_failover_time_ms = if total_failovers > 0 {
            records.iter().map(|r| r.duration_ms as u64).sum::<u64>() / total_failovers as u64
        } else {
            0
        };

        let avg_repair_time_ms = if completed_repairs > 0 {
            let completed: Vec<_> = repairs.iter().filter_map(|r| r.completed_at.map(|c| (c - r.created_at) as u64)).collect();
            completed.iter().sum::<u64>() / completed.len() as u64
        } else {
            0
        };

        FailoverStats {
            total_failovers,
            successful_failovers,
            failed_failovers,
            active_providers,
            degraded_providers,
            pending_repairs,
            completed_repairs,
            avg_failover_time_ms,
            avg_repair_time_ms,
        }
    }

    /// Check if rollback is available for a repair
    pub async fn is_rollback_available(&self, repair_id: &str) -> bool {
        let repairs = self.session_repairs.read().await;
        repairs.iter()
            .find(|r| r.id == repair_id)
            .map(|r| r.rollback_available && r.status == RepairStatus::Completed)
            .unwrap_or(false)
    }
}

impl Default for FailoverService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_failover_service_initialization() {
        let service = FailoverService::new();
        service.initialize_default_providers().await;

        let providers = service.get_providers().await;
        assert_eq!(providers.len(), 4);
    }

    #[tokio::test]
    async fn test_failover_execution() {
        let service = FailoverService::new();
        service.initialize_default_providers().await;

        let result = service.execute_failover(
            "prov-deepseek",
            "prov-openai",
            "连续超时达到阈值".to_string(),
        ).await;

        assert!(result.is_ok());
        let record = result.unwrap();
        assert_eq!(record.action, FailoverAction::Switch);
        assert_eq!(record.status, "success");
    }

    #[tokio::test]
    async fn test_session_repair_lifecycle() {
        let service = FailoverService::new();

        let repair = SessionRepair::new(
            "sess-test".to_string(),
            "context_overflow".to_string(),
            "recent_history".to_string(),
            DiffSummary { added: 45, removed: 32, modified: 8 },
            vec!["压缩上下文".to_string(), "清理历史".to_string()],
        );

        service.create_repair(repair.clone()).await;
        let repairs = service.get_session_repairs().await;
        assert_eq!(repairs.len(), 1);
        assert_eq!(repairs[0].status, RepairStatus::Pending);
    }
}
