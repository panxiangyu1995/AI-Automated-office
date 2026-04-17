//! Network reconnection logic with exponential backoff
//!
//! Implements:
//! - Exponential backoff retry strategy
//! - Online/offline state transitions
//! - Reconnection event notifications via Tauri events

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};
use tracing::info;

/// Reconnection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconnectConfig {
    /// Initial delay in milliseconds
    pub initial_delay_ms: u64,
    /// Maximum delay in milliseconds
    pub max_delay_ms: u64,
    /// Backoff multiplier
    pub multiplier: f64,
    /// Maximum retry attempts (0 = unlimited)
    pub max_retries: u32,
    /// Jitter factor (0.0 - 1.0) to prevent thundering herd
    pub jitter: f64,
}

impl Default for ReconnectConfig {
    fn default() -> Self {
        Self {
            initial_delay_ms: 1000,
            max_delay_ms: 30000,
            multiplier: 2.0,
            max_retries: 0,
            jitter: 0.1,
        }
    }
}

/// Current reconnection state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconnectState {
    /// Whether currently connected
    pub connected: bool,
    /// Current attempt number (0 = not retrying)
    pub attempt: u32,
    /// Current delay in ms
    pub current_delay_ms: u64,
    /// Total time spent reconnecting in ms
    pub total_reconnect_time_ms: u64,
    /// Last connected timestamp
    pub last_connected_at: Option<i64>,
    /// Last disconnected timestamp
    pub last_disconnected_at: Option<i64>,
}

impl Default for ReconnectState {
    fn default() -> Self {
        Self {
            connected: true,
            attempt: 0,
            current_delay_ms: 0,
            total_reconnect_time_ms: 0,
            last_connected_at: None,
            last_disconnected_at: None,
        }
    }
}

/// Reconnection event payload
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReconnectEvent {
    /// Connection lost, starting reconnection
    Disconnected { attempt: u32, next_delay_ms: u64 },
    /// Reconnection attempt in progress
    Reconnecting { attempt: u32, delay_ms: u64 },
    /// Successfully reconnected
    Connected { attempt: u32, total_time_ms: u64 },
    /// All retries exhausted
    Exhausted { total_attempts: u32, total_time_ms: u64 },
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Calculate backoff delay for a given attempt
pub fn calculate_backoff(attempt: u32, config: &ReconnectConfig) -> u64 {
    let base_delay = config.initial_delay_ms as f64 * config.multiplier.powi(attempt as i32);
    let capped = base_delay.min(config.max_delay_ms as f64);

    // Apply jitter: random value in [1-jitter, 1+jitter]
    let jitter_range = config.jitter * capped;
    // Use simple deterministic jitter based on attempt to avoid rand dependency
    let jitter_offset = if attempt % 2 == 0 {
        jitter_range * 0.5
    } else {
        -jitter_range * 0.5
    };

    let delay = (capped + jitter_offset).max(0.0) as u64;
    delay.max(config.initial_delay_ms)
}

/// Start the reconnection monitor
///
/// Periodically checks network status. When offline, enters exponential
/// backoff reconnection loop. Emits Tauri events for state transitions.
pub fn start_reconnect_monitor(
    app: AppHandle,
    config: ReconnectConfig,
    check_interval_secs: u64,
) {
    let state = Arc::new(RwLock::new(ReconnectState::default()));

    tauri::async_runtime::spawn(async move {
        loop {
            let is_online = super::status::check_network_status().await;
            let mut st = state.write().await;

            if is_online && !st.connected {
                // Transition: offline → online
                let total_time = st.total_reconnect_time_ms;
                let attempt = st.attempt;
                st.connected = true;
                st.attempt = 0;
                st.current_delay_ms = 0;
                st.last_connected_at = Some(now_millis());

                let _ = app.emit(
                    "network-reconnect",
                    ReconnectEvent::Connected {
                        attempt,
                        total_time_ms: total_time,
                    },
                );
                info!("Network reconnected after {} attempts ({}ms)", attempt, total_time);
            } else if !is_online && st.connected {
                // Transition: online → offline
                st.connected = false;
                st.attempt = 1;
                st.total_reconnect_time_ms = 0;
                st.last_disconnected_at = Some(now_millis());
                let delay = calculate_backoff(0, &config);
                st.current_delay_ms = delay;

                let _ = app.emit(
                    "network-reconnect",
                    ReconnectEvent::Disconnected {
                        attempt: 1,
                        next_delay_ms: delay,
                    },
                );
                info!("Network disconnected, starting reconnection (delay: {}ms)", delay);
            } else if !is_online && !st.connected {
                // Still offline, retry with backoff
                if config.max_retries == 0 || st.attempt < config.max_retries {
                    let delay = calculate_backoff(st.attempt, &config);
                    st.current_delay_ms = delay;
                    st.total_reconnect_time_ms += delay;

                    let _ = app.emit(
                        "network-reconnect",
                        ReconnectEvent::Reconnecting {
                            attempt: st.attempt,
                            delay_ms: delay,
                        },
                    );
                    st.attempt += 1;
                } else if st.attempt >= config.max_retries && config.max_retries > 0 {
                    // Exhausted all retries
                    let total_time = st.total_reconnect_time_ms;
                    let total_attempts = st.attempt;

                    let _ = app.emit(
                        "network-reconnect",
                        ReconnectEvent::Exhausted {
                            total_attempts,
                            total_time_ms: total_time,
                        },
                    );
                    info!("Reconnection exhausted after {} attempts", total_attempts);
                    // Reset attempt counter to allow future retries
                    st.attempt = 0;
                }
            }

            drop(st);

            // Wait before next check
            let st_read = state.read().await;
            let delay = if st_read.connected {
                Duration::from_secs(check_interval_secs)
            } else {
                Duration::from_millis(st_read.current_delay_ms)
            };
            drop(st_read);

            sleep(delay).await;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backoff_calculation() {
        let config = ReconnectConfig::default();

        let d0 = calculate_backoff(0, &config);
        let d1 = calculate_backoff(1, &config);
        let d2 = calculate_backoff(2, &config);

        // Each attempt should increase delay (approximately, with jitter)
        assert!(d1 >= d0 / 2); // Allow jitter to halve
        assert!(d2 >= d1 / 2);
    }

    #[test]
    fn test_backoff_capped_at_max() {
        let config = ReconnectConfig {
            initial_delay_ms: 1000,
            max_delay_ms: 5000,
            multiplier: 10.0,
            max_retries: 0,
            jitter: 0.0,
        };

        let d = calculate_backoff(10, &config);
        assert!(d <= config.max_delay_ms);
    }

    #[test]
    fn test_reconnect_state_default() {
        let state = ReconnectState::default();
        assert!(state.connected);
        assert_eq!(state.attempt, 0);
    }
}
