//! Progress tracker implementation for real-time task monitoring.
//!
//! This module provides the core ProgressTracker that manages task execution
//! tracking, metrics collection, and real-time progress updates.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;

use chrono::Utc;
use tokio::sync::{broadcast, mpsc, RwLock};
use uuid::Uuid;

use super::progress_types::{
    ActivityEntry, ActivityStatus, NotificationType, ProgressSubscription,
    ProgressTaskStatus, ProgressUpdate, TaskMetrics, TaskNotification, TokenUsage, ToolMetrics,
};

/// ProgressTracker manages real-time tracking of agent task execution.
///
/// It provides:
/// - Task progress tracking with status updates
/// - Tool metrics collection
/// - Token usage monitoring
/// - Activity tracking
/// - Real-time progress streaming via channels
/// - Background task notifications
pub struct ProgressTracker {
    /// Active tasks being tracked
    tasks: Arc<RwLock<HashMap<Uuid, ProgressUpdate>>>,
    /// Tool metrics per task
    tool_metrics: Arc<RwLock<HashMap<Uuid, HashMap<String, ToolMetrics>>>>,
    /// Task activities per task
    activities: Arc<RwLock<HashMap<Uuid, Vec<ActivityEntry>>>>,
    /// Broadcast channel for progress updates
    progress_sender: broadcast::Sender<ProgressUpdate>,
    /// Channel for task notifications
    notification_sender: mpsc::Sender<TaskNotification>,
    /// Active subscriptions
    subscriptions: Arc<RwLock<HashMap<String, ProgressSubscription>>>,
    /// Track ongoing task timers
    task_timers: Arc<RwLock<HashMap<Uuid, Instant>>>,
}

