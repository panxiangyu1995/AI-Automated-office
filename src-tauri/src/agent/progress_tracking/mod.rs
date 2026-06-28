//! Progress tracking module for agent task execution monitoring.
//!
//! This module provides real-time progress tracking, metrics collection,
//! and notification support for agent task execution.
//!
//! # Features
//!
//! - Task progress tracking with status updates
//! - Tool call metrics collection
//! - Token usage monitoring
//! - Activity tracking
//! - Real-time progress streaming
//! - Background task notifications
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::agent::progress_tracking::{ProgressTracker, ProgressTaskStatus};
//!
//! let tracker = ProgressTracker::new();
//! let task_id = uuid::Uuid::new_v4();
//!
//! // Start tracking a task
//! tracker.start_task(task_id, 10).await;
//!
//! // Record progress
//! tracker.record_tool_call(task_id, "read_file", 150, true).await;
//! tracker.increment_turn(task_id).await;
//!
//! // Complete the task
//! let metrics = tracker.complete_task(task_id).await;
//! ```

pub mod progress_types;
pub mod progress_tracker;

#[cfg(feature = "agent-tauri")]
pub use progress_types::{ProgressUpdate, TaskMetrics};

pub use progress_tracker::ProgressTracker;
