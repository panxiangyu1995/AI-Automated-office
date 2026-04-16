//! Plugin health registry for managing plugin health state.
//!
//! Stores health signals, fault records, and diagnostics for all plugins.

use super::{
    PluginHealthSignal, PluginHealthStatus, FaultRecord, DiagnosticEntry,
    RecoveryEvent, SelfHealingStats, IsolationReason,
    chrono_now,
};
use std::collections::HashMap;

/// Plugin health information stored in registry
#[derive(Debug, Clone)]
pub struct PluginHealthInfo {
    /// Current health signal
    pub signal: PluginHealthSignal,
    /// Fault history
    pub faults: Vec<FaultRecord>,
    /// Diagnostic entries
    pub diagnostics: Vec<DiagnosticEntry>,
    /// Recovery events
    pub recoveries: Vec<RecoveryEvent>,
}

impl Default for PluginHealthInfo {
    fn default() -> Self {
        Self {
            signal: PluginHealthSignal::default(),
            faults: Vec::new(),
            diagnostics: Vec::new(),
            recoveries: Vec::new(),
        }
    }
}

/// Registry for managing plugin health state
#[derive(Debug, Clone)]
pub struct PluginHealthRegistry {
    /// Health signals indexed by plugin ID
    pub health_signals: HashMap<String, PluginHealthSignal>,
    /// Fault records indexed by plugin ID
    faults: HashMap<String, Vec<FaultRecord>>,
    /// Diagnostic entries indexed by plugin ID
    diagnostics: HashMap<String, Vec<DiagnosticEntry>>,
    /// Recovery events indexed by plugin ID
    recoveries: HashMap<String, Vec<RecoveryEvent>>,
}

impl PluginHealthRegistry {
    /// Create a new empty registry
    pub fn new() -> Self {
        Self {
            health_signals: HashMap::new(),
            faults: HashMap::new(),
            diagnostics: HashMap::new(),
            recoveries: HashMap::new(),
        }
    }

    /// Register a new plugin for health monitoring
    pub async fn register(&mut self, signal: PluginHealthSignal) {
        let plugin_id = signal.plugin_id.clone();
        self.health_signals.insert(plugin_id.clone(), signal);
        self.faults.insert(plugin_id, Vec::new());
    }

    /// Get health signal for a plugin
    pub async fn get(&self, plugin_id: &str) -> Option<PluginHealthSignal> {
        self.health_signals.get(plugin_id).cloned()
    }

    /// Remove a plugin from health monitoring
    pub async fn unregister(&mut self, plugin_id: &str) {
        self.health_signals.remove(plugin_id);
        self.faults.remove(plugin_id);
        self.diagnostics.remove(plugin_id);
        self.recoveries.remove(plugin_id);
    }

