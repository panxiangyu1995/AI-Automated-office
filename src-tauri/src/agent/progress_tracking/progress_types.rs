//! Progress tracking types for agent task execution monitoring.
//!
//! This module defines the core types for tracking agent task progress,
//! including status enumeration, progress updates, and metrics collection.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Task execution status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProgressTaskStatus {
    /// Task is queued but not yet started
    Pending,
    /// Task is currently executing
    Running,
    /// Task finished successfully
    Completed,
    /// Task encountered an error
    Failed,
    /// Task was cancelled by user or system
    Cancelled,
}

impl Default for ProgressTaskStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// Activity entry for tracking recent actions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEntry {
    /// Tool or action name
    pub activity_name: String,
    /// Activity description (sanitized)
    pub description: String,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
    /// Timestamp of the activity
    pub timestamp: DateTime<Utc>,
    /// Activity status
    pub status: ActivityStatus,
    /// Optional metadata
    pub metadata: Option<serde_json::Value>,
}

/// Activity status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActivityStatus {
    Success,
    Failed,
    Skipped,
    InProgress,
}

impl Default for ActivityStatus {
    fn default() -> Self {
        Self::InProgress
    }
}

/// Progress update structure for real-time tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressUpdate {
    /// UUID of the task being tracked
    pub task_id: Uuid,
    /// Current execution status
    pub status: ProgressTaskStatus,
    /// Number of tools executed
    pub tool_use_count: usize,
    /// Total tokens consumed (input + output)
    pub token_count: TokenUsage,
    /// Description of the most recent activity
    pub last_activity: String,
    /// Optional progress percentage (0.0 to 100.0)
    pub progress_percent: Option<f32>,
    /// Timestamp when the task started
    pub started_at: DateTime<Utc>,
    /// Timestamp of the last update
    pub updated_at: DateTime<Utc>,
    /// Recent activities (last N entries)
    #[serde(default)]
    pub recent_activities: Vec<ActivityEntry>,
    /// Optional error message if failed
    pub error_message: Option<String>,
    /// Current turn number in the conversation
    #[serde(default)]
    pub current_turn: usize,
    /// Maximum turns allowed
    #[serde(default)]
    pub max_turns: usize,
}

/// Token usage breakdown
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsage {
    /// Input tokens consumed
    pub input_tokens: u64,
    /// Output tokens generated
    pub output_tokens: u64,
    /// Total tokens
    pub total_tokens: u64,
}

impl TokenUsage {
    pub fn new(input: u64, output: u64) -> Self {
        Self {
            input_tokens: input,
            output_tokens: output,
            total_tokens: input.saturating_add(output),
        }
    }

    pub fn add(&mut self, other: &TokenUsage) {
        self.input_tokens = self.input_tokens.saturating_add(other.input_tokens);
        self.output_tokens = self.output_tokens.saturating_add(other.output_tokens);
        self.total_tokens = self.total_tokens.saturating_add(other.total_tokens);
    }
}

/// Tool call metrics for performance tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolMetrics {
    /// Tool name
    pub tool_name: String,
    /// Number of times this tool was called
    pub call_count: usize,
    /// Total execution time in milliseconds
    pub total_duration_ms: u64,
    /// Average execution time in milliseconds
    pub avg_duration_ms: f64,
    /// Success count
    pub success_count: usize,
    /// Failure count
    pub failure_count: usize,
    /// Last call timestamp
    pub last_called_at: Option<DateTime<Utc>>,
}

impl ToolMetrics {
    pub fn new(tool_name: String) -> Self {
        Self {
            tool_name,
            call_count: 0,
            total_duration_ms: 0,
            avg_duration_ms: 0.0,
            success_count: 0,
            failure_count: 0,
            last_called_at: None,
        }
    }

    pub fn record_call(&mut self, duration_ms: u64, success: bool) {
        self.call_count += 1;
        self.total_duration_ms = self.total_duration_ms.saturating_add(duration_ms);
        self.avg_duration_ms = self.total_duration_ms as f64 / self.call_count as f64;
        self.last_called_at = Some(Utc::now());

        if success {
            self.success_count += 1;
        } else {
            self.failure_count += 1;
        }
    }
}