impl ProgressTracker {
    /// Create a new ProgressTracker
    pub fn new() -> Self {
        let (progress_sender, _) = broadcast::channel(100);
        let (notification_sender, _) = mpsc::channel(50);

        Self {
            tasks: Arc::new(RwLock::new(HashMap::new())),
            tool_metrics: Arc::new(RwLock::new(HashMap::new())),
            activities: Arc::new(RwLock::new(HashMap::new())),
            progress_sender,
            notification_sender,
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
            task_timers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a new task for tracking
    pub async fn start_task(&self, task_id: Uuid, max_turns: usize) -> ProgressUpdate {
        let now = Utc::now();

        let progress = ProgressUpdate {
            task_id,
            status: ProgressTaskStatus::Running,
            tool_use_count: 0,
            token_count: TokenUsage::default(),
            last_activity: "Task started".to_string(),
            progress_percent: Some(0.0),
            started_at: now,
            updated_at: now,
            recent_activities: Vec::new(),
            error_message: None,
            current_turn: 0,
            max_turns,
        };

        // Store task
        {
            let mut tasks = self.tasks.write().await;
            tasks.insert(task_id, progress.clone());
        }

        // Initialize tool metrics
        {
            let mut metrics = self.tool_metrics.write().await;
            metrics.insert(task_id, HashMap::new());
        }

        // Initialize activities
        {
            let mut activities = self.activities.write().await;
            activities.insert(task_id, Vec::new());
        }

        // Start timer
        {
            let mut timers = self.task_timers.write().await;
            timers.insert(task_id, Instant::now());
        }

        // Broadcast initial update
        let _ = self.progress_sender.send(progress.clone());

        progress
    }

    /// Update task status
    pub async fn update_status(&self, task_id: Uuid, status: ProgressTaskStatus) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.status = status;
            p.updated_at = Utc::now();
        }).await
    }

    /// Update task progress percentage
    pub async fn update_progress(&self, task_id: Uuid, percent: f32) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.progress_percent = Some(percent.clamp(0.0, 100.0));
            p.updated_at = Utc::now();
        }).await
    }

    /// Update last activity description
    pub async fn update_activity(&self, task_id: Uuid, activity: &str) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.last_activity = activity.to_string();
            p.updated_at = Utc::now();
        }).await
    }

    /// Increment tool use count
    pub async fn increment_tool_count(&self, task_id: Uuid) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.tool_use_count += 1;
            p.updated_at = Utc::now();
        }).await
    }

    /// Update token usage
    pub async fn update_token_usage(
        &self,
        task_id: Uuid,
        input_tokens: u64,
        output_tokens: u64,
    ) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.token_count = TokenUsage::new(input_tokens, output_tokens);
            p.updated_at = Utc::now();
        }).await
    }

    /// Add to token usage (for cumulative updates)
    pub async fn add_token_usage(
        &self,
        task_id: Uuid,
        input_tokens: u64,
        output_tokens: u64,
    ) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.token_count.add(&TokenUsage::new(input_tokens, output_tokens));
            p.updated_at = Utc::now();
        }).await
    }

    /// Record a tool call
    pub async fn record_tool_call(
        &self,
        task_id: Uuid,
        tool_name: &str,
        duration_ms: u64,
        success: bool,
    ) -> Option<ProgressUpdate> {
        // Update tool metrics
        {
            let mut metrics_map = self.tool_metrics.write().await;
            if let Some(metrics) = metrics_map.get_mut(&task_id) {
                let metrics = metrics.entry(tool_name.to_string()).or_insert_with(|| {
                    ToolMetrics::new(tool_name.to_string())
                });
                metrics.record_call(duration_ms, success);
            }
        }

        // Record activity
        self.record_activity(
            task_id,
            tool_name,
            &format!("Tool {} {}", tool_name, if success { "completed" } else { "failed" }),
            duration_ms,
            if success { ActivityStatus::Success } else { ActivityStatus::Failed },
        ).await;

        // Increment tool count and update
        self.increment_tool_count(task_id).await
    }

    /// Record an activity entry
    pub async fn record_activity(
        &self,
        task_id: Uuid,
        activity_name: &str,
        description: &str,
        duration_ms: u64,
        status: ActivityStatus,
    ) -> Option<ProgressUpdate> {
        let entry = ActivityEntry {
            activity_name: activity_name.to_string(),
            description: description.to_string(),
            duration_ms,
            timestamp: Utc::now(),
            status,
            metadata: None,
        };

        // Add to activities
        {
            let mut activities = self.activities.write().await;
            if let Some(entries) = activities.get_mut(&task_id) {
                entries.push(entry);
                // Keep only last 50 activities
                if entries.len() > 50 {
                    entries.drain(0..entries.len() - 50);
                }
            }
        }

        // Update progress with recent activities
        self.update_task(task_id, |p| {
            let activities = self.activities.blocking_read();
            if let Some(entries) = activities.get(&task_id) {
                p.recent_activities = entries.iter().rev().take(10).cloned().collect();
            }
            p.updated_at = Utc::now();
        }).await
    }

    /// Increment turn counter
    pub async fn increment_turn(&self, task_id: Uuid) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.current_turn += 1;
            p.updated_at = Utc::now();

            // Update progress based on turns if max_turns is set
            if p.max_turns > 0 {
                p.progress_percent = Some(
                    (p.current_turn as f32 / p.max_turns as f32 * 100.0).clamp(0.0, 100.0)
                );
            }
        }).await
    }

    /// Mark task as completed
    pub async fn complete_task(&self, task_id: Uuid) -> Option<TaskMetrics> {
        // Get final progress
        let progress = self.update_task(task_id, |p| {
            p.status = ProgressTaskStatus::Completed;
            p.progress_percent = Some(100.0);
            p.updated_at = Utc::now();
        }).await?;

        // Calculate metrics
        let metrics = TaskMetrics::from_progress_update(&progress);

        // Send notification
        self.send_notification(
            task_id,
            NotificationType::Completed,
            "Task Completed",
            "Your task has been completed successfully.",
            Some(metrics.clone()),
        ).await;

        // Cleanup timers
        {
            let mut timers = self.task_timers.write().await;
            timers.remove(&task_id);
        }

        Some(metrics)
    }

    /// Mark task as failed
    pub async fn fail_task(&self, task_id: Uuid, error: &str) -> Option<TaskMetrics> {
        // Get final progress with error
        let progress = self.update_task(task_id, |p| {
            p.status = ProgressTaskStatus::Failed;
            p.error_message = Some(error.to_string());
            p.updated_at = Utc::now();
        }).await?;

        // Calculate metrics
        let metrics = TaskMetrics::from_progress_update(&progress);

        // Send notification
        self.send_notification(
            task_id,
            NotificationType::Failed,
            "Task Failed",
            &format!("Task failed: {}", error),
            Some(metrics.clone()),
        ).await;

        // Cleanup timers
        {
            let mut timers = self.task_timers.write().await;
            timers.remove(&task_id);
        }

        Some(metrics)
    }

    /// Cancel a task
    pub async fn cancel_task(&self, task_id: Uuid) -> Option<ProgressUpdate> {
        self.update_task(task_id, |p| {
            p.status = ProgressTaskStatus::Cancelled;
            p.updated_at = Utc::now();
        }).await
    }

    /// Get current progress for a task
    pub async fn get_progress(&self, task_id: Uuid) -> Option<ProgressUpdate> {
        let tasks = self.tasks.read().await;
        tasks.get(&task_id).cloned()
    }

    /// Get tool metrics for a task
    pub async fn get_tool_metrics(&self, task_id: Uuid) -> HashMap<String, ToolMetrics> {
        let metrics = self.tool_metrics.read().await;
        metrics.get(&task_id).cloned().unwrap_or_default()
    }

    /// Get activities for a task
    pub async fn get_activities(&self, task_id: Uuid) -> Vec<ActivityEntry> {
        let activities = self.activities.read().await;
        activities.get(&task_id).cloned().unwrap_or_default()
    }

    /// Get task metrics summary
    pub async fn get_metrics(&self, task_id: Uuid) -> Option<TaskMetrics> {
        let progress = self.get_progress(task_id).await?;
        Some(TaskMetrics::from_progress_update(&progress))
    }

    /// Subscribe to progress updates for a task
    pub async fn subscribe(
        &self,
        task_id: Uuid,
        channel: &str,
    ) -> ProgressSubscription {
        let sub = ProgressSubscription::new(task_id, channel.to_string());

        let mut subs = self.subscriptions.write().await;
        subs.insert(sub.id.clone(), sub.clone());

        sub
    }

    /// Unsubscribe from progress updates
    pub async fn unsubscribe(&self, subscription_id: &str) -> bool {
        let mut subs = self.subscriptions.write().await;
        subs.remove(subscription_id).is_some()
    }

    /// Subscribe to progress channel (returns receiver)
    pub fn subscribe_channel(&self) -> broadcast::Receiver<ProgressUpdate> {
        self.progress_sender.subscribe()
    }

    /// Broadcast a progress update
    async fn broadcast_update(&self, progress: &ProgressUpdate) {
        let _ = self.progress_sender.send(progress.clone());
    }

    /// Send a task notification
    async fn send_notification(
        &self,
        task_id: Uuid,
        notification_type: NotificationType,
        title: &str,
        message: &str,
        summary: Option<TaskMetrics>,
    ) {
        let notification = TaskNotification {
            id: Uuid::new_v4().to_string(),
            task_id,
            notification_type,
            title: title.to_string(),
            message: message.to_string(),
            summary,
            created_at: Utc::now(),
            read: false,
        };

        let _ = self.notification_sender.send(notification).await;
    }

    /// Check notification receiver - returns sender for sending notifications
    pub fn notification_sender(&self) -> mpsc::Sender<TaskNotification> {
        self.notification_sender.clone()
    }

    /// Internal update helper
    async fn update_task<F>(&self, task_id: Uuid, f: F) -> Option<ProgressUpdate>
    where
        F: FnOnce(&mut ProgressUpdate),
    {
        // Get mutable access
        let progress = {
            let mut tasks = self.tasks.write().await;
            tasks.get_mut(&task_id).map(|p| {
                f(p);
                p.clone()
            })
        };

        // Broadcast if update succeeded
        if let Some(ref p) = progress {
            self.broadcast_update(p).await;
        }

        progress
    }

    /// List all active tasks
    pub async fn list_active_tasks(&self) -> Vec<ProgressUpdate> {
        let tasks = self.tasks.read().await;
        tasks.values()
            .filter(|p| p.status == ProgressTaskStatus::Running || p.status == ProgressTaskStatus::Pending)
            .cloned()
            .collect()
    }

    /// Get all tasks with their status
    pub async fn list_all_tasks(&self) -> Vec<ProgressUpdate> {
        let tasks = self.tasks.read().await;
        tasks.values().cloned().collect()
    }

    /// Cleanup completed/failed tasks older than given duration
    pub async fn cleanup_old_tasks(&self, max_age_seconds: u64) {
        let cutoff = chrono::Duration::seconds(max_age_seconds as i64);
        let now = Utc::now();

        let mut tasks = self.tasks.write().await;
        let mut tool_metrics = self.tool_metrics.write().await;
        let mut activities = self.activities.write().await;

        // Collect IDs to remove
        let to_remove: Vec<Uuid> = tasks.iter()
            .filter(|(_, p)| {
                let age = now.signed_duration_since(p.updated_at);
                age > cutoff && p.status != ProgressTaskStatus::Running && p.status != ProgressTaskStatus::Pending
            })
            .map(|(id, _)| *id)
            .collect();

        // Remove old tasks
        for id in to_remove {
            tasks.remove(&id);
            tool_metrics.remove(&id);
            activities.remove(&id);
        }
    }

    /// Check if a task is running
    pub async fn is_task_running(&self, task_id: Uuid) -> bool {
        let tasks = self.tasks.read().await;
        tasks.get(&task_id)
            .map(|p| p.status == ProgressTaskStatus::Running)
            .unwrap_or(false)
    }
}

