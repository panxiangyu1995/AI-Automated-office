//! Heartbeat events for status change notifications and audit logging.

use serde::{Deserialize, Serialize};

use super::executor::HeartbeatRunResult;
use super::parser::CheckItemStatus;
use super::preflight::SkipReason;

/// Heartbeat event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum HeartbeatEvent {
    /// Heartbeat started
    HeartbeatStarted {
        agent_id: String,
        reason: Option<String>,
        timestamp: i64,
    },
    /// Heartbeat skipped
    HeartbeatSkipped {
        agent_id: String,
        reason: SkipReason,
        timestamp: i64,
    },
    /// Heartbeat completed
    HeartbeatCompleted {
        agent_id: String,
        status: String,
        duration_ms: u64,
        timestamp: i64,
    },
    /// Heartbeat failed
    HeartbeatFailed {
        agent_id: String,
        error: String,
        timestamp: i64,
    },
    /// Check item status changed
    CheckItemStatusChanged {
        agent_id: String,
        item_id: String,
        old_status: CheckItemStatus,
        new_status: CheckItemStatus,
        timestamp: i64,
    },
    /// Notification sent
    NotificationSent {
        agent_id: String,
        channel: String,
        level: String,
        timestamp: i64,
    },
}

impl HeartbeatEvent {
    /// Create a heartbeat started event
    pub fn heartbeat_started(agent_id: &str, reason: Option<String>) -> Self {
        HeartbeatEvent::HeartbeatStarted {
            agent_id: agent_id.to_string(),
            reason,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    /// Create a heartbeat skipped event
    pub fn heartbeat_skipped(agent_id: &str, reason: SkipReason) -> Self {
        HeartbeatEvent::HeartbeatSkipped {
            agent_id: agent_id.to_string(),
            reason,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    /// Create a heartbeat completed event
    pub fn heartbeat_completed(agent_id: &str, result: &HeartbeatRunResult) -> Self {
        HeartbeatEvent::HeartbeatCompleted {
            agent_id: agent_id.to_string(),
            status: result.status.to_string(),
            duration_ms: result.duration_ms,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    /// Create a heartbeat failed event
    pub fn heartbeat_failed(agent_id: &str, error: &str) -> Self {
        HeartbeatEvent::HeartbeatFailed {
            agent_id: agent_id.to_string(),
            error: error.to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }
}

/// Event emitter for heartbeat events
pub struct HeartbeatEventEmitter;

impl HeartbeatEventEmitter {
    /// Emit a heartbeat event
    pub fn emit(event: &HeartbeatEvent) {
        tracing::info!("Heartbeat event: {:?}", event);
    }

    /// Emit multiple heartbeat events
    pub fn emit_all(events: &[HeartbeatEvent]) {
        for event in events {
            Self::emit(event);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heartbeat_started_event() {
        let event = HeartbeatEvent::heartbeat_started("agent-1", Some("manual".to_string()));
        match event {
            HeartbeatEvent::HeartbeatStarted { agent_id, reason, timestamp } => {
                assert_eq!(agent_id, "agent-1");
                assert_eq!(reason, Some("manual".to_string()));
                assert!(timestamp > 0);
            }
            _ => panic!("Expected HeartbeatStarted event"),
        }
    }
}
