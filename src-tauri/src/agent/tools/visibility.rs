//! Tool Call Visibility Module
//!
//! Implements tool execution visibility and history tracking (FR69-FR80):
//! - Real-time tool call push
//! - Parameter and result display
//! - Failure retry tracking
//! - Manual result input
//! - Batch breakpoint resume
//!
//! Story 36.1 - 工具调用可见性增强

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
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

/// Tool visibility service for tracking tool calls
pub struct ToolVisibilityService {
    /// All tool call entries: execution_id -> entry
    entries: Arc<RwLock<HashMap<String, ToolCallEntry>>>,
    /// Failed calls pending retry
    pending_retries: Arc<RwLock<Vec<String>>>,
    /// Batch operations for breakpoint resume
    batch_operations: Arc<RwLock<HashMap<String, BatchOperation>>>,
}

impl ToolVisibilityService {
    pub fn new() -> Self {
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            pending_retries: Arc::new(RwLock::new(Vec::new())),
            batch_operations: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a new tool call entry
    pub async fn create_entry(
        &self,
        tool_id: String,
        tool_name: String,
        category: ToolCategory,
        input: serde_json::Value,
        correlation_id: String,
        session_id: String,
        user_id: String,
        message_id: Option<String>,
    ) -> ToolCallEntry {
        let execution_id = format!("exec_{}", uuid::Uuid::new_v4());
        let mut entry = ToolCallEntry::new(
            execution_id.clone(),
            tool_id,
            tool_name,
            category,
            input,
            correlation_id,
            session_id,
            user_id,
        );
        entry.message_id = message_id;

        let mut entries = self.entries.write().await;
        entries.insert(execution_id.clone(), entry.clone());
        entry
    }

    /// Get an entry by execution ID
    pub async fn get_entry(&self, execution_id: &str) -> Option<ToolCallEntry> {
        let entries = self.entries.read().await;
        entries.get(execution_id).cloned()
    }

    /// Update entry status to running
    pub async fn mark_started(&self, execution_id: &str) -> Option<ToolCallEntry> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(execution_id) {
            entry.mark_started();
            return Some(entry.clone());
        }
        None
    }