    /// Update health status for a plugin
    pub async fn update_status(
        &mut self,
        plugin_id: &str,
        status: PluginHealthStatus,
    ) -> Option<()> {
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.status = status;
            signal.last_check_time = chrono_now();
            Some(())
        } else {
            None
        }
    }

    /// Record a fault for a plugin
    pub async fn record_fault(&mut self, plugin_id: &str, fault: FaultRecord) {
        // Update fault count and consecutive failures
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.fault_count += 1;
            signal.consecutive_failures += 1;
            signal.last_fault_time = Some(fault.timestamp.clone());
            signal.last_check_time = chrono_now();

            // Recalculate fault rate (simplified: based on last 100 requests)
            signal.fault_rate = (signal.consecutive_failures as f64
                / (signal.fault_count.max(1) as f64)) * 100.0;
            signal.fault_rate = signal.fault_rate.min(100.0);
        }

        // Store fault record
        let faults = self.faults.entry(plugin_id.to_string()).or_insert_with(Vec::new);
        faults.push(fault);

        // Keep only last 100 faults
        if faults.len() > 100 {
            faults.remove(0);
        }
    }

    /// Clear consecutive failures (e.g., after successful operation)
    pub async fn clear_consecutive_failures(&mut self, plugin_id: &str) {
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.consecutive_failures = 0;
            signal.last_check_time = chrono_now();
        }
    }

    /// Add a diagnostic entry for a plugin
    pub async fn add_diagnostic(&mut self, plugin_id: &str, diagnostic: DiagnosticEntry) {
        let diagnostics = self.diagnostics
            .entry(plugin_id.to_string())
            .or_insert_with(Vec::new);
        diagnostics.push(diagnostic);

        // Keep only last 50 diagnostics
        if diagnostics.len() > 50 {
            diagnostics.remove(0);
        }
    }

    /// Add a recovery event for a plugin
    pub async fn add_recovery(&mut self, plugin_id: &str, recovery: RecoveryEvent) {
        let recoveries = self.recoveries
            .entry(plugin_id.to_string())
            .or_insert_with(Vec::new);
        recoveries.push(recovery);

        // Update recovery count in signal
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.recovery_count += 1;
        }

        // Keep only last 50 recoveries
        if recoveries.len() > 50 {
            recoveries.remove(0);
        }
    }

    /// Get faults for a plugin
    pub async fn get_faults(&self, plugin_id: &str) -> Vec<FaultRecord> {
        self.faults.get(plugin_id).cloned().unwrap_or_default()
    }

    /// Get diagnostics for a plugin
    pub async fn get_diagnostics(&self, plugin_id: &str) -> Vec<DiagnosticEntry> {
        self.diagnostics.get(plugin_id).cloned().unwrap_or_default()
    }

    /// Get recoveries for a plugin
    pub async fn get_recoveries(&self, plugin_id: &str) -> Vec<RecoveryEvent> {
        self.recoveries.get(plugin_id).cloned().unwrap_or_default()
    }

    /// Get all health signals
    pub async fn get_all_signals(&self) -> Vec<PluginHealthSignal> {
        self.health_signals.values().cloned().collect()
    }

    /// Calculate statistics across all plugins
    pub async fn calculate_stats(&self) -> SelfHealingStats {
        let signals = self.health_signals.values();
        let total = signals.len();

        let healthy = signals.clone().filter(|s| s.status == PluginHealthStatus::Healthy).count();
        let degraded = signals.clone().filter(|s| s.status == PluginHealthStatus::Degraded).count();
        let unhealthy = signals.clone().filter(|s| s.status == PluginHealthStatus::Unhealthy).count();
        let isolated = signals.clone().filter(|s| s.status == PluginHealthStatus::Isolated).count();
        let disabled = signals.clone().filter(|s| s.status == PluginHealthStatus::Disabled).count();
        let auto_disabled = signals.clone().filter(|s| s.is_auto_disabled).count();

        let total_recoveries: usize = self.recoveries.values().map(|v| v.len()).sum();
        let failed_recoveries: usize = self.recoveries
            .values()
            .flatten()
            .filter(|r| r.status == super::RecoveryStatus::Failed)
            .count();

        SelfHealingStats {
            total_plugins: total,
            healthy_plugins: healthy,
            degraded_plugins: degraded,
            unhealthy_plugins: unhealthy,
            isolated_plugins: isolated,
            disabled_plugins: disabled,
            auto_disabled_count: auto_disabled,
            total_recoveries,
            failed_recoveries,
        }
    }

    /// Isolate a plugin due to repeated failures
    pub async fn isolate(&mut self, plugin_id: &str, reason: IsolationReason) -> Option<()> {
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.status = PluginHealthStatus::Isolated;
            signal.isolation_reason = Some(reason);
            signal.last_check_time = chrono_now();
            Some(())
        } else {
            None
        }
    }

    /// Disable a plugin (auto-disable or manual)
    pub async fn disable(&mut self, plugin_id: &str, auto: bool) -> Option<()> {
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.status = PluginHealthStatus::Disabled;
            signal.is_auto_disabled = auto;
            signal.isolation_reason = Some(IsolationReason::RepeatedFailure);
            signal.last_check_time = chrono_now();
            Some(())
        } else {
            None
        }
    }

    /// Enable a previously disabled plugin
    pub async fn enable(&mut self, plugin_id: &str) -> Option<()> {
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.status = PluginHealthStatus::Healthy;
            signal.is_auto_disabled = false;
            signal.consecutive_failures = 0;
            signal.isolation_reason = None;
            signal.last_check_time = chrono_now();
            Some(())
        } else {
            None
        }
    }

    /// Restart a plugin (reset consecutive failures, increment recovery count)
    pub async fn restart(&mut self, plugin_id: &str) -> Option<()> {
        if let Some(signal) = self.health_signals.get_mut(plugin_id) {
            signal.consecutive_failures = 0;
            signal.recovery_count += 1;
            signal.last_check_time = chrono_now();
            // Set to degraded initially, health check will update
            if signal.status == PluginHealthStatus::Isolated {
                signal.status = PluginHealthStatus::Degraded;
            }
            Some(())
        } else {
            None
        }
    }
}

