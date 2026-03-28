//! Runtime Metrics and Telemetry Module
//!
//! This module implements:
//! - Runtime metric collection points
//! - Telemetry persistence and aggregate queries
//! - Session and tenant level statistics
//! - Structured diagnostics for troubleshooting
//!
//! Story 55.3 - Runtime metrics and debug telemetry

use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Metric category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MetricCategory {
    Runtime,
    Tool,
    Llm,
    Storage,
    Network,
    User,
}

/// Metric unit type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MetricUnit {
    Count,
    Milliseconds,
    Bytes,
    Percentage,
    Ratio,
}

/// Single metric data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricPoint {
    pub id: String,
    pub name: String,
    pub category: MetricCategory,
    pub value: f64,
    pub unit: MetricUnit,
    pub timestamp: i64,
    pub session_id: Option<String>,
    pub tenant_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Aggregated metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedMetric {
    pub name: String,
    pub category: MetricCategory,
    pub count: i64,
    pub sum: f64,
    pub min: f64,
    pub max: f64,
    pub avg: f64,
    pub unit: MetricUnit,
}

/// Metric summary for a time window
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricSummary {
    pub metric_name: String,
    pub time_window_start: i64,
    pub time_window_end: i64,
    pub total_count: i64,
    pub success_count: i64,
    pub failure_count: i64,
    pub success_rate: f64,
    pub avg_duration_ms: Option<f64>,
    pub p50_ms: Option<f64>,
    pub p95_ms: Option<f64>,
    pub p99_ms: Option<f64>,
}

/// Diagnostic entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticEntry {
    pub id: String,
    pub trace_id: String,
    pub session_id: String,
    pub severity: String,
    pub component: String,
    pub message: String,
    pub context: Option<serde_json::Value>,
    pub created_at: i64,
}

/// Runtime statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeStats {
    pub total_sessions: i64,
    pub active_sessions: i64,
    pub total_messages: i64,
    pub total_tool_calls: i64,
    pub total_errors: i64,
    pub avg_response_time_ms: f64,
    pub success_rate: f64,
    pub uptime_seconds: i64,
}

/// Tenant statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantStats {
    pub tenant_id: String,
    pub total_sessions: i64,
    pub total_messages: i64,
    pub total_tool_calls: i64,
    pub total_errors: i64,
    pub success_rate: f64,
    pub period_start: i64,
    pub period_end: i64,
}

/// Session telemetry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionTelemetry {
    pub session_id: String,
    pub message_count: i64,
    pub tool_call_count: i64,
    pub error_count: i64,
    pub total_duration_ms: i64,
    pub avg_step_duration_ms: f64,
    pub first_message_at: Option<i64>,
    pub last_message_at: Option<i64>,
}

/// Telemetry store for database operations
pub struct TelemetryStore {
    pool: SqlitePool,
}

