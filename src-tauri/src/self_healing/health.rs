//! Health monitoring module for plugin runtime self-healing.
//!
//! Implements health detection, status calculation, and diagnostic generation.

use super::{
    PluginHealthSignal, PluginHealthStatus, FaultSeverity, DiagnosticEntry,
    DiagnosticLevel, RecoveryAction, HealthCheckConfig, HealthCheckResult, chrono_now, uuid_simple,
};

/// Health monitoring configuration
#[derive(Debug, Clone)]
pub struct HealthMonitorConfig {
    /// Health check configuration
    pub check_config: HealthCheckConfig,
    /// Resource usage thresholds
    pub memory_threshold: u8,
    pub cpu_threshold: u8,
}

impl Default for HealthMonitorConfig {
    fn default() -> Self {
        Self {
            check_config: HealthCheckConfig::default(),
            memory_threshold: 90,
            cpu_threshold: 90,
        }
    }
}

/// Health monitor for checking plugin health status
pub struct HealthMonitor {
    config: HealthMonitorConfig,
}

impl HealthMonitor {
    /// Create a new health monitor with default configuration
    pub fn new() -> Self {
        Self {
            config: HealthMonitorConfig::default(),
        }
    }

    /// Create a health monitor with custom configuration
    pub fn with_config(config: HealthMonitorConfig) -> Self {
        Self { config }
    }

    /// Perform a health check on a plugin
    pub fn check_health(&self, signal: &PluginHealthSignal) -> HealthCheckResult {
        let config = &self.config.check_config;

        // Determine status based on fault rate and consecutive failures
        let (status, should_isolate) = self.calculate_status(signal, config);

        // Determine if restart should be attempted
        let should_restart = signal.consecutive_failures > 0
            && signal.consecutive_failures < config.isolation_threshold
            && signal.status != PluginHealthStatus::Disabled;

        // Determine if plugin should be disabled
        let should_disable = signal.consecutive_failures >= config.isolation_threshold
            && config.auto_disable_enabled;

        // Generate diagnostic if needed
        let diagnostic = self.generate_diagnostic(signal, status);

        HealthCheckResult {
            plugin_id: signal.plugin_id.clone(),
            status,
            fault_rate: signal.fault_rate,
            consecutive_failures: signal.consecutive_failures,
            should_isolate,
            should_restart,
            should_disable,
            diagnostic,
        }
    }

    /// Calculate health status based on fault metrics
    fn calculate_status(
        &self,
        signal: &PluginHealthSignal,
        config: &HealthCheckConfig,
    ) -> (PluginHealthStatus, bool) {
        // Check if already disabled or isolated
        if signal.is_auto_disabled || signal.status == PluginHealthStatus::Disabled {
            return (PluginHealthStatus::Disabled, false);
        }

        if signal.isolation_reason.is_some() || signal.status == PluginHealthStatus::Isolated {
            return (PluginHealthStatus::Isolated, true);
        }

        // Check fault rate thresholds
        if signal.fault_rate >= config.fault_rate_threshold_unhealthy {
            return (PluginHealthStatus::Unhealthy, false);
        }

        if signal.fault_rate >= config.fault_rate_threshold_degraded {
            return (PluginHealthStatus::Degraded, false);
        }

        // Check consecutive failures
        if signal.consecutive_failures >= config.isolation_threshold {
            return (PluginHealthStatus::Isolated, true);
        }

        // Default to healthy
        (PluginHealthStatus::Healthy, false)
    }

    /// Generate diagnostic entry if plugin has issues
    fn generate_diagnostic(
        &self,
        signal: &PluginHealthSignal,
        status: PluginHealthStatus,
    ) -> Option<DiagnosticEntry> {
        match status {
            PluginHealthStatus::Healthy => None,
            PluginHealthStatus::Degraded => Some(DiagnosticEntry {
                id: uuid_simple(),
                plugin_id: signal.plugin_id.clone(),
                plugin_name: signal.plugin_name.clone(),
                level: DiagnosticLevel::Warning,
                code: format!("D{}-001", signal.plugin_id.to_uppercase()),
                message: format!(
                    "Plugin '{}' is degraded with {:.1}% fault rate. Monitoring closely.",
                    signal.plugin_name, signal.fault_rate
                ),
                timestamp: chrono_now(),
                actionable: true,
                action_taken: None,
            }),
            PluginHealthStatus::Unhealthy => Some(DiagnosticEntry {
                id: uuid_simple(),
                plugin_id: signal.plugin_id.clone(),
                plugin_name: signal.plugin_name.clone(),
                level: DiagnosticLevel::Error,
                code: format!("D{}-002", signal.plugin_id.to_uppercase()),
                message: format!(
                    "Plugin '{}' is unhealthy with {:.1}% fault rate and {} consecutive failures. Intervention required.",
                    signal.plugin_name, signal.fault_rate, signal.consecutive_failures
                ),
                timestamp: chrono_now(),
                actionable: true,
                action_taken: Some(RecoveryAction::Restart),
            }),
            PluginHealthStatus::Isolated => Some(DiagnosticEntry {
                id: uuid_simple(),
                plugin_id: signal.plugin_id.clone(),
                plugin_name: signal.plugin_name.clone(),
                level: DiagnosticLevel::Critical,
                code: format!("D{}-003", signal.plugin_id.to_uppercase()),
                message: format!(
                    "Circuit breaker triggered for plugin '{}' after {} consecutive failures. Plugin has been isolated.",
                    signal.plugin_name, signal.consecutive_failures
                ),
                timestamp: chrono_now(),
                actionable: false,
                action_taken: Some(RecoveryAction::Isolate),
            }),
            PluginHealthStatus::Disabled => Some(DiagnosticEntry {
                id: uuid_simple(),
                plugin_id: signal.plugin_id.clone(),
                plugin_name: signal.plugin_name.clone(),
                level: DiagnosticLevel::Critical,
                code: format!("D{}-004", signal.plugin_id.to_uppercase()),
                message: format!(
                    "Plugin '{}' has been auto-disabled after exceeding maximum restart attempts.",
                    signal.plugin_name
                ),
                timestamp: chrono_now(),
                actionable: false,
                action_taken: Some(RecoveryAction::Disable),
            }),
        }
    }

