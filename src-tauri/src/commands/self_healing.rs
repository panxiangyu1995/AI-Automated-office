//! Self-healing module Tauri commands.

use crate::self_healing::{
    get_registry,
    PluginHealthSignal, PluginHealthStatus, FaultRecord, FaultSeverity,
    DiagnosticEntry, RecoveryEvent,
    SelfHealingStats, HealthCheckResult,
    chrono_now, uuid_simple,
};

/// Service response wrapper
#[derive(serde::Serialize)]
pub struct ServiceResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ServiceResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

/// Register a plugin for health monitoring
#[tauri::command]
pub async fn self_healing_register_plugin(
    plugin_id: String,
    plugin_name: String,
    auto_disable_enabled: Option<bool>,
) -> Result<ServiceResponse<PluginHealthSignal>, String> {
    let registry = get_registry();

    let signal = PluginHealthSignal {
        id: uuid_simple(),
        plugin_id: plugin_id.clone(),
        plugin_name: plugin_name.clone(),
        status: PluginHealthStatus::Healthy,
        auto_disable_enabled: auto_disable_enabled.unwrap_or(true),
        ..Default::default()
    };

    let mut reg = registry.write().await;
    reg.register(signal.clone()).await;

    Ok(ServiceResponse::ok(signal))
}

/// Unregister a plugin from health monitoring
#[tauri::command]
pub async fn self_healing_unregister_plugin(
    plugin_id: String,
) -> Result<ServiceResponse<()>, String> {
    let registry = get_registry();
    let mut reg = registry.write().await;
    reg.unregister(&plugin_id).await;
    Ok(ServiceResponse::ok(()))
}

/// Get health signal for a plugin
#[tauri::command]
pub async fn self_healing_get_plugin_health(
    plugin_id: String,
) -> Result<ServiceResponse<Option<PluginHealthSignal>>, String> {
    let registry = get_registry();
    let reg = registry.read().await;
    let signal = reg.get(&plugin_id).await;
    Ok(ServiceResponse::ok(signal))
}

/// List all plugin health signals
#[tauri::command]
pub async fn self_healing_list_plugins(
) -> Result<ServiceResponse<Vec<PluginHealthSignal>>, String> {
    let registry = get_registry();
    let reg = registry.read().await;
    let signals = reg.get_all_signals().await;
    Ok(ServiceResponse::ok(signals))
}

/// Record a fault for a plugin
#[tauri::command]
pub async fn self_healing_record_fault(
    plugin_id: String,
    error_code: String,
    error_message: String,
    recoverable: bool,
    severity: String,
) -> Result<ServiceResponse<()>, String> {
    let registry = get_registry();

    let severity = match severity.to_lowercase().as_str() {
        "low" => FaultSeverity::Low,
        "medium" => FaultSeverity::Medium,
        "high" => FaultSeverity::High,
        "critical" => FaultSeverity::Critical,
        _ => FaultSeverity::Medium,
    };

    let fault = FaultRecord {
        id: uuid_simple(),
        plugin_id: plugin_id.clone(),
        plugin_name: String::new(), // Will be filled by registry
        severity,
        error_code,
        error_message,
        timestamp: chrono_now(),
        recoverable,
    };

    let mut reg = registry.write().await;
    reg.record_fault(&plugin_id, fault).await;
    Ok(ServiceResponse::ok(()))
}

/// Clear consecutive failures for a plugin (after successful operation)
#[tauri::command]
pub async fn self_healing_clear_failures(
    plugin_id: String,
) -> Result<ServiceResponse<()>, String> {
    let registry = get_registry();
    let mut reg = registry.write().await;
    reg.clear_consecutive_failures(&plugin_id).await;
    Ok(ServiceResponse::ok(()))
}

/// Get faults for a plugin
#[tauri::command]
pub async fn self_healing_get_faults(
    plugin_id: String,
) -> Result<ServiceResponse<Vec<FaultRecord>>, String> {
    let registry = get_registry();
    let reg = registry.read().await;
    let faults = reg.get_faults(&plugin_id).await;
    Ok(ServiceResponse::ok(faults))
}

/// Get diagnostics for a plugin
#[tauri::command]
pub async fn self_healing_get_diagnostics(
    plugin_id: String,
) -> Result<ServiceResponse<Vec<DiagnosticEntry>>, String> {
    let registry = get_registry();
    let reg = registry.read().await;
    let diagnostics = reg.get_diagnostics(&plugin_id).await;
    Ok(ServiceResponse::ok(diagnostics))
}