impl TelemetryStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Generate unique ID
    fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Record a metric point
    pub async fn record_metric(&self, metric: &MetricPoint) -> Result<()> {
        let metadata = metric
            .metadata
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO telemetry_metrics (
                id, name, category, value, unit, timestamp,
                session_id, tenant_id, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&metric.id)
        .bind(&metric.name)
        .bind(metric.category.to_string())
        .bind(metric.value)
        .bind(metric.unit.to_string())
        .bind(metric.timestamp)
        .bind(&metric.session_id)
        .bind(&metric.tenant_id)
        .bind(&metadata)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Record a diagnostic entry
    pub async fn record_diagnostic(&self, diagnostic: &DiagnosticEntry) -> Result<()> {
        let context = diagnostic
            .context
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO telemetry_diagnostics (
                id, trace_id, session_id, severity, component,
                message, context, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&diagnostic.id)
        .bind(&diagnostic.trace_id)
        .bind(&diagnostic.session_id)
        .bind(&diagnostic.severity)
        .bind(&diagnostic.component)
        .bind(&diagnostic.message)
        .bind(&context)
        .bind(diagnostic.created_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get metrics by name and time range
    pub async fn get_metrics_by_name(
        &self,
        name: &str,
        start_time: i64,
        end_time: i64,
    ) -> Result<Vec<MetricPoint>> {
        let rows = sqlx::query(
            "SELECT * FROM telemetry_metrics
             WHERE name = ? AND timestamp >= ? AND timestamp <= ?
             ORDER BY timestamp DESC;",
        )
        .bind(name)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_metric_point).collect())
    }

    /// Get metrics by session
    pub async fn get_metrics_by_session(&self, session_id: &str) -> Result<Vec<MetricPoint>> {
        let rows = sqlx::query(
            "SELECT * FROM telemetry_metrics
             WHERE session_id = ?
             ORDER BY timestamp DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_metric_point).collect())
    }

    /// Get diagnostics by session
    pub async fn get_diagnostics_by_session(&self, session_id: &str) -> Result<Vec<DiagnosticEntry>> {
        let rows = sqlx::query(
            "SELECT * FROM telemetry_diagnostics
             WHERE session_id = ?
             ORDER BY created_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_diagnostic_entry).collect())
    }

    /// Get diagnostics by trace
    pub async fn get_diagnostics_by_trace(&self, trace_id: &str) -> Result<Vec<DiagnosticEntry>> {
        let rows = sqlx::query(
            "SELECT * FROM telemetry_diagnostics
             WHERE trace_id = ?
             ORDER BY created_at DESC;",
        )
        .bind(trace_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_diagnostic_entry).collect())
    }

    /// Get aggregated metrics by name
    pub async fn get_aggregated_metrics(
        &self,
        name: &str,
        start_time: i64,
        end_time: i64,
    ) -> Result<AggregatedMetric> {
        let row = sqlx::query(
            "SELECT name, category, COUNT(*) as count,
                    SUM(value) as sum, MIN(value) as min,
                    MAX(value) as max, AVG(value) as avg, unit
             FROM telemetry_metrics
             WHERE name = ? AND timestamp >= ? AND timestamp <= ?
             GROUP BY name, category, unit;",
        )
        .bind(name)
        .bind(start_time)
        .bind(end_time)
        .fetch_one(&self.pool)
        .await?;

        Ok(AggregatedMetric {
            name: row.get("name"),
            category: parse_metric_category(&row.get::<String, _>("category")),
            count: row.get("count"),
            sum: row.get("sum"),
            min: row.get("min"),
            max: row.get("max"),
            avg: row.get("avg"),
            unit: parse_metric_unit(&row.get::<String, _>("unit")),
        })
    }
}

fn map_metric_point(row: sqlx::sqlite::SqliteRow) -> MetricPoint {
    let metadata: Option<String> = row.try_get("metadata").unwrap_or(None);

    MetricPoint {
        id: row.get("id"),
        name: row.get("name"),
        category: parse_metric_category(&row.get::<String, _>("category")),
        value: row.get("value"),
        unit: parse_metric_unit(&row.get::<String, _>("unit")),
        timestamp: row.get("timestamp"),
        session_id: row.get("session_id"),
        tenant_id: row.get("tenant_id"),
        metadata: metadata.and_then(|v| serde_json::from_str(&v).ok()),
    }
}

fn map_diagnostic_entry(row: sqlx::sqlite::SqliteRow) -> DiagnosticEntry {
    let context: Option<String> = row.try_get("context").unwrap_or(None);

    DiagnosticEntry {
        id: row.get("id"),
        trace_id: row.get("trace_id"),
        session_id: row.get("session_id"),
        severity: row.get("severity"),
        component: row.get("component"),
        message: row.get("message"),
        context: context.and_then(|v| serde_json::from_str(&v).ok()),
        created_at: row.get("created_at"),
    }
}

fn parse_metric_category(s: &str) -> MetricCategory {
    match s {
        "runtime" => MetricCategory::Runtime,
        "tool" => MetricCategory::Tool,
        "llm" => MetricCategory::Llm,
        "storage" => MetricCategory::Storage,
        "network" => MetricCategory::Network,
        "user" => MetricCategory::User,
        _ => MetricCategory::Runtime,
    }
}

fn parse_metric_unit(s: &str) -> MetricUnit {
    match s {
        "count" => MetricUnit::Count,
        "milliseconds" => MetricUnit::Milliseconds,
        "bytes" => MetricUnit::Bytes,
        "percentage" => MetricUnit::Percentage,
        "ratio" => MetricUnit::Ratio,
        _ => MetricUnit::Count,
    }
}

impl std::fmt::Display for MetricCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MetricCategory::Runtime => write!(f, "runtime"),
            MetricCategory::Tool => write!(f, "tool"),
            MetricCategory::Llm => write!(f, "llm"),
            MetricCategory::Storage => write!(f, "storage"),
            MetricCategory::Network => write!(f, "network"),
            MetricCategory::User => write!(f, "user"),
        }
    }
}

impl std::fmt::Display for MetricUnit {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MetricUnit::Count => write!(f, "count"),
            MetricUnit::Milliseconds => write!(f, "milliseconds"),
            MetricUnit::Bytes => write!(f, "bytes"),
            MetricUnit::Percentage => write!(f, "percentage"),
            MetricUnit::Ratio => write!(f, "ratio"),
        }
    }
}