    /// Determine if resource usage is abnormal
    pub fn check_resource_usage(&self, signal: &PluginHealthSignal) -> Option<DiagnosticEntry> {
        let mut issues = Vec::new();

        if signal.memory_usage > self.config.memory_threshold {
            issues.push(format!("Memory usage at {}%", signal.memory_usage));
        }

        if signal.cpu_usage > self.config.cpu_threshold {
            issues.push(format!("CPU usage at {}%", signal.cpu_usage));
        }

        if issues.is_empty() {
            return None;
        }

        Some(DiagnosticEntry {
            id: uuid_simple(),
            plugin_id: signal.plugin_id.clone(),
            plugin_name: signal.plugin_name.clone(),
            level: if issues.len() > 1 {
                DiagnosticLevel::Critical
            } else {
                DiagnosticLevel::Warning
            },
            code: format!("D{}-RES", signal.plugin_id.to_uppercase()),
            message: format!(
                "Resource pressure detected for '{}': {}. Consider scaling down operations.",
                signal.plugin_name,
                issues.join(", ")
            ),
            timestamp: chrono_now(),
            actionable: true,
            action_taken: None,
        })
    }

    /// Classify fault severity based on error characteristics
    pub fn classify_fault(
        &self,
        error_code: &str,
        error_message: &str,
        recoverable: bool,
    ) -> FaultSeverity {
        // Check error code prefix
        let prefix = error_code.split('-').next().unwrap_or("");

        match prefix {
            "TIMEOUT" | "503" => {
                if recoverable {
                    FaultSeverity::Medium
                } else {
                    FaultSeverity::High
                }
            }
            "500" | "ERR" => {
                if error_message.contains("OOM") || error_message.contains("memory") {
                    FaultSeverity::Critical
                } else {
                    FaultSeverity::High
                }
            }
            "429" | "RATE" => FaultSeverity::Low,
            "401" | "403" | "AUTH" => FaultSeverity::High,
            "404" | "NOT_FOUND" => FaultSeverity::Medium,
            _ => {
                if recoverable {
                    FaultSeverity::Low
                } else {
                    FaultSeverity::Medium
                }
            }
        }
    }

    /// Calculate uptime percentage based on fault count
    pub fn calculate_uptime(&self, total_requests: u64, failed_requests: u64) -> f64 {
        if total_requests == 0 {
            return 100.0;
        }
        let success_rate = (total_requests - failed_requests) as f64 / total_requests as f64;
        success_rate * 100.0
    }
}

impl Default for HealthMonitor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_uptime() {
        let monitor = HealthMonitor::new();
        assert_eq!(monitor.calculate_uptime(100, 0), 100.0);
        assert_eq!(monitor.calculate_uptime(100, 5), 95.0);
        assert_eq!(monitor.calculate_uptime(0, 0), 100.0);
    }

    #[test]
    fn test_classify_fault() {
        let monitor = HealthMonitor::new();

        // Timeout error
        let severity = monitor.classify_fault("TIMEOUT-001", "Connection timed out", true);
        assert_eq!(severity, FaultSeverity::Medium);

        // OOM error
        let severity = monitor.classify_fault("500", "Out of memory error", false);
        assert_eq!(severity, FaultSeverity::Critical);

        // Rate limit
        let severity = monitor.classify_fault("429", "Rate limit exceeded", true);
        assert_eq!(severity, FaultSeverity::Low);
    }

    #[tokio::test]
    async fn test_health_check_healthy() {
        let monitor = HealthMonitor::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            status: PluginHealthStatus::Healthy,
            fault_rate: 1.0,
            consecutive_failures: 0,
            ..Default::default()
        };

        let result = monitor.check_health(&signal);
        assert_eq!(result.status, PluginHealthStatus::Healthy);
        assert!(!result.should_isolate);
        assert!(!result.should_restart);
        assert!(!result.should_disable);
    }

    #[tokio::test]
    async fn test_health_check_unhealthy() {
        let monitor = HealthMonitor::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            status: PluginHealthStatus::Unhealthy,
            fault_rate: 15.0,
            consecutive_failures: 3,
            ..Default::default()
        };

        let result = monitor.check_health(&signal);
        assert_eq!(result.status, PluginHealthStatus::Unhealthy);
        assert!(result.should_restart);
        assert!(!result.should_disable);
    }

    #[tokio::test]
    async fn test_health_check_isolation() {
        let monitor = HealthMonitor::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            fault_rate: 25.0,
            consecutive_failures: 12,
            ..Default::default()
        };

        let result = monitor.check_health(&signal);
        assert!(result.should_isolate);
        assert!(!result.should_restart);
        assert!(result.should_disable);
    }
}
