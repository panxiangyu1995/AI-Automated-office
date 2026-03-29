//! Audit Log and Trace Module
//!
//! This module implements:
//! - Trace, tool audit, and execution record storage
//! - Event writing from orchestrator and tool pipeline
//! - Query commands by session, trace, tool, and task
//! - Integration with debug panels
//!
//! Story 55.1 - Trace, audit, and failure persistence

use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::sync::Arc;

/// Trace step status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TraceStepStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
    Cancelled,
}

impl std::fmt::Display for TraceStepStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TraceStepStatus::Pending => write!(f, "pending"),
            TraceStepStatus::Running => write!(f, "running"),
            TraceStepStatus::Completed => write!(f, "completed"),
            TraceStepStatus::Failed => write!(f, "failed"),
            TraceStepStatus::Skipped => write!(f, "skipped"),
            TraceStepStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Step type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum StepType {
    Tool,
    Planning,
    Execution,
    Confirmation,
    Other,
}

impl std::fmt::Display for StepType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StepType::Tool => write!(f, "tool"),
            StepType::Planning => write!(f, "planning"),
            StepType::Execution => write!(f, "execution"),
            StepType::Confirmation => write!(f, "confirmation"),
            StepType::Other => write!(f, "other"),
        }
    }
}

/// Tool audit entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolAuditEntry {
    pub id: String,
    pub trace_id: String,
    pub step_id: String,
    pub session_id: String,
    pub tool_name: String,
    pub tool_input: Option<serde_json::Value>,
    pub tool_output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub status: String,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub duration_ms: Option<i64>,
    pub permission_requested: Option<bool>,
    pub permission_granted: Option<bool>,
}

/// Step log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepLogEntry {
    pub id: String,
    pub trace_id: String,
    pub step_id: String,
    pub session_id: String,
    pub parent_step_id: Option<String>,
    pub step_type: StepType,
    pub status: TraceStepStatus,
    pub name: String,
    pub input: Option<serde_json::Value>,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub duration_ms: Option<i64>,
    pub metadata: Option<serde_json::Value>,
    /// Indicates if this step was executed in YOLO mode
    pub yolo_mode: bool,
}

/// Trace context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceContext {
    pub trace_id: String,
    pub session_id: String,
    pub parent_trace_id: Option<String>,
    pub root_trace_id: String,
    pub depth: i32,
    pub path: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Trace summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceSummary {
    pub trace_id: String,
    pub session_id: String,
    pub root_trace_id: String,
    pub total_steps: i32,
    pub completed_steps: i32,
    pub failed_steps: i32,
    pub pending_steps: i32,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub total_duration_ms: Option<i64>,
    pub status: String,
}

/// Failure record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailureRecord {
    pub id: String,
    pub trace_id: String,
    pub step_id: String,
    pub session_id: String,
    pub failure_type: String,
    pub severity: String,
    pub error_message: String,
    pub stack_trace: Option<String>,
    pub context: Option<serde_json::Value>,
    pub recovered: bool,
    pub recovery_action: Option<String>,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
}

/// Confirmation audit entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfirmationAuditEntry {
    pub id: String,
    pub trace_id: String,
    pub step_id: String,
    pub session_id: String,
    pub confirmation_type: String,
    pub action_description: String,
    pub requested_at: i64,
    pub responded_at: Option<i64>,
    pub response: Option<String>,
    pub user_id: Option<String>,
    pub granted: Option<bool>,
}

/// Audit store for database operations
pub struct AuditStore {
    pool: SqlitePool,
}

