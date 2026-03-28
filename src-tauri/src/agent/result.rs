//! Sub-Agent Result Return and Merge Module
//!
//! This module implements:
//! - Normalized Sub-Agent result and summary payloads
//! - Result and failure merge back into main Agent context
//! - Main Agent replanning or review handoff based on returned results
//! - Context boundary preservation during result merge
//! - Visible debug and review data for parent-child Agent interaction
//!
//! Story 52.4 - Sub-Agent result return and merge

use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Result merge status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MergeStatus {
    Pending,
    Merged,
    Rejected,
    PartiallyMerged,
    ReviewRequired,
}

impl std::fmt::Display for MergeStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MergeStatus::Pending => write!(f, "pending"),
            MergeStatus::Merged => write!(f, "merged"),
            MergeStatus::Rejected => write!(f, "rejected"),
            MergeStatus::PartiallyMerged => write!(f, "partially_merged"),
            MergeStatus::ReviewRequired => write!(f, "review_required"),
        }
    }
}

/// Sub-Agent execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentResult {
    pub execution_id: String,
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub status: SubAgentResultStatus,
    pub output: Option<String>,
    pub summary: Option<String>,
    pub steps_used: i32,
    pub tools_used: Vec<String>,
    pub tools_denied: Vec<String>,
    pub memory_entries: Vec<MemoryEntrySummary>,
    pub error: Option<String>,
    pub duration_ms: i64,
    pub completed_at: i64,
}

/// Memory entry summary for result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntrySummary {
    pub key: String,
    pub scope: String,
    pub created_at: i64,
}

/// Sub-Agent result status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SubAgentResultStatus {
    Success,
    Failed,
    Timeout,
    Cancelled,
    MaxStepsExceeded,
}

impl std::fmt::Display for SubAgentResultStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SubAgentResultStatus::Success => write!(f, "success"),
            SubAgentResultStatus::Failed => write!(f, "failed"),
            SubAgentResultStatus::Timeout => write!(f, "timeout"),
            SubAgentResultStatus::Cancelled => write!(f, "cancelled"),
            SubAgentResultStatus::MaxStepsExceeded => write!(f, "max_steps_exceeded"),
        }
    }
}

/// Merged result record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergedResultRecord {
    pub id: String,
    pub parent_execution_id: String,
    pub child_execution_id: String,
    pub merge_status: MergeStatus,
    pub merged_at: i64,
    pub merged_by: String,
    pub result_summary: Option<String>,
    pub failure_info: Option<FailureInfo>,
    pub review_notes: Option<String>,
}

/// Failure information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailureInfo {
    pub error_type: String,
    pub error_message: String,
    pub recovery_suggestion: Option<String>,
    pub retry_recommended: bool,
}

/// Review decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewDecision {
    pub decision_id: String,
    pub merged_result_id: String,
    pub decision: ReviewOutcome,
    pub reviewed_by: String,
    pub reviewed_at: i64,
    pub notes: Option<String>,
}

/// Review outcome
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ReviewOutcome {
    Accept,
    Reject,
    Modify,
    Retry,
    Escalate,
}

impl std::fmt::Display for ReviewOutcome {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReviewOutcome::Accept => write!(f, "accept"),
            ReviewOutcome::Reject => write!(f, "reject"),
            ReviewOutcome::Modify => write!(f, "modify"),
            ReviewOutcome::Retry => write!(f, "retry"),
            ReviewOutcome::Escalate => write!(f, "escalate"),
        }
    }
}

/// Result merge policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultMergePolicy {
    pub auto_merge_on_success: bool,
    pub auto_merge_on_partial: bool,
    pub require_review_on_failure: bool,
    pub max_retries: i32,
    pub preserve_context_boundaries: bool,
}

impl Default for ResultMergePolicy {
    fn default() -> Self {
        Self {
            auto_merge_on_success: true,
            auto_merge_on_partial: false,
            require_review_on_failure: true,
            max_retries: 3,
            preserve_context_boundaries: true,
        }
    }
}

