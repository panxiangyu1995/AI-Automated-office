//! Sub-Agent Monitoring and Diagnostics Module
//!
//! This module implements:
//! - Metrics for Sub-Agent latency, failure rate, and token usage
//! - Connection to shared telemetry and trace stack
//! - Inspection by main session, child call, and role template
//! - Diagnostics for multi-agent troubleshooting
//! - Permission leak prevention verification
//!
//! Story 52.5 - Sub-Agent monitoring and diagnostics

use crate::agent::execution::SubAgentStatus;
use crate::agent::nested::NestedCallRecord;
use crate::agent::result::MergedResultRecord;
use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

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

/// Monitoring service for Sub-Agent diagnostics
#[derive(Clone)]
pub struct SubAgentMonitoringService {
    /// Metrics cache: sub_agent_id -> SubAgentMetrics
    metrics_cache: Arc<RwLock<HashMap<String, SubAgentMetrics>>>,
    /// Recent diagnostics: session_id -> Vec<DiagnosticEntry>
    diagnostics: Arc<RwLock<HashMap<String, Vec<DiagnosticEntry>>>>,
    /// Active Sub-Agent executions: execution_id -> status
    active_executions: Arc<RwLock<HashMap<String, ExecutionStatus>>>,
    /// Configuration
    config: Arc<RwLock<MonitoringConfig>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ExecutionStatus {
    pub execution_id: String,
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub started_at: i64,
    pub depth: i32,
    pub status: String,
}

impl SubAgentMonitoringService {
    pub fn new() -> Self {
        Self {
            metrics_cache: Arc::new(RwLock::new(HashMap::new())),
            diagnostics: Arc::new(RwLock::new(HashMap::new())),
            active_executions: Arc::new(RwLock::new(HashMap::new())),
            config: Arc::new(RwLock::new(MonitoringConfig::default())),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Update monitoring configuration
    pub async fn update_config(&self, config: MonitoringConfig) {
        let mut c = self.config.write().await;
        *c = config;
    }

    /// Get current configuration
    pub async fn get_config(&self) -> MonitoringConfig {
        let c = self.config.read().await;
        c.clone()
    }

    /// Record Sub-Agent execution start
    pub async fn record_execution_start(
        &self,
        execution_id: &str,
        sub_agent_id: &str,
        sub_agent_name: &str,
        depth: i32,
    ) -> Result<()> {
        // Update active executions
        {
            let mut active = self.active_executions.write().await;
            active.insert(
                execution_id.to_string(),
                ExecutionStatus {
                    execution_id: execution_id.to_string(),
                    sub_agent_id: sub_agent_id.to_string(),
                    sub_agent_name: sub_agent_name.to_string(),
                    started_at: Utc::now().timestamp(),
                    depth,
                    status: "running".to_string(),
                },
            );
        }

        // Update metrics
        {
            let mut metrics = self.metrics_cache.write().await;
            let entry = metrics
                .entry(sub_agent_id.to_string())
                .or_insert_with(|| SubAgentMetrics {
                    sub_agent_id: sub_agent_id.to_string(),
                    sub_agent_name: sub_agent_name.to_string(),
                    total_calls: 0,
                    successful_calls: 0,
                    failed_calls: 0,
                    timeout_calls: 0,
                    average_latency_ms: 0.0,
                    total_latency_ms: 0,
                    min_latency_ms: i64::MAX,
                    max_latency_ms: 0,
                    estimated_tokens_used: 0,
                    last_called_at: None,
                });
            entry.total_calls += 1;
            entry.last_called_at = Some(Utc::now().timestamp());
        }

        Ok(())
    }

    /// Record Sub-Agent execution completion
    pub async fn record_execution_complete(
        &self,
        execution_id: &str,
        sub_agent_id: &str,
        status: &SubAgentStatus,
        duration_ms: i64,
        estimated_tokens: Option<i64>,
    ) -> Result<()> {
        // Remove from active executions
        {
            let mut active = self.active_executions.write().await;
            if let Some(exec) = active.get_mut(execution_id) {
                exec.status = status.to_string();
            }
        }

        // Check latency thresholds and emit diagnostics if needed
        let config = self.get_config().await;
        if config.enable_latency_tracking {
            if duration_ms > config.latency_error_threshold_ms {
                self.emit_diagnostic(
                    Some(execution_id.to_string()),
                    None,
                    DiagnosticSeverity::Error,
                    DiagnosticCategory::Performance,
                    format!(
                        "Sub-Agent {} latency {}ms exceeds error threshold {}ms",
                        sub_agent_id, duration_ms, config.latency_error_threshold_ms
                    ),
                    None,
                )
                .await?;
            } else if duration_ms > config.latency_warning_threshold_ms {
                self.emit_diagnostic(
                    Some(execution_id.to_string()),
                    None,
                    DiagnosticSeverity::Warning,
                    DiagnosticCategory::Performance,
                    format!(
                        "Sub-Agent {} latency {}ms exceeds warning threshold {}ms",
                        sub_agent_id, duration_ms, config.latency_warning_threshold_ms
                    ),
                    None,
                )
                .await?;
            }
        }

        // Update metrics with completion data
        {
            let mut metrics = self.metrics_cache.write().await;
            if let Some(entry) = metrics.get_mut(sub_agent_id) {
                entry.total_latency_ms += duration_ms;
                if duration_ms < entry.min_latency_ms {
                    entry.min_latency_ms = duration_ms;
                }
                if duration_ms > entry.max_latency_ms {
                    entry.max_latency_ms = duration_ms;
                }
                entry.average_latency_ms =
                    entry.total_latency_ms as f64 / entry.total_calls as f64;

                if let Some(tokens) = estimated_tokens {
                    entry.estimated_tokens_used += tokens;
                }

                // Update success/failure counts
                match status {
                    SubAgentStatus::Completed => entry.successful_calls += 1,
                    SubAgentStatus::Failed => entry.failed_calls += 1,
                    SubAgentStatus::Timeout => entry.timeout_calls += 1,
                    _ => {}
                }
            }
        }

        // Remove from active after a short delay to allow status queries
        {
            let mut active = self.active_executions.write().await;
            active.remove(execution_id);
        }

        Ok(())
    }

    /// Emit a diagnostic entry
    pub async fn emit_diagnostic(
        &self,
        execution_id: Option<String>,
        session_id: Option<String>,
        severity: DiagnosticSeverity,
        category: DiagnosticCategory,
        message: String,
        details: Option<serde_json::Value>,
    ) -> Result<()> {
        // Store key before moving session_id
        let key = session_id.clone().unwrap_or_else(|| "global".to_string());

        let entry = DiagnosticEntry {
            id: Self::generate_id("diag"),
            timestamp: Utc::now().timestamp(),
            severity,
            category,
            execution_id,
            session_id,
            message,
            details,
        };

        let mut diagnostics = self.diagnostics.write().await;
        diagnostics.entry(key).or_insert_with(Vec::new).push(entry);

        Ok(())
    }

    /// Record loop detection event
    pub async fn record_loop_detection(
        &self,
        execution_id: &str,
        session_id: &str,
        sub_agent_id: &str,
    ) -> Result<()> {
        let config = self.get_config().await;
        if config.enable_loop_detection_alerts {
            self.emit_diagnostic(
                Some(execution_id.to_string()),
                Some(session_id.to_string()),
                DiagnosticSeverity::Warning,
                DiagnosticCategory::Loop,
                format!("Potential loop detected for Sub-Agent {}", sub_agent_id),
                Some(serde_json::json!({
                    "execution_id": execution_id,
                    "sub_agent_id": sub_agent_id
                })),
            )
            .await?;
        }
        Ok(())
    }

    /// Record permission denial event
    pub async fn record_permission_denial(
        &self,
        execution_id: &str,
        session_id: &str,
        tool_name: &str,
    ) -> Result<()> {
        let config = self.get_config().await;
        if config.enable_permission_audit {
            self.emit_diagnostic(
                Some(execution_id.to_string()),
                Some(session_id.to_string()),
                DiagnosticSeverity::Info,
                DiagnosticCategory::Permission,
                format!("Tool access denied: {}", tool_name),
                Some(serde_json::json!({
                    "execution_id": execution_id,
                    "tool_name": tool_name
                })),
            )
            .await?;
        }
        Ok(())
    }

    /// Get metrics for a specific Sub-Agent
    pub async fn get_sub_agent_metrics(
        &self,
        sub_agent_id: &str,
    ) -> Option<SubAgentMetrics> {
        let metrics = self.metrics_cache.read().await;
        metrics.get(sub_agent_id).cloned()
    }

    /// Get all Sub-Agent metrics
    pub async fn get_all_metrics(&self) -> Vec<SubAgentMetrics> {
        let metrics = self.metrics_cache.read().await;
        metrics.values().cloned().collect()
    }

    /// Get session-level statistics
    pub async fn get_session_stats(
        &self,
        session_id: &str,
        nested_records: Vec<NestedCallRecord>,
        merged_results: Vec<MergedResultRecord>,
    ) -> SessionSubAgentStats {
        let active = self.active_executions.read().await;
        let active_for_session: Vec<_> = active
            .values()
            .filter(|e| e.execution_id.contains(session_id))
            .map(|e| SubAgentSummary {
                execution_id: e.execution_id.clone(),
                sub_agent_id: e.sub_agent_id.clone(),
                sub_agent_name: e.sub_agent_name.clone(),
                status: e.status.clone(),
                depth: e.depth,
                started_at: e.started_at,
            })
            .collect();

        let total_nested = nested_records.len() as i64;
        let max_depth = nested_records
            .iter()
            .map(|r| r.depth)
            .max()
            .unwrap_or(0);

        let success_count = merged_results
            .iter()
            .filter(|r| r.merge_status.to_string() == "merged")
            .count() as i64;

        let total_results = merged_results.len() as i64;
        let success_rate = if total_results > 0 {
            success_count as f64 / total_results as f64
        } else {
            0.0
        };

        let metrics = self.metrics_cache.read().await;
        let total_tokens: i64 = metrics.values().map(|m| m.estimated_tokens_used).sum();
        let avg_latency: f64 = if !metrics.is_empty() {
            metrics.values().map(|m| m.average_latency_ms).sum::<f64>() / metrics.len() as f64
        } else {
            0.0
        };

        SessionSubAgentStats {
            session_id: session_id.to_string(),
            total_nested_calls: total_nested,
            max_depth_reached: max_depth,
            active_sub_agents: active_for_session,
            metrics_summary: MetricsSummary {
                total_calls: total_nested,
                success_rate,
                average_latency_ms: avg_latency,
                estimated_token_usage: total_tokens,
                active_count: active.len() as i64,
            },
        }
    }

    /// Get diagnostics for a session
    pub async fn get_session_diagnostics(
        &self,
        session_id: &str,
        limit: Option<usize>,
    ) -> Vec<DiagnosticEntry> {
        let diagnostics = self.diagnostics.read().await;
        let mut entries = diagnostics
            .get(session_id)
            .cloned()
            .unwrap_or_default();

        // Sort by timestamp descending
        entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        if let Some(l) = limit {
            entries.truncate(l);
        }

        entries
    }

    /// Get active Sub-Agent executions
    pub async fn get_active_executions(&self) -> Vec<ExecutionStatus> {
        let active = self.active_executions.read().await;
        active.values().cloned().collect()
    }

    /// Check for potential permission leaks
    pub async fn verify_no_permission_leaks(
        &self,
        parent_execution_id: &str,
        child_permission_level: &str,
    ) -> bool {
        // Check if child has higher privileges than parent should allow
        // This is a simplified check - real implementation would check hierarchy
        let active = self.active_executions.read().await;

        // If parent is not in active list, assume it completed normally
        if let Some(parent) = active.get(parent_execution_id) {
            // Only allow private permissions if parent explicitly started a private context
            if child_permission_level == "private" && !parent.sub_agent_name.contains("privileged") {
                return false;
            }
        }

        true
    }

    /// Get diagnostic summary for troubleshooting
    pub async fn get_diagnostic_summary(
        &self,
        session_id: &str,
    ) -> DiagnosticSummary {
        let diagnostics = self.get_session_diagnostics(session_id, None).await;

        let by_severity: HashMap<String, i64> = diagnostics
            .iter()
            .map(|d| (d.severity.to_string(), 1))
            .fold(HashMap::new(), |mut acc, (k, v)| {
                *acc.entry(k).or_insert(0) += v;
                acc
            });

        let by_category: HashMap<String, i64> = diagnostics
            .iter()
            .map(|d| (d.category.to_string(), 1))
            .fold(HashMap::new(), |mut acc, (k, v)| {
                *acc.entry(k).or_insert(0) += v;
                acc
            });

        let recent = diagnostics.iter().take(10).cloned().collect();

        DiagnosticSummary {
            session_id: session_id.to_string(),
            total_diagnostics: diagnostics.len() as i64,
            by_severity,
            by_category,
            recent_diagnostics: recent,
        }
    }
}

/// Diagnostic summary for quick overview
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticSummary {
    pub session_id: String,
    pub total_diagnostics: i64,
    pub by_severity: HashMap<String, i64>,
    pub by_category: HashMap<String, i64>,
    pub recent_diagnostics: Vec<DiagnosticEntry>,
}

impl Default for SubAgentMonitoringService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_record_execution_start() {
        let service = SubAgentMonitoringService::new();

        service
            .record_execution_start("exec_001", "subagent_001", "文档助手", 1)
            .await
            .unwrap();

        let metrics = service.get_sub_agent_metrics("subagent_001").await;
        assert!(metrics.is_some());
        let metrics = metrics.unwrap();
        assert_eq!(metrics.total_calls, 1);
        assert_eq!(metrics.sub_agent_name, "文档助手");
    }

    #[tokio::test]
    async fn test_record_execution_complete() {
        let service = SubAgentMonitoringService::new();

        service
            .record_execution_start("exec_001", "subagent_001", "文档助手", 1)
            .await
            .unwrap();

        service
            .record_execution_complete(
                "exec_001",
                "subagent_001",
                &SubAgentStatus::Completed,
                1500,
                Some(500),
            )
            .await
            .unwrap();

        let metrics = service.get_sub_agent_metrics("subagent_001").await;
        assert!(metrics.is_some());
        let metrics = metrics.unwrap();
        assert_eq!(metrics.successful_calls, 1);
        assert_eq!(metrics.total_latency_ms, 1500);
        assert_eq!(metrics.estimated_tokens_used, 500);
    }

    #[tokio::test]
    async fn test_latency_threshold_diagnostics() {
        let service = SubAgentMonitoringService::new();

        // Set low threshold for testing
        service
            .update_config(MonitoringConfig {
                latency_warning_threshold_ms: 100,
                latency_error_threshold_ms: 500,
                ..Default::default()
            })
            .await;

        service
            .record_execution_start("exec_001", "subagent_001", "文档助手", 1)
            .await
            .unwrap();

        // This should trigger a warning (300 > 100)
        service
            .record_execution_complete(
                "exec_001",
                "subagent_001",
                &SubAgentStatus::Completed,
                300,
                None,
            )
            .await
            .unwrap();

        let diagnostics = service.get_session_diagnostics("global", None).await;
        assert!(!diagnostics.is_empty());
        assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Warning);
    }