impl Default for ProgressTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for ProgressTracker {
    fn clone(&self) -> Self {
        Self {
            tasks: Arc::clone(&self.tasks),
            tool_metrics: Arc::clone(&self.tool_metrics),
            activities: Arc::clone(&self.activities),
            progress_sender: self.progress_sender.clone(),
            notification_sender: self.notification_sender.clone(),
            subscriptions: Arc::clone(&self.subscriptions),
            task_timers: Arc::clone(&self.task_timers),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_start_and_track_task() {
        let tracker = ProgressTracker::new();
        let task_id = Uuid::new_v4();

        // Start task
        let progress = tracker.start_task(task_id, 10).await;
        assert_eq!(progress.status, ProgressTaskStatus::Running);
        assert_eq!(progress.current_turn, 0);
        assert_eq!(progress.max_turns, 10);

        // Update activity
        tracker.update_activity(task_id, "Processing request").await;

        // Check progress
        let current = tracker.get_progress(task_id).await;
        assert!(current.is_some());
        assert_eq!(current.unwrap().last_activity, "Processing request");
    }

    #[tokio::test]
    async fn test_record_tool_call() {
        let tracker = ProgressTracker::new();
        let task_id = Uuid::new_v4();

        tracker.start_task(task_id, 10).await;

        // Record tool call
        tracker.record_tool_call(task_id, "read_file", 150, true).await;

        let progress = tracker.get_progress(task_id).await.unwrap();
        assert_eq!(progress.tool_use_count, 1);

        let metrics = tracker.get_tool_metrics(task_id).await;
        assert!(metrics.contains_key("read_file"));
        assert_eq!(metrics["read_file"].call_count, 1);
    }

    #[tokio::test]
    async fn test_complete_task() {
        let tracker = ProgressTracker::new();
        let task_id = Uuid::new_v4();

        tracker.start_task(task_id, 10).await;
        tracker.increment_turn(task_id).await;
        tracker.increment_turn(task_id).await;

        let metrics = tracker.complete_task(task_id).await;

        assert!(metrics.is_some());
        let m = metrics.unwrap();
        assert_eq!(m.turns, 2);
        assert!(m.success);
    }

    #[tokio::test]
    async fn test_fail_task() {
        let tracker = ProgressTracker::new();
        let task_id = Uuid::new_v4();

        tracker.start_task(task_id, 10).await;
        let metrics = tracker.fail_task(task_id, "Network error").await;

        assert!(metrics.is_some());
        let m = metrics.unwrap();
        assert!(!m.success);

        let progress = tracker.get_progress(task_id).await.unwrap();
        assert_eq!(progress.error_message, Some("Network error".to_string()));
    }

    #[tokio::test]
    async fn test_progress_channel() {
        let tracker = ProgressTracker::new();
        let task_id = Uuid::new_v4();

        let mut receiver = tracker.subscribe_channel();

        tracker.start_task(task_id, 10).await;

        // Should receive update
        let update = tokio::time::timeout(
            tokio::time::Duration::from_millis(100),
            receiver.recv()
        ).await;

        assert!(update.is_ok());
    }
}
