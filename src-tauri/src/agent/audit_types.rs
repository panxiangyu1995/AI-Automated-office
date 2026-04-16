//! Audit module type definitions
//!
//! Contains types, enums, and structs for audit logging and tracing.

use serde::{Deserialize, Serialize};

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
