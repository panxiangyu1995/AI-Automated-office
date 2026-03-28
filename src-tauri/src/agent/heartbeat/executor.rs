//! Heartbeat executor for running heartbeat checks.

use std::time::Instant;

use serde::{Deserialize, Serialize};

use super::config::HeartbeatConfig;
use super::delivery::{DeliveryService, HeartbeatNotification, NotificationLevel};
use super::events::{HeartbeatEvent, HeartbeatEventEmitter};
use super::parser::{CheckItemStatus, HeartbeatMdContent};
use super::preflight::{HeartbeatPreflight, PreflightResult, SessionInfo};

/// Heartbeat execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatRunResult {
    /// Execution status
    pub status: HeartbeatStatus,
    /// Reason for the status
    pub reason: Option<String>,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
    /// Whether this was a silent run
    pub silent: bool,
    /// Notification to send
    pub notification: Option<HeartbeatNotification>,
    /// Check results
    pub check_results: Vec<CheckResult>,
}

/// Heartbeat status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HeartbeatStatus {
    Skipped,
    OkEmpty,
    OkToken,
    Sent,
    Failed,
}

impl std::fmt::Display for HeartbeatStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HeartbeatStatus::Skipped => write!(f, "skipped"),
            HeartbeatStatus::OkEmpty => write!(f, "ok_empty"),
            HeartbeatStatus::OkToken => write!(f, "ok_token"),
            HeartbeatStatus::Sent => write!(f, "sent"),
            HeartbeatStatus::Failed => write!(f, "failed"),
        }
    }
}

/// Result of a single check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckResult {
    /// Check item ID
    pub item_id: String,
    /// Check description
    pub description: String,
    /// Whether the check passed
    pub passed: bool,
    /// Warning message if any
    pub warning: Option<String>,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
}

/// Heartbeat executor
pub struct HeartbeatExecutor {
    delivery_service: DeliveryService,
}

impl HeartbeatExecutor {
    /// Create a new heartbeat executor
    pub fn new() -> Self {
        Self {
            delivery_service: DeliveryService::new(),
        }
    }

    /// Execute heartbeat once
    pub async fn run_once(
        &self,
        config: &HeartbeatConfig,
        agent_id: &str,
        reason: Option<String>,
    ) -> Result<HeartbeatRunResult, HeartbeatError> {
        let started_at = Instant::now();
        let mut events = Vec::new();

        // Emit started event
        events.push(HeartbeatEvent::heartbeat_started(agent_id, reason.clone()));

        // Run preflight checks
        let preflight = HeartbeatPreflight::run(config, agent_id, reason.clone()).await;

        // Add preflight events
        let preflight_events = preflight.events.clone();
        events.extend(preflight_events);

        // If preflight says skip, return early
        if preflight.skip {
            let result = HeartbeatRunResult {
                status: HeartbeatStatus::Skipped,
                reason: preflight.skip_reason.map(|r| r.to_string()),
                duration_ms: started_at.elapsed().as_millis() as u64,
                silent: true,
                notification: None,
                check_results: vec![],
            };

            events.push(HeartbeatEvent::heartbeat_completed(agent_id, &result));
            HeartbeatEventEmitter::emit_all(&events);

            return Ok(result);
        }

        // Execute heartbeat checks
        let check_results = self.execute_checks(&preflight).await;

        // Determine status based on check results
        let (status, notification) = self.process_results(&check_results, config);

        let result = HeartbeatRunResult {
            status,
            reason: Some(format!("{} checks executed", check_results.len())),
            duration_ms: started_at.elapsed().as_millis() as u64,
            silent: notification.is_none(),
            notification,
            check_results,
        };

        // Emit completed event
        events.push(HeartbeatEvent::heartbeat_completed(agent_id, &result));
        HeartbeatEventEmitter::emit_all(&events);

        Ok(result)
    }

    /// Execute all heartbeat checks
    async fn execute_checks(&self, preflight: &PreflightResult) -> Vec<CheckResult> {
        let mut results = Vec::new();

        if let Some(ref md) = preflight.heartbeat_md {
            for item in &md.check_items {
                let started = Instant::now();

                // Skip already passed items
                if item.status == CheckItemStatus::Passed {
                    continue;
                }

                let passed = self.execute_single_check(item, &preflight.session).await;
                let duration = started.elapsed().as_millis() as u64;

                results.push(CheckResult {
                    item_id: item.id.clone(),
                    description: item.description.clone(),
                    passed,
                    warning: None,
                    duration_ms: duration,
                });
            }
        }

        results
    }

    /// Execute a single check
    async fn execute_single_check(
        &self,
        item: &super::parser::CheckItem,
        _session: &SessionInfo,
    ) -> bool {
        item.status == CheckItemStatus::Passed
    }

    /// Process check results and determine status
    fn process_results(
        &self,
        check_results: &[CheckResult],
        config: &HeartbeatConfig,
    ) -> (HeartbeatStatus, Option<HeartbeatNotification>) {
        if check_results.is_empty() {
            return (HeartbeatStatus::OkEmpty, None);
        }

        let all_passed = check_results.iter().all(|r| r.passed);
        let any_failed = check_results.iter().any(|r| !r.passed);

        if any_failed {
            let notification = self.create_notification(check_results, NotificationLevel::Error);
            (HeartbeatStatus::Failed, Some(notification))
        } else if all_passed {
            if config.delivery_target.is_some() {
                let notification = self.create_notification(check_results, NotificationLevel::Info);
                (HeartbeatStatus::Sent, Some(notification))
            } else {
                (HeartbeatStatus::OkToken, None)
            }
        } else {
            (HeartbeatStatus::OkToken, None)
        }
    }

    /// Create notification from check results
    fn create_notification(
        &self,
        check_results: &[CheckResult],
        level: NotificationLevel,
    ) -> HeartbeatNotification {
        let passed_count = check_results.iter().filter(|r| r.passed).count();
        let total_count = check_results.len();

        HeartbeatNotification {
            title: format!("Heartbeat Check: {}/{} passed", passed_count, total_count),
            content: check_results
                .iter()
                .map(|r| format!("- {}: {}", r.description, if r.passed { "OK" } else { "FAILED" }))
                .collect::<Vec<_>>()
                .join("\n"),
            level,
            channel: "system".to_string(),
        }
    }
}

impl Default for HeartbeatExecutor {
    fn default() -> Self {
        Self::new()
    }
}

/// Heartbeat execution error
#[derive(Debug, thiserror::Error)]
pub enum HeartbeatError {
    #[error("heartbeat execution failed: {0}")]
    ExecutionFailed(String),
    #[error("heartbeat configuration error: {0}")]
    ConfigError(String),
    #[error("heartbeat preflight failed: {0}")]
    PreflightFailed(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_executor_disabled() {
        let config = HeartbeatConfig {
            enabled: false,
            ..Default::default()
        };
        let executor = HeartbeatExecutor::new();

        let result = executor.run_once(&config, "test-agent", None).await;
        assert!(result.is_ok());
        let result = result.unwrap();
        assert_eq!(result.status, HeartbeatStatus::Skipped);
        assert!(result.silent);
    }
}
