//! Monitoring Tauri 命令
//!
//! 暴露 Agent 可观测性数据给前端

use tauri::State;
use std::sync::Arc;

use crate::agent::monitoring::{
    SubAgentMonitoringService, MonitoringConfig,
    SubAgentMetrics, SessionSubAgentStats, DiagnosticEntry,
    DiagnosticSummary,
    Trace, Span, TraceStatus, SpanType, SpanStatus,
    SpanAttribute, AttributeValue, SpanEvent, TraceMetadata,
};

/// Monitoring State wrapper
pub struct MonitoringState(pub Arc<SubAgentMonitoringService>);

impl Default for MonitoringState {
    fn default() -> Self {
        Self(Arc::new(SubAgentMonitoringService::new()))
    }
}

// ============================================================================
// Metrics Commands
// ============================================================================

/// 获取所有 Sub-Agent 指标
#[tauri::command]
pub async fn get_all_metrics(
    state: State<'_, MonitoringState>,
) -> Result<Vec<SubAgentMetrics>, String> {
    Ok(state.0.get_all_metrics().await)
}

/// 获取特定 Sub-Agent 的指标
#[tauri::command]
pub async fn get_sub_agent_metrics(
    state: State<'_, MonitoringState>,
    sub_agent_id: String,
) -> Result<Option<SubAgentMetrics>, String> {
    Ok(state.0.get_sub_agent_metrics(&sub_agent_id).await)
}

// ============================================================================
// Session Stats Commands
// ============================================================================

/// 获取会话级统计
#[tauri::command]
pub async fn get_session_stats(
    state: State<'_, MonitoringState>,
    session_id: String,
) -> Result<SessionSubAgentStats, String> {
    // Use empty vectors for nested_records and merged_results since we don't have that data here
    Ok(state.0.get_session_stats(&session_id, vec![], vec![]).await)
}

// ============================================================================
// Diagnostics Commands
// ============================================================================

/// 获取会话诊断信息
#[tauri::command]
pub async fn get_session_diagnostics(
    state: State<'_, MonitoringState>,
    session_id: String,
    limit: Option<usize>,
) -> Result<Vec<DiagnosticEntry>, String> {
    Ok(state.0.get_session_diagnostics(&session_id, limit).await)
}

/// 获取诊断摘要
#[tauri::command]
pub async fn get_diagnostic_summary(
    state: State<'_, MonitoringState>,
    session_id: String,
) -> Result<DiagnosticSummary, String> {
    Ok(state.0.get_diagnostic_summary(&session_id).await)
}

// ============================================================================
// Active Executions Commands
// ============================================================================

/// 获取活跃的 Sub-Agent 执行
#[tauri::command]
pub async fn get_active_executions(
    state: State<'_, MonitoringState>,
) -> Result<Vec<ActiveExecution>, String> {
    let executions = state.0.get_active_executions().await;
    Ok(executions.into_iter().map(|e| ActiveExecution {
        execution_id: e.execution_id,
        sub_agent_id: e.sub_agent_id,
        sub_agent_name: e.sub_agent_name,
        started_at: e.started_at,
        depth: e.depth,
        status: e.status,
    }).collect())
}

/// 活跃执行信息（前端兼容格式）
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveExecution {
    pub execution_id: String,
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub started_at: i64,
    pub depth: i32,
    pub status: String,
}

// ============================================================================
// Config Commands
// ============================================================================

/// 获取监控配置
#[tauri::command]
pub async fn get_monitoring_config(
    state: State<'_, MonitoringState>,
) -> Result<MonitoringConfig, String> {
    Ok(state.0.get_config().await)
}

/// 更新监控配置
#[tauri::command]
pub async fn update_monitoring_config(
    state: State<'_, MonitoringState>,
    config: MonitoringConfig,
) -> Result<(), String> {
    state.0.update_config(config).await;
    Ok(())
}

// ============================================================================
// Trace and Span Commands (Task 183)
// ============================================================================

/// 获取会话的Trace列表
#[tauri::command]
pub async fn get_session_traces(
    state: State<'_, MonitoringState>,
    session_id: String,
    limit: Option<usize>,
) -> Result<Vec<TraceInfo>, String> {
    // Return mock trace info for now since we don't have full trace storage yet
    let _ = (state, session_id, limit);
    Ok(vec![])
}

/// Trace简要信息
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceInfo {
    pub trace_id: String,
    pub session_id: String,
    pub status: String,
    pub span_count: usize,
    pub started_at: i64,
    pub duration_ms: Option<i64>,
}

/// 获取Trace详情
#[tauri::command]
pub async fn get_trace(
    state: State<'_, MonitoringState>,
    trace_id: String,
) -> Result<Option<Trace>, String> {
    // Return None for now since we don't have full trace storage yet
    let _ = (state, trace_id);
    Ok(None)
}

/// 获取Span详情
#[tauri::command]
pub async fn get_span(
    state: State<'_, MonitoringState>,
    span_id: String,
) -> Result<Option<Span>, String> {
    // Return None for now since we don't have full span storage yet
    let _ = (state, span_id);
    Ok(None)
}