/// Telemetry service for high-level operations
#[derive(Clone)]
pub struct TelemetryService {
    store: TelemetryStore,
    /// In-memory cache for quick access
    recent_metrics: Arc<RwLock<HashMap<String, Vec<MetricPoint>>>>,
    /// Start time for uptime calculation
    start_time: i64,
}

impl TelemetryService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            store: TelemetryStore::new(pool),
            recent_metrics: Arc::new(RwLock::new(HashMap::new())),
            start_time: Utc::now().timestamp(),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Record a metric with automatic categorization
    pub async fn record_metric_auto(
        &self,
        name: &str,
        value: f64,
        unit: MetricUnit,
        session_id: Option<&str>,
        tenant_id: Option<&str>,
    ) -> Result<MetricPoint> {
        let category = categorize_metric(name);

        let metric = MetricPoint {
            id: Self::generate_id("met"),
            name: name.to_string(),
            category,
            value,
            unit,
            timestamp: Utc::now().timestamp(),
            session_id: session_id.map(String::from),
            tenant_id: tenant_id.map(String::from),
            metadata: None,
        };

        self.store.record_metric(&metric).await?;

        // Update in-memory cache
        {
            let mut cache = self.recent_metrics.write().await;
            let key = name.to_string();
            let entry = cache.entry(key).or_insert_with(Vec::new);
            entry.push(metric.clone());
            // Keep only recent 100 entries per metric
            if entry.len() > 100 {
                entry.remove(0);
            }
        }

        Ok(metric)
    }

    /// Record a diagnostic
    pub async fn record_diagnostic(
        &self,
        trace_id: &str,
        session_id: &str,
        severity: &str,
        component: &str,
        message: &str,
    ) -> Result<DiagnosticEntry> {
        let diagnostic = DiagnosticEntry {
            id: Self::generate_id("diag"),
            trace_id: trace_id.to_string(),
            session_id: session_id.to_string(),
            severity: severity.to_string(),
            component: component.to_string(),
            message: message.to_string(),
            context: None,
            created_at: Utc::now().timestamp(),
        };

        self.store.record_diagnostic(&diagnostic).await?;
        Ok(diagnostic)
    }

    /// Get recent metrics from cache
    pub async fn get_recent_metrics(&self, name: &str) -> Vec<MetricPoint> {
        let cache = self.recent_metrics.read().await;
        cache.get(name).cloned().unwrap_or_default()
    }

    /// Record runtime metrics
    pub async fn record_runtime_metrics(
        &self,
        session_id: &str,
        step_duration_ms: f64,
        success: bool,
    ) -> Result<()> {
        // Record step duration
        self.record_metric_auto(
            "runtime.step.duration_ms",
            step_duration_ms,
            MetricUnit::Milliseconds,
            Some(session_id),
            None,
        )
        .await?;

        // Record success/failure count
        let metric_name = if success {
            "runtime.step.success"
        } else {
            "runtime.step.failure"
        };
        self.record_metric_auto(
            metric_name,
            1.0,
            MetricUnit::Count,
            Some(session_id),
            None,
        )
        .await?;

        Ok(())
    }

    /// Record tool call metrics
    pub async fn record_tool_metrics(
        &self,
        session_id: &str,
        tool_name: &str,
        duration_ms: f64,
        success: bool,
    ) -> Result<()> {
        // Record tool duration
        self.record_metric_auto(
            &format!("tool.{}.duration_ms", tool_name),
            duration_ms,
            MetricUnit::Milliseconds,
            Some(session_id),
            None,
        )
        .await?;

        // Record success/failure
        let metric_name = if success {
            "tool.execution.success"
        } else {
            "tool.execution.failure"
        };
        self.record_metric_auto(
            metric_name,
            1.0,
            MetricUnit::Count,
            Some(session_id),
            None,
        )
        .await?;

        Ok(())
    }

    /// Record LLM metrics
    pub async fn record_llm_metrics(
        &self,
        session_id: &str,
        prompt_tokens: i64,
        completion_tokens: i64,
        duration_ms: f64,
    ) -> Result<()> {
        self.record_metric_auto(
            "llm.prompt_tokens",
            prompt_tokens as f64,
            MetricUnit::Count,
            Some(session_id),
            None,
        )
        .await?;

        self.record_metric_auto(
            "llm.completion_tokens",
            completion_tokens as f64,
            MetricUnit::Count,
            Some(session_id),
            None,
        )
        .await?;

        self.record_metric_auto(
            "llm.duration_ms",
            duration_ms,
            MetricUnit::Milliseconds,
            Some(session_id),
            None,
        )
        .await?;

        Ok(())
    }

    /// Get runtime statistics
    pub async fn get_runtime_stats(&self, tenant_id: &str) -> Result<RuntimeStats> {
        let now = Utc::now().timestamp();
        let window_start = now - 3600; // Last hour

        // Get aggregated metrics
        let step_duration = self
            .store
            .get_aggregated_metrics("runtime.step.duration_ms", window_start, now)
            .await;

        let success_count: i64 = self
            .store
            .get_metrics_by_name("runtime.step.success", window_start, now)
            .await
            .map(|m| m.len() as i64)
            .unwrap_or(0);

        let failure_count: i64 = self
            .store
            .get_metrics_by_name("runtime.step.failure", window_start, now)
            .await
            .map(|m| m.len() as i64)
            .unwrap_or(0);

        let total_steps = success_count + failure_count;
        let success_rate = if total_steps > 0 {
            success_count as f64 / total_steps as f64
        } else {
            0.0
        };

        let avg_duration_ms = step_duration.map(|m| m.avg).unwrap_or(0.0);

        Ok(RuntimeStats {
            total_sessions: 0, // Would need session store query
            active_sessions: 0,
            total_messages: 0,
            total_tool_calls: 0,
            total_errors: failure_count,
            avg_response_time_ms: avg_duration_ms,
            success_rate,
            uptime_seconds: now - self.start_time,
        })
    }

    /// Emit structured diagnostic
    pub async fn emit_diagnostic(
        &self,
        trace_id: &str,
        session_id: &str,
        severity: &str,
        component: &str,
        message: &str,
        context_data: Option<HashMap<String, String>>,
    ) -> Result<()> {
        let context = context_data.map(serde_json::to_value).transpose()?;

        let diagnostic = DiagnosticEntry {
            id: Self::generate_id("diag"),
            trace_id: trace_id.to_string(),
            session_id: session_id.to_string(),
            severity: severity.to_string(),
            component: component.to_string(),
            message: message.to_string(),
            context,
            created_at: Utc::now().timestamp(),
        };

        self.store.record_diagnostic(&diagnostic).await?;

        // Also emit to tracing for real-time monitoring
        match severity {
            "critical" | "error" => {
                tracing::error!(
                    trace_id = %trace_id,
                    session_id = %session_id,
                    component = %component,
                    message = %message,
                    "diagnostic emitted"
                );
            }
            "warning" => {
                tracing::warn!(
                    trace_id = %trace_id,
                    session_id = %session_id,
                    component = %component,
                    message = %message,
                    "diagnostic emitted"
                );
            }
            _ => {
                tracing::info!(
                    trace_id = %trace_id,
                    session_id = %session_id,
                    component = %component,
                    message = %message,
                    "diagnostic emitted"
                );
            }
        }

        Ok(())
    }
}