    #[tokio::test]
    async fn test_get_all_metrics() {
        let service = SubAgentMonitoringService::new();

        service
            .record_execution_start("exec_001", "subagent_001", "助手1", 1)
            .await
            .unwrap();
        service
            .record_execution_start("exec_002", "subagent_002", "助手2", 1)
            .await
            .unwrap();

        let all_metrics = service.get_all_metrics().await;
        assert_eq!(all_metrics.len(), 2);
    }

    #[tokio::test]
    async fn test_loop_detection_record() {
        let service = SubAgentMonitoringService::new();

        service
            .record_loop_detection("exec_001", "session_001", "subagent_001")
            .await
            .unwrap();

        let diagnostics = service.get_session_diagnostics("session_001", None).await;
        assert!(!diagnostics.is_empty());
        assert_eq!(diagnostics[0].category, DiagnosticCategory::Loop);
    }

    #[tokio::test]
    async fn test_permission_denial_record() {
        let service = SubAgentMonitoringService::new();

        service
            .record_permission_denial("exec_001", "session_001", "fs_delete")
            .await
            .unwrap();

        let diagnostics = service.get_session_diagnostics("session_001", None).await;
        assert!(!diagnostics.is_empty());
        assert_eq!(diagnostics[0].category, DiagnosticCategory::Permission);
    }

    #[tokio::test]
    async fn test_diagnostic_summary() {
        let service = SubAgentMonitoringService::new();

        service
            .record_execution_start("exec_001", "subagent_001", "文档助手", 1)
            .await
            .unwrap();

        service
            .record_loop_detection("exec_001", "session_001", "subagent_001")
            .await
            .unwrap();

        service
            .record_permission_denial("exec_001", "session_001", "fs_delete")
            .await
            .unwrap();

        let summary = service.get_diagnostic_summary("session_001").await;
        assert_eq!(summary.total_diagnostics, 2);
        assert!(summary.by_category.contains_key("loop"));
        assert!(summary.by_category.contains_key("permission"));
    }
}
