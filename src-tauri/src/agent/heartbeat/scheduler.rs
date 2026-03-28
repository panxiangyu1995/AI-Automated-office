//! Heartbeat scheduler for periodic execution.

use std::sync::Arc;
use std::time::Duration;

use chrono::Timelike;
use tokio::sync::{oneshot, RwLock};
use tokio::time::interval;

use super::config::HeartbeatConfig;
use super::executor::{HeartbeatExecutor, HeartbeatRunResult};

/// Heartbeat scheduler state
#[derive(Debug, Clone)]
pub struct HeartbeatSchedulerState {
    /// Whether the scheduler is running
    pub is_running: bool,
    /// Agent ID
    pub agent_id: String,
    /// Next scheduled heartbeat time (Unix timestamp in millis)
    pub next_heartbeat_ms: Option<i64>,
    /// Last heartbeat result
    pub last_result: Option<HeartbeatRunResult>,
}

/// Heartbeat scheduler for managing periodic heartbeat execution
pub struct HeartbeatScheduler {
    /// Agent ID
    agent_id: String,
    /// Configuration
    config: HeartbeatConfig,
    /// Executor
    executor: Arc<HeartbeatExecutor>,
    /// Current state
    state: Arc<RwLock<HeartbeatSchedulerState>>,
    /// Shutdown signal sender
    shutdown_tx: Arc<RwLock<Option<oneshot::Sender<()>>>>,
}

impl HeartbeatScheduler {
    /// Create a new heartbeat scheduler
    pub fn new(agent_id: &str, config: HeartbeatConfig) -> Self {
        Self {
            agent_id: agent_id.to_string(),
            config,
            executor: Arc::new(HeartbeatExecutor::new()),
            state: Arc::new(RwLock::new(HeartbeatSchedulerState {
                is_running: false,
                agent_id: agent_id.to_string(),
                next_heartbeat_ms: None,
                last_result: None,
            })),
            shutdown_tx: Arc::new(RwLock::new(None)),
        }
    }

    /// Start the scheduler
    pub async fn start(&mut self) -> Result<(), SchedulerError> {
        if self.state.read().await.is_running {
            return Err(SchedulerError::AlreadyRunning);
        }

        let (tx, rx) = oneshot::channel();
        *self.shutdown_tx.write().await = Some(tx);

        let interval_ms = self.config.get_interval_ms();
        let agent_id = self.agent_id.clone();
        let executor = Arc::clone(&self.executor);
        let config = self.config.clone();
        let state = Arc::clone(&self.state);

        // Update state to running
        {
            let mut s = state.write().await;
            s.is_running = true;
            let now = chrono::Utc::now().timestamp_millis();
            s.next_heartbeat_ms = Some(now + interval_ms as i64);
        }

        // Spawn the scheduler loop
        tokio::spawn(async move {
            Self::scheduler_loop(agent_id, config, executor, state, rx).await;
        });

        Ok(())
    }

    /// Scheduler loop
    async fn scheduler_loop(
        agent_id: String,
        config: HeartbeatConfig,
        executor: Arc<HeartbeatExecutor>,
        state: Arc<RwLock<HeartbeatSchedulerState>>,
        mut shutdown_rx: oneshot::Receiver<()>,
    ) {
        let interval_ms = Duration::from_millis(config.get_interval_ms());
        let mut ticker = interval(interval_ms);

        loop {
            tokio::select! {
                _ = &mut shutdown_rx => {
                    tracing::info!("Heartbeat scheduler for {} received shutdown signal", agent_id);
                    break;
                }
                _ = ticker.tick() => {
                    // Check active hours
                    if let Some(ref active_hours) = config.active_hours {
                        let current_hour = chrono::Local::now().hour() as u8;
                        if !active_hours.is_active(current_hour) {
                            tracing::debug!("Skipping heartbeat for {} - outside active hours", agent_id);
                            continue;
                        }
                    }

                    // Execute heartbeat
                    tracing::info!("Executing scheduled heartbeat for {}", agent_id);
                    let result = executor.run_once(&config, &agent_id, Some("scheduled".to_string())).await;

                    match result {
                        Ok(run_result) => {
                            tracing::info!("Heartbeat for {} completed: {:?}", agent_id, run_result.status);
                            let mut s = state.write().await;
                            s.last_result = Some(run_result);
                            let now = chrono::Utc::now().timestamp_millis();
                            s.next_heartbeat_ms = Some(now + interval_ms.as_millis() as i64);
                        }
                        Err(e) => {
                            tracing::error!("Heartbeat for {} failed: {:?}", agent_id, e);
                        }
                    }
                }
            }
        }

        // Update state to not running
        let mut s = state.write().await;
        s.is_running = false;
        s.next_heartbeat_ms = None;
    }