/// Get recoveries for a plugin
#[tauri::command]
pub async fn self_healing_get_recoveries(
    plugin_id: String,
) -> Result<ServiceResponse<Vec<RecoveryEvent>>, String> {
    let registry = get_registry();
    let reg = registry.read().await;
    let recoveries = reg.get_recoveries(&plugin_id).await;
    Ok(ServiceResponse::ok(recoveries))
}

/// Perform health check on a plugin
#[tauri::command]
pub async fn self_healing_check_plugin(
    plugin_id: String,
) -> Result<ServiceResponse<HealthCheckResult>, String> {
    let registry = get_registry();
    let reg = registry.read().await;

    if let Some(signal) = reg.get(&plugin_id).await {
        // Import health monitor
        use crate::self_healing::HealthMonitor;

        let monitor = HealthMonitor::new();
        let result = monitor.check_health(&signal);
        Ok(ServiceResponse::ok(result))
    } else {
        Ok(ServiceResponse::err(format!("Plugin {} not found", plugin_id)))
    }
}

/// Enable a disabled plugin
#[tauri::command]
pub async fn self_healing_enable_plugin(
    plugin_id: String,
) -> Result<ServiceResponse<()>, String> {
    let registry = get_registry();
    let mut reg = registry.write().await;
    match reg.enable(&plugin_id).await {
        Some(_) => Ok(ServiceResponse::ok(())),
        None => Ok(ServiceResponse::err(format!("Plugin {} not found", plugin_id))),
    }
}

/// Disable a plugin manually
#[tauri::command]
pub async fn self_healing_disable_plugin(
    plugin_id: String,
) -> Result<ServiceResponse<()>, String> {
    let registry = get_registry();
    let mut reg = registry.write().await;
    match reg.disable(&plugin_id, false).await {
        Some(_) => Ok(ServiceResponse::ok(())),
        None => Ok(ServiceResponse::err(format!("Plugin {} not found", plugin_id))),
    }
}

/// Restart a plugin (reset consecutive failures)
#[tauri::command]
pub async fn self_healing_restart_plugin(
    plugin_id: String,
) -> Result<ServiceResponse<()>, String> {
    let registry = get_registry();
    let mut reg = registry.write().await;
    match reg.restart(&plugin_id).await {
        Some(_) => Ok(ServiceResponse::ok(())),
        None => Ok(ServiceResponse::err(format!("Plugin {} not found", plugin_id))),
    }
}

/// Get self-healing statistics
#[tauri::command]
pub async fn self_healing_get_stats(
) -> Result<ServiceResponse<SelfHealingStats>, String> {
    let registry = get_registry();
    let reg = registry.read().await;
    let stats = reg.calculate_stats().await;
    Ok(ServiceResponse::ok(stats))
}

/// Update plugin resource usage
#[tauri::command]
pub async fn self_healing_update_resources(
    plugin_id: String,
    memory_usage: u8,
    cpu_usage: u8,
) -> Result<ServiceResponse<()>, String> {
    let registry = get_registry();
    let mut reg = registry.write().await;

    if let Some(signal) = reg.health_signals.get_mut(&plugin_id) {
        signal.memory_usage = memory_usage;
        signal.cpu_usage = cpu_usage;
        signal.last_check_time = chrono_now();
        Ok(ServiceResponse::ok(()))
    } else {
        Ok(ServiceResponse::err(format!("Plugin {} not found", plugin_id)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register_and_get() {
        let result = self_healing_register_plugin(
            "test-plugin".to_string(),
            "Test Plugin".to_string(),
            Some(true),
        ).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.success);
        assert!(response.data.is_some());

        let signal = response.data.unwrap();
        assert_eq!(signal.plugin_id, "test-plugin");
    }

    #[tokio::test]
    async fn test_list_plugins() {
        // Register a plugin first
        self_healing_register_plugin(
            "list-test".to_string(),
            "List Test".to_string(),
            None,
        ).await.unwrap();

        let result = self_healing_list_plugins().await.unwrap();
        assert!(result.success);
        assert!(result.data.is_some());
        assert!(!result.data.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_record_fault() {
        // Register first
        self_healing_register_plugin(
            "fault-test".to_string(),
            "Fault Test".to_string(),
            None,
        ).await.unwrap();

        let result = self_healing_record_fault(
            "fault-test".to_string(),
            "TEST-500".to_string(),
            "Test error".to_string(),
            true,
            "high".to_string(),
        ).await;

        assert!(result.is_ok());
        assert!(result.unwrap().success);
    }
}
