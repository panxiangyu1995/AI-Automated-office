//! Tool call visibility type definitions
//!
//! Contains types, enums, and structs for tool execution visibility tracking.

use serde::{Deserialize, Serialize};
use chrono::Utc;

/// Tool execution status for visibility tracking
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolCallStatus {
    /// Tool call is pending
    Pending,
    /// Tool is currently executing
    Running,
    /// Tool completed successfully
    Success,
    /// Tool execution failed
    Failed,
    /// Tool timed out
    Timeout,
    /// Tool was cancelled
    Cancelled,
    /// Tool is retrying after failure
    Retrying,
}

/// Tool category for visibility
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolCategory {
    /// General tools
    General,
    /// Platform tools
    Platform,
    /// Department tools
    Department,
    /// Restricted tools
    Restricted,
}

impl Default for ToolCategory {
    fn default() -> Self {
        Self::General
    }
}

/// Input/output entry for tool call
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCallEntry {
    /// Unique execution ID
    pub execution_id: String,
    /// Tool identifier
    pub tool_id: String,
    /// Tool name for display
    pub tool_name: String,
    /// Tool category
    pub category: ToolCategory,
    /// Current status
    pub status: ToolCallStatus,
    /// Input parameters (JSON)
    pub input: serde_json::Value,
    /// Output result (JSON)
    pub output: Option<serde_json::Value>,
    /// Error message if failed
    pub error: Option<String>,
    /// Execution duration in milliseconds
    pub duration_ms: Option<u64>,
    /// Retry count
    pub retry_count: u32,
    /// Maximum retries allowed
    pub max_retries: u32,
    /// Whether result is manually input
    pub manual_result: bool,
    /// Correlation ID for tracking
    pub correlation_id: String,
    /// Session ID
    pub session_id: String,
    /// User ID
    pub user_id: String,
    /// Message ID for real-time push
    pub message_id: Option<String>,
    /// Whether this call is retained in history
    pub retained: bool,
    /// Retention days
    pub retention_days: u32,
    /// Created timestamp
    pub created_at: i64,
    /// Started timestamp
    pub started_at: Option<i64>,
    /// Completed timestamp
    pub completed_at: Option<i64>,
}

impl ToolCallEntry {
    /// Create a new tool call entry
    pub fn new(
        execution_id: String,
        tool_id: String,
        tool_name: String,
        category: ToolCategory,
        input: serde_json::Value,
        correlation_id: String,
        session_id: String,
        user_id: String,
    ) -> Self {
        let now = Utc::now().timestamp();
        Self {
            execution_id,
            tool_id,
            tool_name,
            category,
            status: ToolCallStatus::Pending,
            input,
            output: None,
            error: None,
            duration_ms: None,
            retry_count: 0,
            max_retries: 3,
            manual_result: false,
            correlation_id,
            session_id,
            user_id,
            message_id: None,
            retained: false,
            retention_days: 30,
            created_at: now,
            started_at: None,
            completed_at: None,
        }
    }

    /// Mark as started
    pub fn mark_started(&mut self) {
        self.status = ToolCallStatus::Running;
        self.started_at = Some(Utc::now().timestamp());
    }

    /// Mark as success
    pub fn mark_success(&mut self, output: serde_json::Value) {
        self.status = ToolCallStatus::Success;
        self.output = Some(output);
        self.completed_at = Some(Utc::now().timestamp());
        if let (Some(start), Some(end)) = (self.started_at, self.completed_at) {
            self.duration_ms = Some((end - start).max(0) as u64);
        }
    }

    /// Mark as failed
    pub fn mark_failed(&mut self, error: String) {
        self.status = ToolCallStatus::Failed;
        self.error = Some(error);
        self.completed_at = Some(Utc::now().timestamp());
        if let (Some(start), Some(end)) = (self.started_at, self.completed_at) {
            self.duration_ms = Some((end - start).max(0) as u64);
        }
    }

    /// Mark as timeout
    pub fn mark_timeout(&mut self) {
        self.status = ToolCallStatus::Timeout;
        self.error = Some("Tool execution timed out".to_string());
        self.completed_at = Some(Utc::now().timestamp());
        if let (Some(start), Some(end)) = (self.started_at, self.completed_at) {
            self.duration_ms = Some((end - start).max(0) as u64);
        }
    }

    /// Mark as cancelled
    pub fn mark_cancelled(&mut self) {
        self.status = ToolCallStatus::Cancelled;
        self.completed_at = Some(Utc::now().timestamp());
        if let (Some(start), Some(end)) = (self.started_at, self.completed_at) {
            self.duration_ms = Some((end - start).max(0) as u64);
        }
    }

    /// Mark for retry
    pub fn mark_retry(&mut self) {
        self.retry_count += 1;
        if self.retry_count >= self.max_retries {
            self.status = ToolCallStatus::Failed;
        } else {
            self.status = ToolCallStatus::Retrying;
        }
    }

    /// Set manual result
    pub fn set_manual_result(&mut self, output: serde_json::Value) {
        self.manual_result = true;
        self.output = Some(output);
        self.status = ToolCallStatus::Success;
        self.completed_at = Some(Utc::now().timestamp());
    }
}

/// Statistics for tool call visibility
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolVisibilityStats {
    /// Total calls
    pub total_calls: u64,
    /// Success count
    pub success_count: u64,
    /// Failed count
    pub failed_count: u64,
    /// Timeout count
    pub timeout_count: u64,
    /// Cancelled count
    pub cancelled_count: u64,
    /// Retry count
    pub retry_count: u64,
    /// Average duration in ms
    pub avg_duration_ms: u64,
    /// Success rate percentage
    pub success_rate: f64,
}

/// Filter options for querying tool calls
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCallFilter {
    /// Search by tool name or execution ID
    pub search: Option<String>,
    /// Filter by status
    pub status: Option<ToolCallStatus>,
    /// Filter by category
    pub category: Option<ToolCategory>,
    /// Filter by session ID
    pub session_id: Option<String>,
    /// Filter by user ID
    pub user_id: Option<String>,
    /// Start timestamp filter
    pub start_time: Option<i64>,
    /// End timestamp filter
    pub end_time: Option<i64>,
    /// Only show failed calls (for retry UI)
    pub failed_only: bool,
    /// Only show retained calls
    pub retained_only: bool,
}