impl Default for PluginHealthRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register_and_get() {
        let mut registry = PluginHealthRegistry::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            ..Default::default()
        };

        registry.register(signal).await;
        let retrieved = registry.get("test").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().plugin_id, "test");
    }

    #[tokio::test]
    async fn test_record_fault() {
        let mut registry = PluginHealthRegistry::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            ..Default::default()
        };

        registry.register(signal).await;

        registry.record_fault(
            "test",
            FaultRecord {
                id: uuid_simple(),
                plugin_id: "test".to_string(),
                plugin_name: "Test".to_string(),
                severity: super::FaultSeverity::High,
                error_code: "TEST-500".to_string(),
                error_message: "Test error".to_string(),
                timestamp: chrono_now(),
                recoverable: true,
            },
        ).await;

        let signal = registry.get("test").await.unwrap();
        assert_eq!(signal.consecutive_failures, 1);
        assert_eq!(signal.fault_count, 1);
    }

    #[tokio::test]
    async fn test_clear_consecutive_failures() {
        let mut registry = PluginHealthRegistry::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            consecutive_failures: 5,
            ..Default::default()
        };

        registry.register(signal).await;
        registry.clear_consecutive_failures("test").await;

        let signal = registry.get("test").await.unwrap();
        assert_eq!(signal.consecutive_failures, 0);
    }

    #[tokio::test]
    async fn test_isolate() {
        let mut registry = PluginHealthRegistry::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            ..Default::default()
        };

        registry.register(signal).await;
        registry.isolate("test", IsolationReason::CircuitBreaker).await;

        let signal = registry.get("test").await.unwrap();
        assert_eq!(signal.status, PluginHealthStatus::Isolated);
        assert_eq!(signal.isolation_reason, Some(IsolationReason::CircuitBreaker));
    }

    #[tokio::test]
    async fn test_disable_and_enable() {
        let mut registry = PluginHealthRegistry::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            ..Default::default()
        };

        registry.register(signal).await;
        registry.disable("test", true).await;

        let signal = registry.get("test").await.unwrap();
        assert!(signal.is_auto_disabled);

        registry.enable("test").await;
        let signal = registry.get("test").await.unwrap();
        assert!(!signal.is_auto_disabled);
        assert_eq!(signal.consecutive_failures, 0);
    }

    #[tokio::test]
    async fn test_calculate_stats() {
        let mut registry = PluginHealthRegistry::new();

        registry.register(PluginHealthSignal {
            plugin_id: "healthy".to_string(),
            plugin_name: "Healthy".to_string(),
            status: PluginHealthStatus::Healthy,
            ..Default::default()
        }).await;

        registry.register(PluginHealthSignal {
            plugin_id: "degraded".to_string(),
            plugin_name: "Degraded".to_string(),
            status: PluginHealthStatus::Degraded,
            ..Default::default()
        }).await;

        registry.register(PluginHealthSignal {
            plugin_id: "disabled".to_string(),
            plugin_name: "Disabled".to_string(),
            status: PluginHealthStatus::Disabled,
            is_auto_disabled: true,
            ..Default::default()
        }).await;

        let stats = registry.calculate_stats().await;
        assert_eq!(stats.total_plugins, 3);
        assert_eq!(stats.healthy_plugins, 1);
        assert_eq!(stats.degraded_plugins, 1);
        assert_eq!(stats.disabled_plugins, 1);
        assert_eq!(stats.auto_disabled_count, 1);
    }
}