    /// Stop the scheduler
    pub async fn stop(&mut self) -> Result<(), SchedulerError> {
        let tx = self.shutdown_tx.write().await.take();
        if tx.is_none() {
            return Err(SchedulerError::NotRunning);
        }

        let _ = tx.unwrap().send(());

        let mut state = self.state.write().await;
        state.is_running = false;
        state.next_heartbeat_ms = None;

        Ok(())
    }

    /// Trigger an immediate heartbeat
    pub async fn trigger_now(&self, reason: Option<String>) -> Result<HeartbeatRunResult, SchedulerError> {
        let state = self.state.read().await;
        if !state.is_running {
            return Err(SchedulerError::NotRunning);
        }

        let result = self.executor
            .run_once(&self.config, &self.agent_id, reason)
            .await
            .map_err(|e| SchedulerError::Other(e.to_string()))?;

        Ok(result)
    }

    /// Get scheduler state
    pub async fn get_state(&self) -> HeartbeatSchedulerState {
        self.state.read().await.clone()
    }

    /// Update configuration
    pub async fn update_config(&mut self, config: HeartbeatConfig) -> Result<(), SchedulerError> {
        let was_running = {
            let state = self.state.read().await;
            state.is_running
        };

        if was_running {
            self.stop().await?;
            self.config = config;
            self.start().await?;
        } else {
            self.config = config;
        }

        Ok(())
    }
}

/// Scheduler error
#[derive(Debug, thiserror::Error)]
pub enum SchedulerError {
    #[error("scheduler is already running")]
    AlreadyRunning,
    #[error("scheduler is not running")]
    NotRunning,
    #[error("scheduler error: {0}")]
    Other(String),
}

/// Heartbeat status info for frontend
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HeartbeatStatusInfo {
    /// Whether heartbeat is enabled
    pub enabled: bool,
    /// Whether scheduler is running
    pub is_running: bool,
    /// Next heartbeat time (Unix timestamp in millis)
    pub next_heartbeat_ms: Option<i64>,
    /// Last heartbeat status
    pub last_status: Option<String>,
    /// Last heartbeat duration in ms
    pub last_duration_ms: Option<u64>,
}

impl From<HeartbeatSchedulerState> for HeartbeatStatusInfo {
    fn from(state: HeartbeatSchedulerState) -> Self {
        Self {
            enabled: true,
            is_running: state.is_running,
            next_heartbeat_ms: state.next_heartbeat_ms,
            last_status: state.last_result.as_ref().map(|r| r.status.to_string()),
            last_duration_ms: state.last_result.as_ref().map(|r| r.duration_ms),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_scheduler_create() {
        let config = HeartbeatConfig::default();
        let scheduler = HeartbeatScheduler::new("test-agent", config);

        let state = scheduler.get_state().await;
        assert!(!state.is_running);
        assert_eq!(state.agent_id, "test-agent");
    }

    #[tokio::test]
    async fn test_scheduler_start_stop() {
        let config = HeartbeatConfig::default();
        let mut scheduler = HeartbeatScheduler::new("test-agent", config);

        assert!(scheduler.start().await.is_ok());
        let state = scheduler.get_state().await;
        assert!(state.is_running);

        assert!(scheduler.stop().await.is_ok());
        let state = scheduler.get_state().await;
        assert!(!state.is_running);
    }
}