    /// Update entry status to success
    pub async fn mark_success(
        &self,
        execution_id: &str,
        output: serde_json::Value,
    ) -> Option<ToolCallEntry> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(execution_id) {
            entry.mark_success(output);
            let result = entry.clone();
            // Remove from pending retries if present
            drop(entries);
            self.remove_from_pending_retries(execution_id).await;
            return Some(result);
        }
        None
    }

    /// Update entry status to failed
    pub async fn mark_failed(
        &self,
        execution_id: &str,
        error: String,
    ) -> Option<ToolCallEntry> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(execution_id) {
            entry.mark_failed(error);
            return Some(entry.clone());
        }
        None
    }

    /// Mark for retry
    pub async fn mark_retry(&self, execution_id: &str) -> Option<ToolCallEntry> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(execution_id) {
            entry.mark_retry();
            let should_add_to_pending = entry.status == ToolCallStatus::Retrying;
            let result = entry.clone();
            if should_add_to_pending {
                // Add to pending retries
                drop(entries);
                let mut pending = self.pending_retries.write().await;
                if !pending.contains(&execution_id.to_string()) {
                    pending.push(execution_id.to_string());
                }
            }
            return Some(result);
        }
        None
    }

    /// Set manual result for an entry
    pub async fn set_manual_result(
        &self,
        execution_id: &str,
        output: serde_json::Value,
    ) -> Option<ToolCallEntry> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(execution_id) {
            entry.set_manual_result(output);
            let result = entry.clone();
            // Remove from pending retries
            drop(entries);
            self.remove_from_pending_retries(execution_id).await;
            return Some(result);
        }
        None
    }

    /// Mark entry as retained
    pub async fn mark_retained(&self, execution_id: &str, retained: bool, retention_days: u32) -> Option<ToolCallEntry> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(execution_id) {
            entry.retained = retained;
            entry.retention_days = retention_days;
            return Some(entry.clone());
        }
        None
    }

    /// Remove from pending retries list
    async fn remove_from_pending_retries(&self, execution_id: &str) {
        let mut pending = self.pending_retries.write().await;
        pending.retain(|id| id != execution_id);
    }

    /// Get all entries matching a filter
    pub async fn query_entries(&self, filter: ToolCallFilter) -> Vec<ToolCallEntry> {
        let entries = self.entries.read().await;
        entries.values()
            .filter(|entry| {
                // Search filter
                if let Some(ref search) = filter.search {
                    let search_lower = search.to_lowercase();
                    if !entry.tool_name.to_lowercase().contains(&search_lower)
                        && !entry.execution_id.to_lowercase().contains(&search_lower)
                        && !entry.correlation_id.to_lowercase().contains(&search_lower)
                    {
                        return false;
                    }
                }

                // Status filter
                if let Some(status) = filter.status {
                    if entry.status != status {
                        return false;
                    }
                }

                // Category filter
                if let Some(category) = filter.category {
                    if entry.category != category {
                        return false;
                    }
                }

                // Session ID filter
                if let Some(ref session_id) = filter.session_id {
                    if &entry.session_id != session_id {
                        return false;
                    }
                }

                // User ID filter
                if let Some(ref user_id) = filter.user_id {
                    if &entry.user_id != user_id {
                        return false;
                    }
                }

                // Time range filter
                if let Some(start) = filter.start_time {
                    if entry.created_at < start {
                        return false;
                    }
                }
                if let Some(end) = filter.end_time {
                    if entry.created_at > end {
                        return false;
                    }
                }

                // Failed only filter
                if filter.failed_only {
                    if entry.status != ToolCallStatus::Failed
                        && entry.status != ToolCallStatus::Timeout
                    {
                        return false;
                    }
                }

                // Retained only filter
                if filter.retained_only && !entry.retained {
                    return false;
                }

                true
            })
            .cloned()
            .collect()
    }

    /// Get entries for a specific session
    pub async fn get_session_entries(&self, session_id: &str) -> Vec<ToolCallEntry> {
        let filter = ToolCallFilter {
            session_id: Some(session_id.to_string()),
            ..Default::default()
        };
        self.query_entries(filter).await
    }

    /// Get all failed entries that can be retried
    pub async fn get_retriable_entries(&self) -> Vec<ToolCallEntry> {
        let entries = self.entries.read().await;
        entries.values()
            .filter(|entry| {
                (entry.status == ToolCallStatus::Failed || entry.status == ToolCallStatus::Timeout)
                    && entry.retry_count < entry.max_retries
            })
            .cloned()
            .collect()
    }

    /// Get pending retry entries
    pub async fn get_pending_retries(&self) -> Vec<ToolCallEntry> {
        let pending = self.pending_retries.read().await;
        let entries = self.entries.read().await;
        pending.iter()
            .filter_map(|id| entries.get(id).cloned())
            .filter(|entry| entry.status == ToolCallStatus::Retrying || entry.status == ToolCallStatus::Failed)
            .collect()
    }

    /// Get visibility statistics
    pub async fn get_stats(&self) -> ToolVisibilityStats {
        let entries = self.entries.read().await;
        let total = entries.len() as u64;
        let success_count = entries.values().filter(|e| e.status == ToolCallStatus::Success).count() as u64;
        let failed_count = entries.values().filter(|e| e.status == ToolCallStatus::Failed).count() as u64;
        let timeout_count = entries.values().filter(|e| e.status == ToolCallStatus::Timeout).count() as u64;
        let cancelled_count = entries.values().filter(|e| e.status == ToolCallStatus::Cancelled).count() as u64;
        let retry_count: u64 = entries.values().map(|e| e.retry_count as u64).sum();

        let total_duration: u64 = entries.values()
            .filter_map(|e| e.duration_ms)
            .sum();

        let avg_duration = if total > 0 {
            total_duration / total
        } else {
            0
        };

        let success_rate = if total > 0 {
            (success_count as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        ToolVisibilityStats {
            total_calls: total,
            success_count,
            failed_count,
            timeout_count,
            cancelled_count,
            retry_count,
            avg_duration_ms: avg_duration,
            success_rate,
        }
    }

    /// Delete an entry
    pub async fn delete_entry(&self, execution_id: &str) -> bool {
        let mut entries = self.entries.write().await;
        entries.remove(execution_id).is_some()
    }

    /// Clear all entries
    pub async fn clear_all(&self) {
        let mut entries = self.entries.write().await;
        entries.clear();
        let mut pending = self.pending_retries.write().await;
        pending.clear();
    }
}

impl Default for ToolVisibilityService {
    fn default() -> Self {
        Self::new()
    }
}

/// Batch operation for breakpoint resume
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchOperation {
    pub batch_id: String,
    pub tool_id: String,
    pub entries: Vec<String>, // execution_ids
    pub status: BatchStatus,
    pub completed_count: u32,
    pub failed_count: u32,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BatchStatus {
    Pending,
    InProgress,
    Completed,
    PartiallyFailed,
    Failed,
}

impl ToolVisibilityService {
    /// Create a batch operation for multiple tool calls
    pub async fn create_batch(
        &self,
        tool_id: String,
        execution_ids: Vec<String>,
    ) -> BatchOperation {
        let batch_id = format!("batch_{}", uuid::Uuid::new_v4());
        let batch = BatchOperation {
            batch_id: batch_id.clone(),
            tool_id,
            entries: execution_ids,
            status: BatchStatus::Pending,
            completed_count: 0,
            failed_count: 0,
            created_at: Utc::now().timestamp(),
            completed_at: None,
        };

        let mut batches = self.batch_operations.write().await;
        batches.insert(batch_id.clone(), batch.clone());
        batch
    }

    /// Start a batch operation
    pub async fn start_batch(&self, batch_id: &str) -> Option<BatchOperation> {
        let mut batches = self.batch_operations.write().await;
        if let Some(batch) = batches.get_mut(batch_id) {
            batch.status = BatchStatus::InProgress;
            return Some(batch.clone());
        }
        None
    }

    /// Update batch operation progress
    pub async fn update_batch_progress(
        &self,
        batch_id: &str,
        completed: u32,
        failed: u32,
    ) -> Option<BatchOperation> {
        let mut batches = self.batch_operations.write().await;
        if let Some(batch) = batches.get_mut(batch_id) {
            batch.completed_count = completed;
            batch.failed_count = failed;
            if completed as usize == batch.entries.len() {
                batch.status = BatchStatus::Completed;
                batch.completed_at = Some(Utc::now().timestamp());
            } else if failed > 0 {
                batch.status = BatchStatus::PartiallyFailed;
            }
            return Some(batch.clone());
        }
        None
    }

    /// Get batch operation
    pub async fn get_batch(&self, batch_id: &str) -> Option<BatchOperation> {
        let batches = self.batch_operations.read().await;
        batches.get(batch_id).cloned()
    }

    /// Get all pending batch operations
    pub async fn get_pending_batches(&self) -> Vec<BatchOperation> {
        let batches = self.batch_operations.read().await;
        batches.values()
            .filter(|b| b.status == BatchStatus::Pending || b.status == BatchStatus::InProgress)
            .cloned()
            .collect()
    }

    /// Resume a failed batch (get failed entries for retry)
    pub async fn resume_batch(&self, batch_id: &str) -> Option<Vec<ToolCallEntry>> {
        let batches = self.batch_operations.read().await;
        if let Some(batch) = batches.get(batch_id) {
            let entries = self.entries.read().await;
            let failed_entries: Vec<ToolCallEntry> = batch.entries.iter()
                .filter_map(|exec_id| {
                    entries.get(exec_id).and_then(|e| {
                        if e.status == ToolCallStatus::Failed || e.status == ToolCallStatus::Timeout {
                            Some(e.clone())
                        } else {
                            None
                        }
                    })
                })
                .collect();
            return Some(failed_entries);
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_tool_call_lifecycle() {
        let service = ToolVisibilityService::new();

        // Create entry
        let entry = service.create_entry(
            "file_read".to_string(),
            "file_read".to_string(),
            ToolCategory::General,
            serde_json::json!({"path": "/test.txt"}),
            "corr-001".to_string(),
            "sess-001".to_string(),
            "user-001".to_string(),
            None,
        ).await;

        assert_eq!(entry.status, ToolCallStatus::Pending);
        assert_eq!(entry.tool_name, "file_read");

        // Mark started
        let entry = service.mark_started(&entry.execution_id).await.unwrap();
        assert_eq!(entry.status, ToolCallStatus::Running);

        // Mark success
        let entry = service.mark_success(
            &entry.execution_id,
            serde_json::json!({"content": "test content"}),
        ).await.unwrap();
        assert_eq!(entry.status, ToolCallStatus::Success);
        assert!(entry.output.is_some());
    }

    #[tokio::test]
    async fn test_retry_mechanism() {
        let service = ToolVisibilityService::new();

        let entry = service.create_entry(
            "http_request".to_string(),
            "http_request".to_string(),
            ToolCategory::General,
            serde_json::json!({"url": "https://example.com"}),
            "corr-002".to_string(),
            "sess-001".to_string(),
            "user-001".to_string(),
            None,
        ).await;

        // Mark as failed
        service.mark_failed(&entry.execution_id, "Connection timeout".to_string()).await;

        // Mark for retry
        let entry = service.mark_retry(&entry.execution_id).await.unwrap();
        assert_eq!(entry.status, ToolCallStatus::Retrying);
        assert_eq!(entry.retry_count, 1);

        // Check pending retries
        let pending = service.get_pending_retries().await;
        assert!(!pending.is_empty());
    }

    #[tokio::test]
    async fn test_manual_result() {
        let service = ToolVisibilityService::new();

        let entry = service.create_entry(
            "user_input".to_string(),
            "user_input".to_string(),
            ToolCategory::Platform,
            serde_json::json!({"prompt": "Enter value"}),
            "corr-003".to_string(),
            "sess-001".to_string(),
            "user-001".to_string(),
            None,
        ).await;

        // Set manual result
        let entry = service.set_manual_result(
            &entry.execution_id,
            serde_json::json!({"value": "manual input"}),
        ).await.unwrap();

        assert!(entry.manual_result);
        assert_eq!(entry.status, ToolCallStatus::Success);
    }

    #[tokio::test]
    async fn test_query_filter() {
        let service = ToolVisibilityService::new();

        // Create multiple entries
        service.create_entry(
            "tool_a".to_string(),
            "tool_a".to_string(),
            ToolCategory::General,
            serde_json::json!({}),
            "corr-a".to_string(),
            "sess-001".to_string(),
            "user-001".to_string(),
            None,
        ).await;

        service.create_entry(
            "tool_b".to_string(),
            "tool_b".to_string(),
            ToolCategory::Platform,
            serde_json::json!({}),
            "corr-b".to_string(),
            "sess-001".to_string(),
            "user-002".to_string(),
            None,
        ).await;

        // Query by category
        let filter = ToolCallFilter {
            category: Some(ToolCategory::Platform),
            ..Default::default()
        };
        let results = service.query_entries(filter).await;
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].tool_name, "tool_b");

        // Query by search
        let filter = ToolCallFilter {
            search: Some("tool_a".to_string()),
            ..Default::default()
        };
        let results = service.query_entries(filter).await;
        assert_eq!(results.len(), 1);
    }
}