/// Task metrics summary for analytics
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskMetrics {
    /// Task ID
    pub task_id: Uuid,
    /// Total duration in milliseconds
    pub total_duration_ms: u64,
    /// Average tool latency in milliseconds
    pub avg_tool_latency_ms: f64,
    /// Total tokens consumed
    pub total_tokens: u64,
    /// Whether task completed successfully
    pub success: bool,
    /// Timestamp when task started
    pub started_at: DateTime<Utc>,
    /// Timestamp when task ended
    pub ended_at: Option<DateTime<Utc>>,
    /// Number of tools used
    pub tools_used: usize,
    /// Number of turns
    pub turns: usize,
}

impl TaskMetrics {
    pub fn from_progress_update(progress: &ProgressUpdate) -> Self {
        let duration_ms = progress
            .updated_at
            .signed_duration_since(progress.started_at)
            .num_milliseconds() as u64;

        Self {
            task_id: progress.task_id,
            total_duration_ms: duration_ms,
            avg_tool_latency_ms: if progress.tool_use_count > 0 {
                duration_ms as f64 / progress.tool_use_count as f64
            } else {
                0.0
            },
            total_tokens: progress.token_count.total_tokens,
            success: progress.status == ProgressTaskStatus::Completed,
            started_at: progress.started_at,
            ended_at: Some(progress.updated_at),
            tools_used: progress.tool_use_count,
            turns: progress.current_turn,
        }
    }
}

/// Progress subscription for real-time updates
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressSubscription {
    /// Subscription ID
    pub id: String,
    /// Task ID to subscribe to
    pub task_id: Uuid,
    /// Channel for updates (e.g., "websocket", "event")
    pub channel: String,
    /// Filter options
    pub filters: ProgressFilters,
    /// Created at timestamp
    pub created_at: DateTime<Utc>,
}

impl ProgressSubscription {
    pub fn new(task_id: Uuid, channel: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            task_id,
            channel,
            filters: ProgressFilters::default(),
            created_at: Utc::now(),
        }
    }
}

/// Filters for progress updates
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressFilters {
    /// Include only these event types
    #[serde(default)]
    pub event_types: Option<Vec<String>>,
    /// Include tool metrics
    #[serde(default = "default_true")]
    pub include_metrics: bool,
    /// Include recent activities
    #[serde(default = "default_true")]
    pub include_activities: bool,
    /// Maximum activities to include
    #[serde(default = "default_activities_limit")]
    pub max_activities: usize,
}

fn default_true() -> bool {
    true
}

fn default_activities_limit() -> usize {
    10
}

/// Background task notification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskNotification {
    /// Notification ID
    pub id: String,
    /// Task ID
    pub task_id: Uuid,
    /// Notification type
    pub notification_type: NotificationType,
    /// Title
    pub title: String,
    /// Message body
    pub message: String,
    /// Task summary (optional)
    pub summary: Option<TaskMetrics>,
    /// Created at
    pub created_at: DateTime<Utc>,
    /// Whether notification has been read
    #[serde(default)]
    pub read: bool,
}

/// Notification types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationType {
    /// Task completed notification
    Completed,
    /// Task failed notification
    Failed,
    /// Task timeout notification
    Timeout,
    /// Milestone reached notification
    Milestone,
    /// Progress update notification
    Progress,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_progress_task_status_default() {
        let status = ProgressTaskStatus::default();
        assert_eq!(status, ProgressTaskStatus::Pending);
    }

    #[test]
    fn test_token_usage_calculation() {
        let mut usage = TokenUsage::new(100, 50);
        assert_eq!(usage.total_tokens, 150);

        usage.add(&TokenUsage::new(50, 100));
        assert_eq!(usage.input_tokens, 150);
        assert_eq!(usage.output_tokens, 150);
        assert_eq!(usage.total_tokens, 300);
    }

    #[test]
    fn test_tool_metrics_recording() {
        let mut metrics = ToolMetrics::new("test_tool".to_string());

        metrics.record_call(100, true);
        assert_eq!(metrics.call_count, 1);
        assert_eq!(metrics.success_count, 1);
        assert_eq!(metrics.avg_duration_ms, 100.0);

        metrics.record_call(200, true);
        assert_eq!(metrics.call_count, 2);
        assert_eq!(metrics.avg_duration_ms, 150.0);

        metrics.record_call(50, false);
        assert_eq!(metrics.failure_count, 1);
    }

    #[test]
    fn test_progress_subscription_new() {
        let task_id = Uuid::new_v4();
        let sub = ProgressSubscription::new(task_id, "websocket".to_string());

        assert!(!sub.id.is_empty());
        assert_eq!(sub.task_id, task_id);
        assert_eq!(sub.channel, "websocket");
    }
}
