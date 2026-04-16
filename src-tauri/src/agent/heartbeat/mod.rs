//! Heartbeat backend execution engine.
//!
//! This module provides periodic agent execution and proactive notifications.
//!
//! # Features
//!
//! - Configurable heartbeat interval (default 30 minutes)
//! - Active hours support with timezone handling
//! - HEARTBEAT.md parsing for checklist management
//! - Preflight checks before execution
//! - Event emission for status changes
//! - Multiple delivery channels (system, webhook, email)
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::agent::heartbeat::{HeartbeatConfig, HeartbeatExecutor};
//!
//! let config = HeartbeatConfig::default();
//! let executor = HeartbeatExecutor::new();
//!
//! let result = executor.run_once(&config, "agent-1", Some("manual".to_string())).await;
//! ```

// Submodules
pub mod config;
pub mod parser;
pub mod preflight;
pub mod executor;
pub mod scheduler;
pub mod events;
pub mod delivery;

// Re-export commonly used types
pub use config::HeartbeatConfig;
pub use executor::{HeartbeatExecutor, HeartbeatRunResult};
pub use scheduler::{HeartbeatScheduler, HeartbeatStatusInfo};

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

/// Heartbeat manager for handling multiple agent heartbeats
pub struct HeartbeatManager {
    /// Schedulers indexed by agent ID
    schedulers: Arc<RwLock<HashMap<String, HeartbeatScheduler>>>,
    /// Executor for one-shot heartbeat runs
    executor: Arc<HeartbeatExecutor>,
}

impl HeartbeatManager {
    /// Create a new heartbeat manager
    pub fn new() -> Self {
        Self {
            schedulers: Arc::new(RwLock::new(HashMap::new())),
            executor: Arc::new(HeartbeatExecutor::new()),
        }
    }

    /// Start heartbeat for an agent
    pub async fn start_heartbeat(
        &self,
        agent_id: &str,
        config: HeartbeatConfig,
    ) -> Result<(), HeartbeatError> {
        let mut scheduler = HeartbeatScheduler::new(agent_id, config);
        scheduler.start().await?;

        let mut schedulers = self.schedulers.write().await;
        schedulers.insert(agent_id.to_string(), scheduler);

        Ok(())
    }

    /// Stop heartbeat for an agent
    pub async fn stop_heartbeat(&self, agent_id: &str) -> Result<(), HeartbeatError> {
        let mut schedulers = self.schedulers.write().await;
        if let Some(mut scheduler) = schedulers.remove(agent_id) {
            scheduler.stop().await?;
        }
        Ok(())
    }

    /// Trigger heartbeat immediately
    pub async fn trigger_heartbeat_now(
        &self,
        agent_id: &str,
        reason: Option<String>,
    ) -> Result<HeartbeatRunResult, HeartbeatError> {
        let default_config = HeartbeatConfig::default();
        let result = self.executor.run_once(&default_config, agent_id, reason).await;
        result.map_err(|e| HeartbeatError::from(e))
    }

    /// Get heartbeat status
    pub async fn get_heartbeat_status(&self, agent_id: &str) -> Result<HeartbeatStatusInfo, HeartbeatError> {
        let schedulers = self.schedulers.read().await;
        if let Some(scheduler) = schedulers.get(agent_id) {
            let state = scheduler.get_state().await;
            Ok(state.into())
        } else {
            Ok(HeartbeatStatusInfo {
                enabled: true,
                is_running: false,
                next_heartbeat_ms: None,
                last_status: None,
                last_duration_ms: None,
            })
        }
    }

    /// Update heartbeat config
    pub async fn update_config(
        &self,
        agent_id: &str,
        config: HeartbeatConfig,
    ) -> Result<(), HeartbeatError> {
        let mut schedulers = self.schedulers.write().await;
        if let Some(scheduler) = schedulers.get_mut(agent_id) {
            scheduler.update_config(config).await?;
        }
        Ok(())
    }
}

impl Default for HeartbeatManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Heartbeat error types
#[derive(Debug, thiserror::Error)]
pub enum HeartbeatError {
    #[error("heartbeat not found for agent: {0}")]
    NotFound(String),
    #[error("heartbeat operation failed: {0}")]
    OperationFailed(String),
    #[error("heartbeat configuration error: {0}")]
    ConfigError(String),
}

impl From<scheduler::SchedulerError> for HeartbeatError {
    fn from(e: scheduler::SchedulerError) -> Self {
        HeartbeatError::OperationFailed(e.to_string())
    }
}

impl From<executor::HeartbeatError> for HeartbeatError {
    fn from(e: executor::HeartbeatError) -> Self {
        HeartbeatError::OperationFailed(e.to_string())
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Start heartbeat for an agent
#[tauri::command]
pub async fn start_heartbeat(
    agent_id: String,
    config: HeartbeatConfig,
    state: tauri::State<'_, HeartbeatManager>,
) -> Result<(), String> {
    state.start_heartbeat(&agent_id, config)
        .await
        .map_err(|e| e.to_string())
}

/// Stop heartbeat for an agent
#[tauri::command]
pub async fn stop_heartbeat(
    agent_id: String,
    state: tauri::State<'_, HeartbeatManager>,
) -> Result<(), String> {
    state.stop_heartbeat(&agent_id)
        .await
        .map_err(|e| e.to_string())
}

/// Trigger heartbeat immediately
#[tauri::command]
pub async fn trigger_heartbeat_now(
    agent_id: String,
    reason: Option<String>,
    state: tauri::State<'_, HeartbeatManager>,
) -> Result<HeartbeatRunResult, String> {
    state.trigger_heartbeat_now(&agent_id, reason)
        .await
        .map_err(|e| e.to_string())
}

/// Get heartbeat status
#[tauri::command]
pub async fn get_heartbeat_status(
    agent_id: String,
    state: tauri::State<'_, HeartbeatManager>,
) -> Result<HeartbeatStatusInfo, String> {
    state.get_heartbeat_status(&agent_id)
        .await
        .map_err(|e| e.to_string())
}

/// Update heartbeat configuration
#[tauri::command]
pub async fn update_heartbeat_config(
    agent_id: String,
    config: HeartbeatConfig,
    state: tauri::State<'_, HeartbeatManager>,
) -> Result<(), String> {
    state.update_config(&agent_id, config)
        .await
        .map_err(|e| e.to_string())
}

/// Create heartbeat manager for app state
pub fn create_heartbeat_manager() -> HeartbeatManager {
    HeartbeatManager::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_heartbeat_manager_start_stop() {
        let manager = HeartbeatManager::new();

        let config = HeartbeatConfig::default();
        assert!(manager.start_heartbeat("agent-1", config).await.is_ok());

        let status = manager.get_heartbeat_status("agent-1").await.unwrap();
        assert!(status.is_running);

        assert!(manager.stop_heartbeat("agent-1").await.is_ok());

        let status = manager.get_heartbeat_status("agent-1").await.unwrap();
        assert!(!status.is_running);
    }

    #[tokio::test]
    async fn test_heartbeat_manager_trigger() {
        let manager = HeartbeatManager::new();

        let result = manager.trigger_heartbeat_now("agent-1", Some("test".to_string())).await;
        assert!(result.is_ok());
    }
}