impl AuditStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Generate unique ID
    fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Create a step log entry
    pub async fn create_step_log(&self, entry: &StepLogEntry) -> Result<()> {
        let metadata = entry
            .metadata
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let input = entry.input.as_ref().map(serde_json::to_string).transpose()?;
        let output = entry.output.as_ref().map(serde_json::to_string).transpose()?;

        sqlx::query(
            "INSERT INTO audit_step_logs (
                id, trace_id, step_id, session_id, parent_step_id,
                step_type, status, name, input, output, error,
                started_at, completed_at, duration_ms, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&entry.id)
        .bind(&entry.trace_id)
        .bind(&entry.step_id)
        .bind(&entry.session_id)
        .bind(&entry.parent_step_id)
        .bind(entry.step_type.to_string())
        .bind(entry.status.to_string())
        .bind(&entry.name)
        .bind(&input)
        .bind(&output)
        .bind(&entry.error)
        .bind(entry.started_at)
        .bind(entry.completed_at)
        .bind(entry.duration_ms)
        .bind(&metadata)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Create a tool audit entry
    pub async fn create_tool_audit(&self, entry: &ToolAuditEntry) -> Result<()> {
        let tool_input = entry
            .tool_input
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;
        let tool_output = entry
            .tool_output
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO audit_tool_calls (
                id, trace_id, step_id, session_id, tool_name,
                tool_input, tool_output, error, status,
                started_at, completed_at, duration_ms,
                permission_requested, permission_granted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&entry.id)
        .bind(&entry.trace_id)
        .bind(&entry.step_id)
        .bind(&entry.session_id)
        .bind(&entry.tool_name)
        .bind(&tool_input)
        .bind(&tool_output)
        .bind(&entry.error)
        .bind(&entry.status)
        .bind(entry.started_at)
        .bind(entry.completed_at)
        .bind(entry.duration_ms)
        .bind(entry.permission_requested)
        .bind(entry.permission_granted)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Create a failure record
    pub async fn create_failure_record(&self, record: &FailureRecord) -> Result<()> {
        let context = record
            .context
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO audit_failures (
                id, trace_id, step_id, session_id, failure_type,
                severity, error_message, stack_trace, context,
                recovered, recovery_action, created_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&record.id)
        .bind(&record.trace_id)
        .bind(&record.step_id)
        .bind(&record.session_id)
        .bind(&record.failure_type)
        .bind(&record.severity)
        .bind(&record.error_message)
        .bind(&record.stack_trace)
        .bind(&context)
        .bind(if record.recovered { 1 } else { 0 })
        .bind(&record.recovery_action)
        .bind(record.created_at)
        .bind(record.resolved_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Create a confirmation audit entry
    pub async fn create_confirmation_audit(&self, entry: &ConfirmationAuditEntry) -> Result<()> {
        sqlx::query(
            "INSERT INTO audit_confirmations (
                id, trace_id, step_id, session_id, confirmation_type,
                action_description, requested_at, responded_at,
                response, user_id, granted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&entry.id)
        .bind(&entry.trace_id)
        .bind(&entry.step_id)
        .bind(&entry.session_id)
        .bind(&entry.confirmation_type)
        .bind(&entry.action_description)
        .bind(entry.requested_at)
        .bind(entry.responded_at)
        .bind(&entry.response)
        .bind(&entry.user_id)
        .bind(entry.granted)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Create a trace context
    pub async fn create_trace_context(&self, context: &TraceContext) -> Result<()> {
        let path = serde_json::to_string(&context.path)?;

        sqlx::query(
            "INSERT INTO audit_traces (
                trace_id, session_id, parent_trace_id, root_trace_id,
                depth, path, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&context.trace_id)
        .bind(&context.session_id)
        .bind(&context.parent_trace_id)
        .bind(&context.root_trace_id)
        .bind(context.depth)
        .bind(&path)
        .bind(context.created_at)
        .bind(context.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get step logs by session
    pub async fn get_steps_by_session(&self, session_id: &str) -> Result<Vec<StepLogEntry>> {
        let rows = sqlx::query(
            "SELECT * FROM audit_step_logs WHERE session_id = ? ORDER BY started_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_step_log).collect())
    }

    /// Get step logs by trace
    pub async fn get_steps_by_trace(&self, trace_id: &str) -> Result<Vec<StepLogEntry>> {
        let rows = sqlx::query(
            "SELECT * FROM audit_step_logs WHERE trace_id = ? ORDER BY started_at ASC;",
        )
        .bind(trace_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_step_log).collect())
    }

    /// Get tool audits by session
    pub async fn get_tool_audits_by_session(&self, session_id: &str) -> Result<Vec<ToolAuditEntry>> {
        let rows = sqlx::query(
            "SELECT * FROM audit_tool_calls WHERE session_id = ? ORDER BY started_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_tool_audit).collect())
    }

    /// Get tool audits by tool name
    pub async fn get_tool_audits_by_tool(&self, tool_name: &str) -> Result<Vec<ToolAuditEntry>> {
        let rows = sqlx::query(
            "SELECT * FROM audit_tool_calls WHERE tool_name = ? ORDER BY started_at DESC;",
        )
        .bind(tool_name)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_tool_audit).collect())
    }

    /// Get failures by session
    pub async fn get_failures_by_session(&self, session_id: &str) -> Result<Vec<FailureRecord>> {
        let rows = sqlx::query(
            "SELECT * FROM audit_failures WHERE session_id = ? ORDER BY created_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_failure_record).collect())
    }

    /// Get confirmations by session
    pub async fn get_confirmations_by_session(&self, session_id: &str) -> Result<Vec<ConfirmationAuditEntry>> {
        let rows = sqlx::query(
            "SELECT * FROM audit_confirmations WHERE session_id = ? ORDER BY requested_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_confirmation_audit).collect())
    }

    /// Get trace context
    pub async fn get_trace_context(&self, trace_id: &str) -> Result<Option<TraceContext>> {
        let row = sqlx::query("SELECT * FROM audit_traces WHERE trace_id = ?;")
            .bind(trace_id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(map_trace_context))
    }

    /// Update failure as recovered
    pub async fn mark_failure_recovered(&self, id: &str, recovery_action: &str) -> Result<()> {
        sqlx::query(
            "UPDATE audit_failures SET recovered = 1, recovery_action = ?, resolved_at = ? WHERE id = ?;",
        )
        .bind(recovery_action)
        .bind(Utc::now().timestamp())
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Update confirmation response
    pub async fn update_confirmation_response(
        &self,
        id: &str,
        response: &str,
        user_id: &str,
        granted: bool,
    ) -> Result<()> {
        sqlx::query(
            "UPDATE audit_confirmations SET response = ?, user_id = ?, granted = ?, responded_at = ? WHERE id = ?;",
        )
        .bind(response)
        .bind(user_id)
        .bind(if granted { 1 } else { 0 })
        .bind(Utc::now().timestamp())
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

fn map_step_log(row: sqlx::sqlite::SqliteRow) -> StepLogEntry {
    let input: Option<String> = row.try_get("input").unwrap_or(None);
    let output: Option<String> = row.try_get("output").unwrap_or(None);
    let metadata: Option<String> = row.try_get("metadata").unwrap_or(None);
    let yolo_mode: bool = row.try_get::<i32, _>("yolo_mode").unwrap_or(0) == 1;

    StepLogEntry {
        id: row.get("id"),
        trace_id: row.get("trace_id"),
        step_id: row.get("step_id"),
        session_id: row.get("session_id"),
        parent_step_id: row.get("parent_step_id"),
        step_type: parse_step_type(&row.get::<String, _>("step_type")),
        status: parse_trace_status(&row.get::<String, _>("status")),
        name: row.get("name"),
        input: input.and_then(|v| serde_json::from_str(&v).ok()),
        output: output.and_then(|v| serde_json::from_str(&v).ok()),
        error: row.get("error"),
        started_at: row.get("started_at"),
        completed_at: row.get("completed_at"),
        duration_ms: row.get("duration_ms"),
        metadata: metadata.and_then(|v| serde_json::from_str(&v).ok()),
        yolo_mode,
    }
}

fn map_tool_audit(row: sqlx::sqlite::SqliteRow) -> ToolAuditEntry {
    let tool_input: Option<String> = row.try_get("tool_input").unwrap_or(None);
    let tool_output: Option<String> = row.try_get("tool_output").unwrap_or(None);

    ToolAuditEntry {
        id: row.get("id"),
        trace_id: row.get("trace_id"),
        step_id: row.get("step_id"),
        session_id: row.get("session_id"),
        tool_name: row.get("tool_name"),
        tool_input: tool_input.and_then(|v| serde_json::from_str(&v).ok()),
        tool_output: tool_output.and_then(|v| serde_json::from_str(&v).ok()),
        error: row.get("error"),
        status: row.get("status"),
        started_at: row.get("started_at"),
        completed_at: row.get("completed_at"),
        duration_ms: row.get("duration_ms"),
        permission_requested: row.get("permission_requested"),
        permission_granted: row.get("permission_granted"),
    }
}

fn map_failure_record(row: sqlx::sqlite::SqliteRow) -> FailureRecord {
    let context: Option<String> = row.try_get("context").unwrap_or(None);

    FailureRecord {
        id: row.get("id"),
        trace_id: row.get("trace_id"),
        step_id: row.get("step_id"),
        session_id: row.get("session_id"),
        failure_type: row.get("failure_type"),
        severity: row.get("severity"),
        error_message: row.get("error_message"),
        stack_trace: row.get("stack_trace"),
        context: context.and_then(|v| serde_json::from_str(&v).ok()),
        recovered: row.get::<i64, _>("recovered") != 0,
        recovery_action: row.get("recovery_action"),
        created_at: row.get("created_at"),
        resolved_at: row.get("resolved_at"),
    }
}

fn map_confirmation_audit(row: sqlx::sqlite::SqliteRow) -> ConfirmationAuditEntry {
    ConfirmationAuditEntry {
        id: row.get("id"),
        trace_id: row.get("trace_id"),
        step_id: row.get("step_id"),
        session_id: row.get("session_id"),
        confirmation_type: row.get("confirmation_type"),
        action_description: row.get("action_description"),
        requested_at: row.get("requested_at"),
        responded_at: row.get("responded_at"),
        response: row.get("response"),
        user_id: row.get("user_id"),
        granted: row.get("granted"),
    }
}

fn map_trace_context(row: sqlx::sqlite::SqliteRow) -> TraceContext {
    let path: String = row.get("path");
    let path: Vec<String> = serde_json::from_str(&path).unwrap_or_default();

    TraceContext {
        trace_id: row.get("trace_id"),
        session_id: row.get("session_id"),
        parent_trace_id: row.get("parent_trace_id"),
        root_trace_id: row.get("root_trace_id"),
        depth: row.get("depth"),
        path,
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn parse_step_type(s: &str) -> StepType {
    match s {
        "tool" => StepType::Tool,
        "planning" => StepType::Planning,
        "execution" => StepType::Execution,
        "confirmation" => StepType::Confirmation,
        _ => StepType::Other,
    }
}

fn parse_trace_status(s: &str) -> TraceStepStatus {
    match s {
        "pending" => TraceStepStatus::Pending,
        "running" => TraceStepStatus::Running,
        "completed" => TraceStepStatus::Completed,
        "failed" => TraceStepStatus::Failed,
        "skipped" => TraceStepStatus::Skipped,
        "cancelled" => TraceStepStatus::Cancelled,
        _ => TraceStepStatus::Pending,
    }
}

/// Audit service for high-level operations
pub struct AuditService {
    store: AuditStore,
}

impl AuditService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            store: AuditStore::new(pool),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Log a step start
    pub async fn log_step_start(
        &self,
        trace_id: &str,
        step_id: &str,
        session_id: &str,
        step_type: StepType,
        name: &str,
        yolo_mode: bool,
    ) -> Result<StepLogEntry> {
        let entry = StepLogEntry {
            id: Self::generate_id("step"),
            trace_id: trace_id.to_string(),
            step_id: step_id.to_string(),
            session_id: session_id.to_string(),
            parent_step_id: None,
            step_type,
            status: TraceStepStatus::Running,
            name: name.to_string(),
            input: None,
            output: None,
            error: None,
            started_at: Utc::now().timestamp(),
            completed_at: None,
            duration_ms: None,
            metadata: None,
            yolo_mode,
        };

        self.store.create_step_log(&entry).await?;
        Ok(entry)
    }

    /// Log a step completion
    pub async fn log_step_complete(
        &self,
        step_id: &str,
        output: Option<serde_json::Value>,
    ) -> Result<()> {
        let now = Utc::now().timestamp();

        sqlx::query(
            "UPDATE audit_step_logs SET status = 'completed', output = ?, completed_at = ?, duration_ms = ? WHERE step_id = ? AND status = 'running';",
        )
        .bind(&output.as_ref().map(serde_json::to_string).transpose().unwrap_or(None))
        .bind(now)
        .bind(0) // Duration would need to be calculated from started_at
        .bind(step_id)
        .execute(&self.store.pool)
        .await?;

        Ok(())
    }

    /// Log a step failure
    pub async fn log_step_failure(
        &self,
        step_id: &str,
        error: &str,
    ) -> Result<()> {
        let now = Utc::now().timestamp();

        sqlx::query(
            "UPDATE audit_step_logs SET status = 'failed', error = ?, completed_at = ? WHERE step_id = ?;",
        )
        .bind(error)
        .bind(now)
        .bind(step_id)
        .execute(&self.store.pool)
        .await?;

        Ok(())
    }

    /// Log a tool call
    pub async fn log_tool_call(
        &self,
        trace_id: &str,
        step_id: &str,
        session_id: &str,
        tool_name: &str,
        tool_input: Option<serde_json::Value>,
    ) -> Result<ToolAuditEntry> {
        let entry = ToolAuditEntry {
            id: Self::generate_id("tool"),
            trace_id: trace_id.to_string(),
            step_id: step_id.to_string(),
            session_id: session_id.to_string(),
            tool_name: tool_name.to_string(),
            tool_input,
            tool_output: None,
            error: None,
            status: "running".to_string(),
            started_at: Utc::now().timestamp(),
            completed_at: None,
            duration_ms: None,
            permission_requested: None,
            permission_granted: None,
        };

        self.store.create_tool_audit(&entry).await?;
        Ok(entry)
    }

    /// Log a tool completion
    pub async fn log_tool_complete(
        &self,
        tool_id: &str,
        tool_output: Option<serde_json::Value>,
    ) -> Result<()> {
        let now = Utc::now().timestamp();

        sqlx::query(
            "UPDATE audit_tool_calls SET status = 'completed', tool_output = ?, completed_at = ? WHERE id = ?;",
        )
        .bind(&tool_output.as_ref().map(serde_json::to_string).transpose().unwrap_or(None))
        .bind(now)
        .bind(tool_id)
        .execute(&self.store.pool)
        .await?;

        Ok(())
    }

    /// Log a tool failure
    pub async fn log_tool_failure(
        &self,
        tool_id: &str,
        error: &str,
    ) -> Result<()> {
        let now = Utc::now().timestamp();

        sqlx::query(
            "UPDATE audit_tool_calls SET status = 'failed', error = ?, completed_at = ? WHERE id = ?;",
        )
        .bind(error)
        .bind(now)
        .bind(tool_id)
        .execute(&self.store.pool)
        .await?;

        Ok(())
    }

    /// Record a failure
    pub async fn record_failure(
        &self,
        trace_id: &str,
        step_id: &str,
        session_id: &str,
        failure_type: &str,
        severity: &str,
        error_message: &str,
        stack_trace: Option<&str>,
    ) -> Result<FailureRecord> {
        let record = FailureRecord {
            id: Self::generate_id("fail"),
            trace_id: trace_id.to_string(),
            step_id: step_id.to_string(),
            session_id: session_id.to_string(),
            failure_type: failure_type.to_string(),
            severity: severity.to_string(),
            error_message: error_message.to_string(),
            stack_trace: stack_trace.map(String::from),
            context: None,
            recovered: false,
            recovery_action: None,
            created_at: Utc::now().timestamp(),
            resolved_at: None,
        };

        self.store.create_failure_record(&record).await?;
        Ok(record)
    }

    /// Record a confirmation request
    pub async fn record_confirmation_request(
        &self,
        trace_id: &str,
        step_id: &str,
        session_id: &str,
        confirmation_type: &str,
        action_description: &str,
    ) -> Result<ConfirmationAuditEntry> {
        let entry = ConfirmationAuditEntry {
            id: Self::generate_id("conf"),
            trace_id: trace_id.to_string(),
            step_id: step_id.to_string(),
            session_id: session_id.to_string(),
            confirmation_type: confirmation_type.to_string(),
            action_description: action_description.to_string(),
            requested_at: Utc::now().timestamp(),
            responded_at: None,
            response: None,
            user_id: None,
            granted: None,
        };

        self.store.create_confirmation_audit(&entry).await?;
        Ok(entry)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_step_type() {
        assert_eq!(parse_step_type("tool"), StepType::Tool);
        assert_eq!(parse_step_type("planning"), StepType::Planning);
        assert_eq!(parse_step_type("confirmation"), StepType::Confirmation);
        assert_eq!(parse_step_type("unknown"), StepType::Other);
    }

    #[test]
    fn test_parse_trace_status() {
        assert_eq!(parse_trace_status("pending"), TraceStepStatus::Pending);
        assert_eq!(parse_trace_status("running"), TraceStepStatus::Running);
        assert_eq!(parse_trace_status("completed"), TraceStepStatus::Completed);
        assert_eq!(parse_trace_status("failed"), TraceStepStatus::Failed);
    }

    #[test]
    fn test_generate_id() {
        let id = AuditService::generate_id("test");
        assert!(id.starts_with("test_"));
        assert_eq!(id.len(), 41); // "test_" + 36 char UUID
    }
}
