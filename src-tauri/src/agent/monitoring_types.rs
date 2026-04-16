//! Monitoring module type definitions
//!
//! Contains types, enums, and structs for sub-agent monitoring and diagnostics.

use crate::agent::execution::SubAgentStatus;
use crate::agent::nested::NestedCallRecord;
use crate::agent::result::MergedResultRecord;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Sub-Agent metrics for monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentMetrics {
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub total_calls: i64,
    pub successful_calls: i64,
    pub failed_calls: i64,
    pub timeout_calls: i64,
    pub average_latency_ms: f64,
    pub total_latency_ms: i64,
    pub min_latency_ms: i64,
    pub max_latency_ms: i64,
    pub estimated_tokens_used: i64,
    pub last_called_at: Option<i64>,
}

/// Session-level Sub-Agent statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSubAgentStats {
    pub session_id: String,
    pub total_nested_calls: i64,
    pub max_depth_reached: i32,
    pub active_sub_agents: Vec<SubAgentSummary>,
    pub metrics_summary: MetricsSummary,
}

/// Sub-Agent summary for quick reference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentSummary {
    pub execution_id: String,
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub status: String,
    pub depth: i32,
    pub started_at: i64,
}

/// Metrics summary for a session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsSummary {
    pub total_calls: i64,
    pub success_rate: f64,
    pub average_latency_ms: f64,
    pub estimated_token_usage: i64,
    pub active_count: i64,
}

/// Diagnostic entry for troubleshooting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticEntry {
    pub id: String,
    pub timestamp: i64,
    pub severity: DiagnosticSeverity,
    pub category: DiagnosticCategory,
    pub execution_id: Option<String>,
    pub session_id: Option<String>,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

/// Diagnostic severity levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DiagnosticSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

impl std::fmt::Display for DiagnosticSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DiagnosticSeverity::Info => write!(f, "info"),
            DiagnosticSeverity::Warning => write!(f, "warning"),
            DiagnosticSeverity::Error => write!(f, "error"),
            DiagnosticSeverity::Critical => write!(f, "critical"),
        }
    }
}

/// Diagnostic categories
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DiagnosticCategory {
    Performance,
    Failure,
    Security,
    Resource,
    Timeout,
    Loop,
    Permission,
    Integration,
}

impl std::fmt::Display for DiagnosticCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DiagnosticCategory::Performance => write!(f, "performance"),
            DiagnosticCategory::Failure => write!(f, "failure"),
            DiagnosticCategory::Security => write!(f, "security"),
            DiagnosticCategory::Resource => write!(f, "resource"),
            DiagnosticCategory::Timeout => write!(f, "timeout"),
            DiagnosticCategory::Loop => write!(f, "loop"),
            DiagnosticCategory::Permission => write!(f, "permission"),
            DiagnosticCategory::Integration => write!(f, "integration"),
        }
    }
}

/// Monitoring configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    pub enable_latency_tracking: bool,
    pub enable_token_estimation: bool,
    pub latency_warning_threshold_ms: i64,
    pub latency_error_threshold_ms: i64,
    pub max_concurrent_sub_agents: i32,
    pub enable_loop_detection_alerts: bool,
    pub enable_permission_audit: bool,
}

impl Default for MonitoringConfig {
    fn default() -> Self {
        Self {
            enable_latency_tracking: true,
            enable_token_estimation: true,
            latency_warning_threshold_ms: 5000,
            latency_error_threshold_ms: 30000,
            max_concurrent_sub_agents: 10,
            enable_loop_detection_alerts: true,
            enable_permission_audit: true,
        }
    }
}

// ============================================================================
// Trace and Span Types (Task 183)
// ============================================================================

/// Trace representing a complete execution chain
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trace {
    pub trace_id: String,
    pub session_id: String,
    pub root_span_id: String,
    pub started_at: i64,
    pub finished_at: Option<i64>,
    pub total_duration_ms: Option<i64>,
    pub status: TraceStatus,
    pub spans: Vec<Span>,
    pub metadata: Option<TraceMetadata>,
}

/// Trace execution status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TraceStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// Trace metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceMetadata {
    pub user_id: Option<String>,
    pub tenant_id: Option<String>,
    pub agent_id: Option<String>,
    pub model_used: Option<String>,
    pub total_tokens: Option<i64>,
}

/// Span representing a single operation within a trace
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Span {
    pub span_id: String,
    pub parent_span_id: Option<String>,
    pub trace_id: String,
    pub operation_name: String,
    pub span_type: SpanType,
    pub started_at: i64,
    pub finished_at: Option<i64>,
    pub duration_ms: Option<i64>,
    pub status: SpanStatus,
    pub attributes: Vec<SpanAttribute>,
    pub events: Vec<SpanEvent>,
    pub children: Vec<String>,  // child span IDs
}

/// Type of span operation
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SpanType {
    LlmCall,
    ToolExecution,
    SubAgentCall,
    UserInteraction,
    SystemEvent,
    Custom,
}

/// Span execution status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SpanStatus {
    Ok,
    Error,
    Timeout,
}

/// Key-value attribute for spans
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpanAttribute {
    pub key: String,
    pub value: AttributeValue,
}

/// Attribute value types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum AttributeValue {
    String(String),
    Number(f64),
    Boolean(bool),
}

/// Events that happen during a span
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpanEvent {
    pub name: String,
    pub timestamp: i64,
    pub attributes: Vec<SpanAttribute>,
}