/// Categorize metric by name
fn categorize_metric(name: &str) -> MetricCategory {
    if name.starts_with("runtime.") {
        MetricCategory::Runtime
    } else if name.starts_with("tool.") {
        MetricCategory::Tool
    } else if name.starts_with("llm.") {
        MetricCategory::Llm
    } else if name.starts_with("storage.") {
        MetricCategory::Storage
    } else if name.starts_with("network.") {
        MetricCategory::Network
    } else {
        MetricCategory::User
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categorize_metric() {
        assert_eq!(categorize_metric("runtime.step.duration_ms"), MetricCategory::Runtime);
        assert_eq!(categorize_metric("tool.execution.success"), MetricCategory::Tool);
        assert_eq!(categorize_metric("llm.prompt_tokens"), MetricCategory::Llm);
        assert_eq!(categorize_metric("storage.query.duration_ms"), MetricCategory::Storage);
        assert_eq!(categorize_metric("network.request.duration_ms"), MetricCategory::Network);
        assert_eq!(categorize_metric("user.action.count"), MetricCategory::User);
    }

    #[test]
    fn test_metric_category_display() {
        assert_eq!(MetricCategory::Runtime.to_string(), "runtime");
        assert_eq!(MetricCategory::Tool.to_string(), "tool");
        assert_eq!(MetricCategory::Llm.to_string(), "llm");
    }

    #[test]
    fn test_parse_metric_category() {
        assert_eq!(parse_metric_category("runtime"), MetricCategory::Runtime);
        assert_eq!(parse_metric_category("tool"), MetricCategory::Tool);
        assert_eq!(parse_metric_category("unknown"), MetricCategory::Runtime);
    }
}
