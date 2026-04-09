//! Plugin runtime self-healing module.
//!
//! This module implements:
//! - Plugin health detection and monitoring
//! - Fault classification and handling
//! - Automatic restart mechanism
//! - Restart count limits
//! - Fault alerting
//!
//! FR1170-FR1186: Plugin runtime self-healing

mod types;
mod health;
mod recovery;
mod registry;

pub use types::*;
pub use health::{HealthMonitor, HealthMonitorConfig};
pub use recovery::{RecoveryManager, RecoveryConfig};
pub use registry::{PluginHealthRegistry, PluginHealthInfo};

use std::sync::Arc;
use tokio::sync::RwLock;

/// Global self-healing registry instance
static SELF_HEALING_REGISTRY: once_cell::sync::Lazy<Arc<RwLock<PluginHealthRegistry>>> =
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(PluginHealthRegistry::new())));

/// Get the global self-healing registry
pub fn get_registry() -> Arc<RwLock<PluginHealthRegistry>> {
    SELF_HEALING_REGISTRY.clone()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_registry_creation() {
        let registry = get_registry();
        let guard = registry.read().await;
        assert_eq!(guard.health_signals.len(), 0);
    }

    #[tokio::test]
    async fn test_register_plugin() {
        let registry = get_registry();
        let signal = PluginHealthSignal {
            plugin_id: "test-plugin".to_string(),
            plugin_name: "Test Plugin".to_string(),
            ..Default::default()
        };

        registry.write().await.register(signal.clone()).await;
        let retrieved = registry.read().await.get(&"test-plugin".to_string()).await;

        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().plugin_id, "test-plugin");
    }

    #[tokio::test]
    async fn test_update_health() {
        let registry = get_registry();
        let signal = PluginHealthSignal {
            plugin_id: "test-plugin-2".to_string(),
            plugin_name: "Test Plugin 2".to_string(),
            ..Default::default()
        };

        registry.write().await.register(signal).await;

        // Simulate a fault
        registry.write().await.record_fault(
            &"test-plugin-2".to_string(),
            FaultRecord {
                id: uuid_simple(),
                plugin_id: "test-plugin-2".to_string(),
                plugin_name: "Test Plugin 2".to_string(),
                severity: FaultSeverity::High,
                error_code: "TEST-500".to_string(),
                error_message: "Test error".to_string(),
                timestamp: chrono_now(),
                recoverable: true,
            },
        ).await;

        let updated = registry.read().await.get(&"test-plugin-2".to_string()).await;
        assert!(updated.is_some());
        let health = updated.unwrap();
        assert_eq!(health.consecutive_failures, 1);
        assert_eq!(health.fault_count, 1);
    }
}
