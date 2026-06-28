//! Simple Monitoring - Unified monitoring facade
//!
//! This module provides a simplified, unified monitoring interface.
//! It combines the functionality of monitoring, events, and audit into one cohesive API.
//!
//! Design principle: KISS - one module for monitoring, not five.
//!
//! Usage:
//! ```ignore
//! let monitor = SimpleMonitor::new();
//! monitor.emit_event("agent_start", serde_json::json!({...}));
//! monitor.record_metric("token_usage", 1500.0);
//! ```

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

// ============================================================================
// Event Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventType {
    SessionStart,
    SessionEnd,
    MessageStart,
    MessageEnd,
    ToolCallStart,
    ToolCallEnd,
    Error,
    Custom(String),
}

#[derive(Debug, Clone)]
pub struct Event {
    pub event_type: EventType,
    pub timestamp: DateTime<Utc>,
    pub data: serde_json::Value,
}

impl Event {
    pub fn new(event_type: EventType, data: serde_json::Value) -> Self {
        Self {
            event_type,
            timestamp: Utc::now(),
            data,
        }
    }
}

// ============================================================================
// Metric Types
// ============================================================================

#[derive(Debug, Clone)]
pub struct Metric {
    pub name: String,
    pub value: f64,
    pub unit: String,
    pub timestamp: DateTime<Utc>,
}

// ============================================================================
// SimpleMonitor - Unified monitoring facade
// ============================================================================

#[derive(Clone)]
pub struct SimpleMonitor {
    events: Arc<RwLock<Vec<Event>>>,
    metrics: Arc<RwLock<Vec<Metric>>>,
    enabled: bool,
}

impl SimpleMonitor {
    pub fn new() -> Self {
        Self {
            events: Arc::new(RwLock::new(Vec::new())),
            metrics: Arc::new(RwLock::new(Vec::new())),
            enabled: true,
        }
    }

    pub fn with_enabled(mut self, enabled: bool) -> Self {
        self.enabled = enabled;
        self
    }

    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Emit a monitoring event.
    pub async fn emit(&self, event_type: EventType, data: serde_json::Value) {
        if !self.enabled {
            return;
        }
        let event = Event::new(event_type, data);
        let mut events = self.events.write().await;
        events.push(event);

        // Keep last 1000 events to avoid unbounded memory growth
        if events.len() > 1000 {
            let drain_count = events.len() - 1000;
            events.drain(0..drain_count);
        }
    }

    /// Record a metric value.
    pub async fn record(&self, name: &str, value: f64, unit: &str) {
        if !self.enabled {
            return;
        }
        let metric = Metric {
            name: name.to_string(),
            value,
            unit: unit.to_string(),
            timestamp: Utc::now(),
        };
        let mut metrics = self.metrics.write().await;
        metrics.push(metric);

        // Keep last 10000 metrics
        if metrics.len() > 10000 {
            let drain_count = metrics.len() - 10000;
            metrics.drain(0..drain_count);
        }
    }

    /// Get all stored events.
    pub async fn get_events(&self) -> Vec<Event> {
        self.events.read().await.clone()
    }

    /// Get all stored metrics.
    pub async fn get_metrics(&self) -> Vec<Metric> {
        self.metrics.read().await.clone()
    }

    /// Get metrics by name.
    pub async fn get_metrics_by_name(&self, name: &str) -> Vec<Metric> {
        self.metrics
            .read()
            .await
            .iter()
            .filter(|m| m.name == name)
            .cloned()
            .collect()
    }

    /// Get event count.
    pub async fn event_count(&self) -> usize {
        self.events.read().await.len()
    }

    /// Get metric count.
    pub async fn metric_count(&self) -> usize {
        self.metrics.read().await.len()
    }

    /// Clear all stored events and metrics.
    pub async fn clear(&self) {
        self.events.write().await.clear();
        self.metrics.write().await.clear();
    }
}

impl Default for SimpleMonitor {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Convenience Methods
// ============================================================================

impl SimpleMonitor {
    pub async fn session_start(&self, session_id: &str, user_id: &str) {
        self.emit(
            EventType::SessionStart,
            serde_json::json!({
                "session_id": session_id,
                "user_id": user_id,
            }),
        )
        .await;
    }

    pub async fn session_end(&self, session_id: &str, reason: &str, duration_ms: i64) {
        self.emit(
            EventType::SessionEnd,
            serde_json::json!({
                "session_id": session_id,
                "reason": reason,
                "duration_ms": duration_ms,
            }),
        )
        .await;
    }

    pub async fn error(&self, code: &str, message: &str, recoverable: bool) {
        self.emit(
            EventType::Error,
            serde_json::json!({
                "code": code,
                "message": message,
                "recoverable": recoverable,
            }),
        )
        .await;
    }

    pub async fn tool_call(&self, tool_name: &str, success: bool, duration_ms: u64) {
        self.emit(
            EventType::ToolCallEnd,
            serde_json::json!({
                "tool_name": tool_name,
                "success": success,
                "duration_ms": duration_ms,
            }),
        )
        .await;
    }

    pub async fn token_usage(&self, prompt_tokens: u32, completion_tokens: u32) {
        self.record(
            "token_usage.total",
            (prompt_tokens + completion_tokens) as f64,
            "tokens",
        )
        .await;
        self.record("token_usage.prompt", prompt_tokens as f64, "tokens")
            .await;
        self.record(
            "token_usage.completion",
            completion_tokens as f64,
            "tokens",
        )
        .await;
    }

    pub async fn latency(&self, operation: &str, duration_ms: u64) {
        self.record(&format!("latency.{}", operation), duration_ms as f64, "ms")
            .await;
    }
}