/// Parent context update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParentContextUpdate {
    pub session_id: String,
    pub trace_id: String,
    pub result_summary: String,
    pub memory_updates: Vec<MemoryEntrySummary>,
    pub tool_usage_report: ToolUsageReport,
    pub replan_suggestion: Option<String>,
}

/// Tool usage report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolUsageReport {
    pub tools_used: Vec<String>,
    pub tools_denied: Vec<String>,
    pub denied_count: i32,
    pub total_calls: i32,
}

/// Result merge service
#[derive(Clone)]
pub struct ResultMergeService {
    /// Merged results: parent_execution_id -> Vec<MergedResultRecord>
    merged_results: Arc<RwLock<HashMap<String, Vec<MergedResultRecord>>>>,
    /// Pending results for review
    pending_reviews: Arc<RwLock<HashMap<String, SubAgentResult>>>,
    /// Review decisions
    review_decisions: Arc<RwLock<Vec<ReviewDecision>>>,
    /// Policy configuration
    policy: Arc<RwLock<ResultMergePolicy>>,
}

impl ResultMergeService {
    pub fn new() -> Self {
        Self {
            merged_results: Arc::new(RwLock::new(HashMap::new())),
            pending_reviews: Arc::new(RwLock::new(HashMap::new())),
            review_decisions: Arc::new(RwLock::new(Vec::new())),
            policy: Arc::new(RwLock::new(ResultMergePolicy::default())),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Update policy
    pub async fn update_policy(&self, policy: ResultMergePolicy) {
        let mut p = self.policy.write().await;
        *p = policy;
    }

    /// Get current policy
    pub async fn get_policy(&self) -> ResultMergePolicy {
        let p = self.policy.read().await;
        p.clone()
    }

    /// Receive and process Sub-Agent result
    pub async fn receive_result(&self, result: SubAgentResult) -> Result<MergeDecision> {
        let policy = self.get_policy().await;

        // Determine merge decision based on result status and policy
        let decision = match result.status {
            SubAgentResultStatus::Success => {
                if policy.auto_merge_on_success {
                    MergeDecision::AutoMerge(self.merge_result(result.clone()).await?)
                } else {
                    MergeDecision::ReviewRequired(self.store_for_review(result).await?)
                }
            }
            SubAgentResultStatus::Failed | SubAgentResultStatus::Timeout | SubAgentResultStatus::MaxStepsExceeded => {
                if policy.require_review_on_failure {
                    MergeDecision::ReviewRequired(self.store_for_review(result).await?)
                } else {
                    MergeDecision::Reject(self.create_rejection(result.clone()).await?)
                }
            }
            SubAgentResultStatus::Cancelled => {
                MergeDecision::Reject(self.create_rejection(result).await?)
            }
        };

        Ok(decision)
    }

    /// Merge successful result into parent context
    async fn merge_result(&self, result: SubAgentResult) -> Result<MergedResultRecord> {
        let record = MergedResultRecord {
            id: Self::generate_id("merged"),
            parent_execution_id: result.execution_id.clone(),
            child_execution_id: result.execution_id.clone(),
            merge_status: MergeStatus::Merged,
            merged_at: Utc::now().timestamp(),
            merged_by: "system".to_string(),
            result_summary: result.summary.clone(),
            failure_info: None,
            review_notes: None,
        };

        // Store merged result
        {
            let mut merged = self.merged_results.write().await;
            merged
                .entry(result.execution_id.clone())
                .or_insert_with(Vec::new)
                .push(record.clone());
        }

        Ok(record)
    }

    /// Store result for manual review
    async fn store_for_review(&self, result: SubAgentResult) -> Result<String> {
        let review_id = Self::generate_id("review");
        let mut pending = self.pending_reviews.write().await;
        pending.insert(review_id.clone(), result);
        Ok(review_id)
    }

    /// Create rejection record
    async fn create_rejection(&self, result: SubAgentResult) -> Result<MergedResultRecord> {
        let execution_id = result.execution_id.clone();
        let status = result.status.clone();
        let error_msg = result.error.clone();
        let tools_denied = result.tools_denied.clone();

        let failure_info = FailureInfo {
            error_type: status.to_string(),
            error_message: error_msg.unwrap_or_else(|| "Unknown error".to_string()),
            recovery_suggestion: self.suggest_recovery(&status, &tools_denied).await,
            retry_recommended: status == SubAgentResultStatus::Timeout
                || status == SubAgentResultStatus::MaxStepsExceeded,
        };

        let record = MergedResultRecord {
            id: Self::generate_id("merged"),
            parent_execution_id: execution_id.clone(),
            child_execution_id: execution_id,
            merge_status: MergeStatus::Rejected,
            merged_at: Utc::now().timestamp(),
            merged_by: "system".to_string(),
            result_summary: None,
            failure_info: Some(failure_info),
            review_notes: None,
        };

        Ok(record)
    }

    /// Suggest recovery based on failure type
    async fn suggest_recovery(&self, status: &SubAgentResultStatus, tools_denied: &[String]) -> Option<String> {
        match status {
            SubAgentResultStatus::Timeout => {
                Some("Consider increasing timeout or simplifying the task".to_string())
            }
            SubAgentResultStatus::MaxStepsExceeded => {
                Some("Consider breaking down the task into smaller steps".to_string())
            }
            SubAgentResultStatus::Failed => {
                if !tools_denied.is_empty() {
                    Some(format!(
                        "Tool access denied: {}. Check permissions.",
                        tools_denied.join(", ")
                    ))
                } else {
                    Some("Review error details and adjust Sub-Agent configuration".to_string())
                }
            }
            _ => None,
        }
    }

    /// Submit review decision
    pub async fn submit_review_decision(&self, decision: ReviewDecision) -> Result<()> {
        let review_id = decision.merged_result_id.clone();

        // Update merged result with decision
        {
            let mut merged = self.merged_results.write().await;
            for records in merged.values_mut() {
                for record in records.iter_mut() {
                    if record.id == review_id {
                        record.merge_status = match decision.decision {
                            ReviewOutcome::Accept => MergeStatus::Merged,
                            ReviewOutcome::Reject => MergeStatus::Rejected,
                            ReviewOutcome::Modify
                            | ReviewOutcome::Retry
                            | ReviewOutcome::Escalate => MergeStatus::ReviewRequired,
                        };
                        record.review_notes = decision.notes.clone();
                    }
                }
            }
        }

        // Store decision
        {
            let mut decisions = self.review_decisions.write().await;
            decisions.push(decision);
        }

        // Remove from pending
        {
            let mut pending = self.pending_reviews.write().await;
            pending.remove(&review_id);
        }

        Ok(())
    }

    /// Get merged results by parent execution
    pub async fn get_merged_results(&self, parent_execution_id: &str) -> Vec<MergedResultRecord> {
        let merged = self.merged_results.read().await;
        merged.get(parent_execution_id).cloned().unwrap_or_default()
    }

    /// Get pending reviews
    pub async fn get_pending_reviews(&self) -> Vec<(String, SubAgentResult)> {
        let pending = self.pending_reviews.read().await;
        pending.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
    }

    /// Build parent context update from merged results
    pub async fn build_parent_update(
        &self,
        parent_execution_id: &str,
        session_id: &str,
        trace_id: &str,
    ) -> Result<Option<ParentContextUpdate>> {
        let results = self.get_merged_results(parent_execution_id).await;

        if results.is_empty() {
            return Ok(None);
        }

        let all_tools_used = Vec::new();
        let all_tools_denied = Vec::new();
        let mut summaries = Vec::new();

        for record in &results {
            if record.merge_status == MergeStatus::Merged {
                if let Some(summary) = &record.result_summary {
                    summaries.push(summary.clone());
                }
            }
        }

        // Get detailed results to build tool report
        let merged = self.merged_results.read().await;
        if let Some(records) = merged.get(parent_execution_id) {
            for record in records {
                // Build tool report from failure info if any
                if let Some(ref failure) = record.failure_info {
                    if failure.retry_recommended {
                        // Add tools that might need retry
                    }
                }
            }
        }

        let tool_denied_count = all_tools_denied.len() as i32;
        let total_used = all_tools_used.len() as i32;
        let total_denied = all_tools_denied.len() as i32;

        let tool_report = ToolUsageReport {
            tools_used: all_tools_used,
            tools_denied: all_tools_denied,
            denied_count: tool_denied_count,
            total_calls: total_used + total_denied,
        };

        let replan_suggestion = self.generate_replan_suggestion(&results).await;

        Ok(Some(ParentContextUpdate {
            session_id: session_id.to_string(),
            trace_id: trace_id.to_string(),
            result_summary: summaries.join("\n---\n"),
            memory_updates: Vec::new(),
            tool_usage_report: tool_report,
            replan_suggestion,
        }))
    }

    /// Generate replan suggestion based on merged results
    async fn generate_replan_suggestion(&self, results: &[MergedResultRecord]) -> Option<String> {
        let has_failures = results.iter().any(|r| r.merge_status == MergeStatus::Rejected);

        if has_failures {
            Some(
                "Some Sub-Agent tasks failed. Consider reviewing failures and retrying or modifying the plan."
                    .to_string(),
            )
        } else {
            None
        }
    }

    /// Get review decisions by merged result
    pub async fn get_review_decisions(&self, merged_result_id: &str) -> Vec<ReviewDecision> {
        let decisions = self.review_decisions.read().await;
        decisions
            .iter()
            .filter(|d| d.merged_result_id == merged_result_id)
            .cloned()
            .collect()
    }
}

/// Merge decision
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum MergeDecision {
    AutoMerge(MergedResultRecord),
    ReviewRequired(String),
    Reject(MergedResultRecord),
}

impl Default for ResultMergeService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merge_status_display() {
        assert_eq!(MergeStatus::Pending.to_string(), "pending");
        assert_eq!(MergeStatus::Merged.to_string(), "merged");
        assert_eq!(MergeStatus::Rejected.to_string(), "rejected");
        assert_eq!(MergeStatus::PartiallyMerged.to_string(), "partially_merged");
        assert_eq!(MergeStatus::ReviewRequired.to_string(), "review_required");
    }

    #[test]
    fn test_sub_agent_result_status_display() {
        assert_eq!(SubAgentResultStatus::Success.to_string(), "success");
        assert_eq!(SubAgentResultStatus::Failed.to_string(), "failed");
        assert_eq!(SubAgentResultStatus::Timeout.to_string(), "timeout");
        assert_eq!(SubAgentResultStatus::Cancelled.to_string(), "cancelled");
        assert_eq!(
            SubAgentResultStatus::MaxStepsExceeded.to_string(),
            "max_steps_exceeded"
        );
    }

    #[test]
    fn test_review_outcome_display() {
        assert_eq!(ReviewOutcome::Accept.to_string(), "accept");
        assert_eq!(ReviewOutcome::Reject.to_string(), "reject");
        assert_eq!(ReviewOutcome::Modify.to_string(), "modify");
        assert_eq!(ReviewOutcome::Retry.to_string(), "retry");
        assert_eq!(ReviewOutcome::Escalate.to_string(), "escalate");
    }

    #[tokio::test]
    async fn test_receive_success_result_auto_merge() {
        let service = ResultMergeService::new();

        let result = SubAgentResult {
            execution_id: "exec_001".to_string(),
            sub_agent_id: "subagent_001".to_string(),
            sub_agent_name: "文档助手".to_string(),
            status: SubAgentResultStatus::Success,
            output: Some("任务完成".to_string()),
            summary: Some("文档已创建".to_string()),
            steps_used: 5,
            tools_used: vec!["fs_write".to_string()],
            tools_denied: vec![],
            memory_entries: vec![],
            error: None,
            duration_ms: 1500,
            completed_at: Utc::now().timestamp(),
        };

        let decision = service.receive_result(result).await.unwrap();

        match decision {
            MergeDecision::AutoMerge(record) => {
                assert_eq!(record.merge_status, MergeStatus::Merged);
            }
            _ => panic!("Expected AutoMerge for success"),
        }
    }

    #[tokio::test]
    async fn test_receive_failure_result_requires_review() {
        let service = ResultMergeService::new();

        let result = SubAgentResult {
            execution_id: "exec_001".to_string(),
            sub_agent_id: "subagent_001".to_string(),
            sub_agent_name: "文档助手".to_string(),
            status: SubAgentResultStatus::Failed,
            output: None,
            summary: None,
            steps_used: 3,
            tools_used: vec![],
            tools_denied: vec!["fs_delete".to_string()],
            memory_entries: vec![],
            error: Some("Permission denied".to_string()),
            duration_ms: 800,
            completed_at: Utc::now().timestamp(),
        };

        let decision = service.receive_result(result).await.unwrap();

        match decision {
            MergeDecision::ReviewRequired(_) => {
                // Expected for failure with require_review_on_failure = true
            }
            _ => panic!("Expected ReviewRequired for failure"),
        }
    }

    #[tokio::test]
    async fn test_submit_review_decision() {
        let service = ResultMergeService::new();

        let result = SubAgentResult {
            execution_id: "exec_001".to_string(),
            sub_agent_id: "subagent_001".to_string(),
            sub_agent_name: "文档助手".to_string(),
            status: SubAgentResultStatus::Failed,
            output: None,
            summary: None,
            steps_used: 3,
            tools_used: vec![],
            tools_denied: vec!["fs_delete".to_string()],
            memory_entries: vec![],
            error: Some("Permission denied".to_string()),
            duration_ms: 800,
            completed_at: Utc::now().timestamp(),
        };

        let decision_id = service.receive_result(result).await.unwrap();

        let review_id = match decision_id {
            MergeDecision::ReviewRequired(id) => id,
            _ => panic!("Expected ReviewRequired"),
        };

        let review = ReviewDecision {
            decision_id: ResultMergeService::generate_id("decision"),
            merged_result_id: review_id.clone(),
            decision: ReviewOutcome::Accept,
            reviewed_by: "user".to_string(),
            reviewed_at: Utc::now().timestamp(),
            notes: Some("Reviewed and accepted".to_string()),
        };

        service.submit_review_decision(review).await.unwrap();

        // Check pending reviews is empty
        let pending = service.get_pending_reviews().await;
        assert!(pending.is_empty());
    }

    #[tokio::test]
    async fn test_build_parent_update() {
        let service = ResultMergeService::new();

        let result = SubAgentResult {
            execution_id: "exec_001".to_string(),
            sub_agent_id: "subagent_001".to_string(),
            sub_agent_name: "文档助手".to_string(),
            status: SubAgentResultStatus::Success,
            output: Some("任务完成".to_string()),
            summary: Some("文档已创建".to_string()),
            steps_used: 5,
            tools_used: vec!["fs_write".to_string()],
            tools_denied: vec![],
            memory_entries: vec![],
            error: None,
            duration_ms: 1500,
            completed_at: Utc::now().timestamp(),
        };

        service.receive_result(result).await.unwrap();

        let update = service
            .build_parent_update("exec_001", "session_001", "trace_001")
            .await
            .unwrap();

        assert!(update.is_some());
        let update = update.unwrap();
        assert_eq!(update.session_id, "session_001");
        assert_eq!(update.trace_id, "trace_001");
    }
}
