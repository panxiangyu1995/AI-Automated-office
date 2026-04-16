//! Self-healing module types for plugin runtime health and recovery.

use serde::{Deserialize, Serialize};

/// Plugin health status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PluginHealthStatus {
    /// Plugin is healthy and running normally
    Healthy,
    /// Plugin is running but experiencing issues
    Degraded,
    /// Plugin is unhealthy and needs attention
    Unhealthy,
    /// Plugin has been isolated due to repeated failures
    Isolated,
    /// Plugin has been disabled
    Disabled,
}

impl Default for PluginHealthStatus {
    fn default() -> Self {
        PluginHealthStatus::Healthy
    }
}

/// Fault severity level
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FaultSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Isolation reason for a plugin
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum IsolationReason {
    RepeatedFailure,
    FaultThreshold,
    Manual,
    CircuitBreaker,
}

/// Recovery action taken for a plugin
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RecoveryAction {
    Retry,
    Restart,
    Downgrade,
    Isolate,
    Failover,
    Disable,
}

/// Diagnostic level for entries
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticLevel {
    Info,
    Warning,
    Error,
    Critical,
}

/// Plugin health signal containing current health state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginHealthSignal {
    /// Unique signal ID
    pub id: String,
    /// Plugin ID
    pub plugin_id: String,
    /// Plugin name
    pub plugin_name: String,
    /// Current health status
    pub status: PluginHealthStatus,
    /// Fault rate percentage
    pub fault_rate: f64,
    /// Total fault count
    pub fault_count: u64,
    /// Last fault timestamp (ISO 8601)
    pub last_fault_time: Option<String>,
    /// Last health check timestamp (ISO 8601)
    pub last_check_time: String,
    /// Consecutive failure count
    pub consecutive_failures: u32,
    /// Isolation reason if isolated
    pub isolation_reason: Option<IsolationReason>,
    /// Whether auto-disable is enabled
    pub auto_disable_enabled: bool,
    /// Whether plugin was auto-disabled
    pub is_auto_disabled: bool,
    /// Number of successful recoveries
    pub recovery_count: u32,
    /// Uptime percentage
    pub uptime_secs: u64,
    /// Memory usage percentage (0-100)
    pub memory_usage: u8,
    /// CPU usage percentage (0-100)
    pub cpu_usage: u8,
}

impl Default for PluginHealthSignal {
    fn default() -> Self {
        Self {
            id: uuid_simple(),
            plugin_id: String::new(),
            plugin_name: String::new(),
            status: PluginHealthStatus::Healthy,
            fault_rate: 0.0,
            fault_count: 0,
            last_fault_time: None,
            last_check_time: chrono_now(),
            consecutive_failures: 0,
            isolation_reason: None,
            auto_disable_enabled: true,
            is_auto_disabled: false,
            recovery_count: 0,
            uptime_secs: 0,
            memory_usage: 0,
            cpu_usage: 0,
        }
    }
}

/// Fault record for tracking plugin failures
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FaultRecord {
    pub id: String,
    pub plugin_id: String,
    pub plugin_name: String,
    pub severity: FaultSeverity,
    pub error_code: String,
    pub error_message: String,
    pub timestamp: String,
    pub recoverable: bool,
}

/// Diagnostic entry for plugin issues
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticEntry {
    pub id: String,
    pub plugin_id: String,
    pub plugin_name: String,
    pub level: DiagnosticLevel,
    pub code: String,
    pub message: String,
    pub timestamp: String,
    pub actionable: bool,
    pub action_taken: Option<RecoveryAction>,
}

/// Recovery event for tracking recovery actions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryEvent {
    pub id: String,
    pub plugin_id: String,
    pub plugin_name: String,
    pub action: RecoveryAction,
    pub triggered_by: TriggeredBy,
    pub status: RecoveryStatus,
    pub timestamp: String,
    pub error_message: Option<String>,
    pub diagnostic_ref: Option<String>,
}

/// What triggered the recovery action
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TriggeredBy {
    Auto,
    Manual,
}

/// Recovery action status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RecoveryStatus {
    Pending,
    Executing,
    Success,
    Failed,
}

/// Self-healing statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelfHealingStats {
    pub total_plugins: usize,
    pub healthy_plugins: usize,
    pub degraded_plugins: usize,
    pub unhealthy_plugins: usize,
    pub isolated_plugins: usize,
    pub disabled_plugins: usize,
    pub auto_disabled_count: usize,
    pub total_recoveries: usize,
    pub failed_recoveries: usize,
}

/// Health check configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckConfig {
    /// Enable health monitoring
    pub enabled: bool,
    /// Check interval in seconds
    pub check_interval_secs: u64,
    /// Fault rate threshold for degraded status (%)
    pub fault_rate_threshold_degraded: f64,
    /// Fault rate threshold for unhealthy status (%)
    pub fault_rate_threshold_unhealthy: f64,
    /// Consecutive failure threshold for isolation
    pub isolation_threshold: u32,
    /// Max restart attempts before disabling
    pub max_restart_attempts: u32,
    /// Enable auto-disable
    pub auto_disable_enabled: bool,
}

impl Default for HealthCheckConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            check_interval_secs: 30,
            fault_rate_threshold_degraded: 5.0,
            fault_rate_threshold_unhealthy: 10.0,
            isolation_threshold: 10,
            max_restart_attempts: 5,
            auto_disable_enabled: true,
        }
    }
}

/// Plugin health check result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResult {
    pub plugin_id: String,
    pub status: PluginHealthStatus,
    pub fault_rate: f64,
    pub consecutive_failures: u32,
    pub should_isolate: bool,
    pub should_restart: bool,
    pub should_disable: bool,
    pub diagnostic: Option<DiagnosticEntry>,
}

// Helper functions

/// Generate a simple UUID-like string
pub fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let nanos = duration.as_nanos();
    format!("{:x}-{:x}", nanos >> 64, nanos & 0xffffffffffffffff)
}

/// Get current timestamp in ISO format
pub fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    format!("2026-04-09T{:02}:{:02}:{:02}Z",
        (secs / 3600) % 24,
        (secs / 60) % 60,
        secs % 60)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_status_default() {
        let status = PluginHealthStatus::default();
        assert_eq!(status, PluginHealthStatus::Healthy);
    }

    #[test]
    fn test_uuid_simple() {
        let id1 = uuid_simple();
        let id2 = uuid_simple();
        assert_ne!(id1, id2);
        assert!(id1.contains('-'));
    }

    #[test]
    fn test_chrono_now() {
        let now = chrono_now();
        assert!(now.starts_with("2026-04-09T"));
        assert!(now.ends_with("Z"));
    }
}
