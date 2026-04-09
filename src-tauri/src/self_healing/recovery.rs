//! Recovery module for plugin runtime self-healing.
//!
//! Implements automatic restart, restart limits, and recovery tracking.

use super::{
    PluginHealthSignal, PluginHealthStatus, RecoveryAction, RecoveryEvent,
    RecoveryStatus, TriggeredBy, chrono_now, uuid_simple,
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Recovery configuration
#[derive(Debug, Clone)]
pub struct RecoveryConfig {
    /// Maximum number of restart attempts
    pub max_restart_attempts: u32,
    /// Time window for counting restarts (seconds)
    pub restart_window_secs: u64,
    /// Delay between restart attempts (seconds)
    pub restart_delay_secs: u64,
    /// Enable automatic recovery
    pub auto_recovery_enabled: bool,
}

impl Default for RecoveryConfig {
    fn default() -> Self {
        Self {
            max_restart_attempts: 5,
            restart_window_secs: 300, // 5 minutes
            restart_delay_secs: 10,
            auto_recovery_enabled: true,
        }
    }
}

/// Recovery manager for handling plugin recovery actions
pub struct RecoveryManager {
    config: RecoveryConfig,
    /// Track recovery events per plugin
    recovery_events: HashMap<String, Vec<RecoveryEvent>>,
    /// Track restart counts per plugin
    restart_counts: HashMap<String, u32>,
}

impl RecoveryManager {
    /// Create a new recovery manager with default configuration
    pub fn new() -> Self {
        Self {
            config: RecoveryConfig::default(),
            recovery_events: HashMap::new(),
            restart_counts: HashMap::new(),
        }
    }

    /// Create a recovery manager with custom configuration
    pub fn with_config(config: RecoveryConfig) -> Self {
        Self {
            config,
            recovery_events: HashMap::new(),
            restart_counts: HashMap::new(),
        }
    }

    /// Determine the appropriate recovery action
    pub fn determine_action(
        &self,
        signal: &PluginHealthSignal,
    ) -> (RecoveryAction, bool) {
        let restart_count = self.get_restart_count(&signal.plugin_id);

        // Check if we've exceeded max restarts
        if restart_count >= self.config.max_restart_attempts {
            return (RecoveryAction::Disable, false);
        }

        // If isolated, don't auto-restart
        if signal.status == PluginHealthStatus::Isolated {
            return (RecoveryAction::Isolate, false);
        }

        // If disabled, don't restart
        if signal.status == PluginHealthStatus::Disabled {
            return (RecoveryAction::Disable, false);
        }

        // If consecutive failures exceed threshold, isolate
        if signal.consecutive_failures >= 10 {
            return (RecoveryAction::Isolate, true);
        }

        // Otherwise, attempt restart
        if restart_count > 0 {
            (RecoveryAction::Restart, true)
        } else {
            (RecoveryAction::Retry, true)
        }
    }

    /// Get the restart count for a plugin
    pub fn get_restart_count(&self, plugin_id: &str) -> u32 {
        self.restart_counts.get(plugin_id).copied().unwrap_or(0)
    }

    /// Increment restart count for a plugin
    pub fn increment_restart_count(&mut self, plugin_id: &str) {
        let count = self.restart_counts.entry(plugin_id.to_string()).or_insert(0);
        *count += 1;
    }

    /// Reset restart count for a plugin
    pub fn reset_restart_count(&mut self, plugin_id: &str) {
        self.restart_counts.insert(plugin_id.to_string(), 0);
    }

    /// Record a recovery event
    pub fn record_recovery(&mut self, event: RecoveryEvent) {
        let events = self.recovery_events
            .entry(event.plugin_id.clone())
            .or_insert_with(Vec::new);
        events.push(event);
    }

    /// Get recovery history for a plugin
    pub fn get_recovery_history(&self, plugin_id: &str) -> Vec<RecoveryEvent> {
        self.recovery_events
            .get(plugin_id)
            .cloned()
            .unwrap_or_default()
    }

    /// Check if a plugin can be recovered
    pub fn can_recover(&self, plugin_id: &str) -> bool {
        self.get_restart_count(plugin_id) < self.config.max_restart_attempts
    }

    /// Execute recovery action (simulated - actual restart would call plugin loader)
    pub async fn execute_recovery(
        &mut self,
        plugin_id: &str,
        plugin_name: &str,
        action: RecoveryAction,
        triggered_by: TriggeredBy,
    ) -> RecoveryEvent {
        let event = RecoveryEvent {
            id: uuid_simple(),
            plugin_id: plugin_id.to_string(),
            plugin_name: plugin_name.to_string(),
            action,
            triggered_by,
            status: RecoveryStatus::Executing,
            timestamp: chrono_now(),
            error_message: None,
            diagnostic_ref: None,
        };

        // Record the recovery attempt
        self.record_recovery(event.clone());

        // Increment restart count for restart/retry actions
        match action {
            RecoveryAction::Restart | RecoveryAction::Retry => {
                self.increment_restart_count(plugin_id);
            }
            _ => {}
        }

        event
    }

    /// Mark a recovery event as complete
    pub fn complete_recovery(
        &mut self,
        event_id: &str,
        plugin_id: &str,
        success: bool,
        error_message: Option<String>,
    ) {
        if let Some(events) = self.recovery_events.get_mut(plugin_id) {
            if let Some(event) = events.iter_mut().find(|e| e.id == event_id) {
                event.status = if success {
                    RecoveryStatus::Success
                } else {
                    RecoveryStatus::Failed
                };
                event.error_message = error_message;
            }
        }

        // If failed and was a restart, don't reset count
        // If successful, reset restart count
        if success {
            self.reset_restart_count(plugin_id);
        }
    }

    /// Get recovery statistics
    pub fn get_stats(&self) -> (usize, usize) {
        let total = self.recovery_events.values().flatten().count();
        let failed = self.recovery_events
            .values()
            .flatten()
            .filter(|e| e.status == RecoveryStatus::Failed)
            .count();
        (total, failed)
    }

    /// Should trigger automatic recovery based on configuration
    pub fn should_auto_recover(&self, signal: &PluginHealthSignal) -> bool {
        self.config.auto_recovery_enabled
            && signal.status != PluginHealthStatus::Disabled
            && signal.status != PluginHealthStatus::Isolated
            && self.can_recover(&signal.plugin_id)
    }
}

impl Default for RecoveryManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_determine_action_no_restarts() {
        let manager = RecoveryManager::new();
        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            consecutive_failures: 2,
            ..Default::default()
        };

        let (action, should_execute) = manager.determine_action(&signal);
        assert_eq!(action, RecoveryAction::Retry);
        assert!(should_execute);
    }

    #[test]
    fn test_determine_action_max_restarts() {
        let mut manager = RecoveryManager::new();
        manager.increment_restart_count(&"test".to_string());
        manager.increment_restart_count(&"test".to_string());
        manager.increment_restart_count(&"test".to_string());
        manager.increment_restart_count(&"test".to_string());
        manager.increment_restart_count(&"test".to_string());

        let signal = PluginHealthSignal {
            plugin_id: "test".to_string(),
            plugin_name: "Test".to_string(),
            consecutive_failures: 3,
            ..Default::default()
        };

        let (action, should_execute) = manager.determine_action(&signal);
        assert_eq!(action, RecoveryAction::Disable);
        assert!(!should_execute);
    }

    #[test]
    fn test_can_recover() {
        let manager = RecoveryManager::new();
        assert!(manager.can_recover("test"));

        let mut manager2 = RecoveryManager::new();
        for _ in 0..5 {
            manager2.increment_restart_count("test");
        }
        assert!(!manager2.can_recover("test"));
    }

    #[tokio::test]
    async fn test_execute_recovery() {
        let mut manager = RecoveryManager::new();
        let event = manager.execute_recovery(
            "test-plugin",
            "Test Plugin",
            RecoveryAction::Restart,
            TriggeredBy::Auto,
        ).await;

        assert_eq!(event.plugin_id, "test-plugin");
        assert_eq!(event.status, RecoveryStatus::Executing);
        assert_eq!(manager.get_restart_count("test-plugin"), 1);
    }

    #[tokio::test]
    async fn test_complete_recovery_success() {
        let mut manager = RecoveryManager::new();
        let event = manager.execute_recovery(
            "test-plugin",
            "Test Plugin",
            RecoveryAction::Restart,
            TriggeredBy::Auto,
        ).await;

        manager.complete_recovery(&event.id, &event.plugin_id, true, None);

        let history = manager.get_recovery_history("test-plugin");
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].status, RecoveryStatus::Success);
        // Restart count should be reset after success
        assert_eq!(manager.get_restart_count("test-plugin"), 0);
    }
}
