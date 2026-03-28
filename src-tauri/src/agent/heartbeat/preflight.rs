//! Heartbeat preflight checks before execution.

use chrono::Timelike;
use serde::{Deserialize, Serialize};

use super::config::HeartbeatConfig;
use super::events::HeartbeatEvent;
use super::parser::{HeartbeatMdContent, HeartbeatMdParser};

/// Skip reason for heartbeat
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SkipReason {
    Disabled,
    QuietHours,
    RequestsInFlight,
    HeartbeatMdSkip,
    NoTrigger,
    EmptyChecklist,
    ResourceUnavailable,
    ContextBudgetExceeded,
}

impl std::fmt::Display for SkipReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SkipReason::Disabled => write!(f, "disabled"),
            SkipReason::QuietHours => write!(f, "quiet-hours"),
            SkipReason::RequestsInFlight => write!(f, "requests-in-flight"),
            SkipReason::HeartbeatMdSkip => write!(f, "heartbeat-md-skip"),
            SkipReason::NoTrigger => write!(f, "no-trigger"),
            SkipReason::EmptyChecklist => write!(f, "empty-checklist"),
            SkipReason::ResourceUnavailable => write!(f, "resource-unavailable"),
            SkipReason::ContextBudgetExceeded => write!(f, "context-budget-exceeded"),
        }
    }
}

/// Preflight result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreflightResult {
    /// Whether to skip heartbeat execution
    pub skip: bool,
    /// Skip reason if skipped
    pub skip_reason: Option<SkipReason>,
    /// HEARTBEAT.md content
    pub heartbeat_md: Option<HeartbeatMdContent>,
    /// Session information
    pub session: SessionInfo,
    /// Events to emit
    pub events: Vec<HeartbeatEvent>,
}

/// Session information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    /// Session ID
    pub session_id: String,
    /// Agent ID
    pub agent_id: String,
    /// Whether session is active
    pub is_active: bool,
    /// Current context size
    pub context_size: usize,
    /// Maximum context budget
    pub max_context_budget: usize,
}

/// Preflight checker
pub struct HeartbeatPreflight;

impl HeartbeatPreflight {
    /// Run all preflight checks
    pub async fn run(
        config: &HeartbeatConfig,
        agent_id: &str,
        reason: Option<String>,
    ) -> PreflightResult {
        let session = Self::get_session_info(agent_id);
        let mut events = Vec::new();

        // 1. Check if heartbeat is enabled
        if !config.enabled {
            events.push(HeartbeatEvent::heartbeat_skipped(agent_id, SkipReason::Disabled));
            return PreflightResult {
                skip: true,
                skip_reason: Some(SkipReason::Disabled),
                heartbeat_md: None,
                session,
                events,
            };
        }

        // 2. Check active hours
        if let Some(ref active_hours) = config.active_hours {
            let current_hour = Self::get_current_hour(config.timezone.as_deref());
            if !active_hours.is_active(current_hour) {
                events.push(HeartbeatEvent::heartbeat_skipped(agent_id, SkipReason::QuietHours));
                return PreflightResult {
                    skip: true,
                    skip_reason: Some(SkipReason::QuietHours),
                    heartbeat_md: None,
                    session,
                    events,
                };
            }
        }

        // 3. Check if there are requests in flight
        if Self::has_requests_in_flight() {
            events.push(HeartbeatEvent::heartbeat_skipped(agent_id, SkipReason::RequestsInFlight));
            return PreflightResult {
                skip: true,
                skip_reason: Some(SkipReason::RequestsInFlight),
                heartbeat_md: None,
                session,
                events,
            };
        }

        // 4. Check context budget
        if session.context_size > session.max_context_budget {
            events.push(HeartbeatEvent::heartbeat_skipped(agent_id, SkipReason::ContextBudgetExceeded));
            return PreflightResult {
                skip: true,
                skip_reason: Some(SkipReason::ContextBudgetExceeded),
                heartbeat_md: None,
                session,
                events,
            };
        }

        // 5. Parse HEARTBEAT.md if present
        let heartbeat_md = Self::parse_heartbeat_md(agent_id).await;

        // 6. Check if HEARTBEAT.md says to skip
        if let Some(ref md) = heartbeat_md {
            if md.skip {
                events.push(HeartbeatEvent::heartbeat_skipped(agent_id, SkipReason::HeartbeatMdSkip));
                return PreflightResult {
                    skip: true,
                    skip_reason: Some(SkipReason::HeartbeatMdSkip),
                    heartbeat_md,
                    session,
                    events,
                };
            }

            // 7. Check if checklist is empty
            if md.check_items.is_empty() {
                events.push(HeartbeatEvent::heartbeat_skipped(agent_id, SkipReason::EmptyChecklist));
                return PreflightResult {
                    skip: true,
                    skip_reason: Some(SkipReason::EmptyChecklist),
                    heartbeat_md,
                    session,
                    events,
                };
            }
        }

        // 8. Check if there is a trigger reason
        let has_trigger = reason.is_some() || !events.is_empty() || heartbeat_md.is_some();
        if !has_trigger {
            events.push(HeartbeatEvent::heartbeat_skipped(agent_id, SkipReason::NoTrigger));
            return PreflightResult {
                skip: true,
                skip_reason: Some(SkipReason::NoTrigger),
                heartbeat_md,
                session,
                events,
            };
        }

        PreflightResult {
            skip: false,
            skip_reason: None,
            heartbeat_md,
            session,
            events,
        }
    }

    /// Get current session information
    fn get_session_info(agent_id: &str) -> SessionInfo {
        SessionInfo {
            session_id: format!("session-{}", agent_id),
            agent_id: agent_id.to_string(),
            is_active: true,
            context_size: 0,
            max_context_budget: 100_000,
        }
    }

    /// Get current hour based on timezone
    fn get_current_hour(_timezone: Option<&str>) -> u8 {
        chrono::Local::now().hour() as u8
    }

    /// Check if there are requests in flight
    fn has_requests_in_flight() -> bool {
        false
    }

    /// Parse HEARTBEAT.md file
    async fn parse_heartbeat_md(_agent_id: &str) -> Option<HeartbeatMdContent> {
        let workspace_path = std::path::PathBuf::from(".");
        let heartbeat_path = workspace_path.join("HEARTBEAT.md");

        if !heartbeat_path.exists() {
            return None;
        }

        match tokio::fs::read_to_string(&heartbeat_path).await {
            Ok(content) => Some(HeartbeatMdParser::parse(&content)),
            Err(_) => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_preflight_disabled() {
        let config = HeartbeatConfig {
            enabled: false,
            ..Default::default()
        };

        let result = HeartbeatPreflight::run(&config, "test-agent", None).await;
        assert!(result.skip);
        assert_eq!(result.skip_reason, Some(SkipReason::Disabled));
    }
}
