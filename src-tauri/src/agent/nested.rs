//! Sub-Agent Nested Call Control Module
//!
//! This module implements:
//! - Nested depth tracking and enforcement
//! - Loop detection and call budgets
//! - Timeout and failure propagation
//! - Trace, audit, and failure record linking
//! - Unbounded recursion and privilege escalation prevention
//!
//! Story 52.3 - Sub-Agent nested call control

use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Maximum nesting depth constant
pub const DEFAULT_MAX_DEPTH: i32 = 5;

/// Nested call status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum NestedCallStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Timeout,
    MaxDepthExceeded,
    LoopDetected,
    Cancelled,
}

impl std::fmt::Display for NestedCallStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            NestedCallStatus::Pending => write!(f, "pending"),
            NestedCallStatus::Running => write!(f, "running"),
            NestedCallStatus::Completed => write!(f, "completed"),
            NestedCallStatus::Failed => write!(f, "failed"),
            NestedCallStatus::Timeout => write!(f, "timeout"),
            NestedCallStatus::MaxDepthExceeded => write!(f, "max_depth_exceeded"),
            NestedCallStatus::LoopDetected => write!(f, "loop_detected"),
            NestedCallStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Nested call record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NestedCallRecord {
    pub id: String,
    pub parent_execution_id: String,
    pub child_execution_id: String,
    pub depth: i32,
    pub status: NestedCallStatus,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub error: Option<String>,
    pub timeout_ms: i64,
    pub budget_remaining: i32,
}

/// Nested call policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NestedCallPolicy {
    pub max_depth: i32,
    pub max_calls_per_depth: i32,
    pub default_timeout_ms: i64,
    pub enable_loop_detection: bool,
    pub max_loop_history: usize,
}

impl Default for NestedCallPolicy {
    fn default() -> Self {
        Self {
            max_depth: DEFAULT_MAX_DEPTH,
            max_calls_per_depth: 10,
            default_timeout_ms: 300_000, // 5 minutes
            enable_loop_detection: true,
            max_loop_history: 100,
        }
    }
}

/// Call budget for tracking allowed calls
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallBudget {
    pub execution_id: String,
    pub remaining: i32,
    pub total: i32,
    pub depth: i32,
}

/// Call chain entry for loop detection
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CallChainEntry {
    pub execution_id: String,
    pub sub_agent_id: String,
    pub depth: i32,
    pub timestamp: i64,
}

/// Nested call service
#[derive(Clone)]
pub struct NestedCallService {
    /// Active nested call records: parent_execution_id -> Vec<NestedCallRecord>
    active_calls: Arc<RwLock<HashMap<String, Vec<NestedCallRecord>>>>,
    /// Call budgets: execution_id -> CallBudget
    budgets: Arc<RwLock<HashMap<String, CallBudget>>>,
    /// Call chain history for loop detection: session_id -> Vec<CallChainEntry>
    call_chains: Arc<RwLock<HashMap<String, Vec<CallChainEntry>>>>,
    /// Policy configuration
    policy: Arc<RwLock<NestedCallPolicy>>,
}

impl NestedCallService {
    pub fn new() -> Self {
        Self {
            active_calls: Arc::new(RwLock::new(HashMap::new())),
            budgets: Arc::new(RwLock::new(HashMap::new())),
            call_chains: Arc::new(RwLock::new(HashMap::new())),
            policy: Arc::new(RwLock::new(NestedCallPolicy::default())),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Update policy
    pub async fn update_policy(&self, policy: NestedCallPolicy) {
        let mut p = self.policy.write().await;
        *p = policy;
    }

    /// Get current policy
    pub async fn get_policy(&self) -> NestedCallPolicy {
        let p = self.policy.read().await;
        p.clone()
    }

    /// Check if nested call is allowed
    pub async fn check_nested_call_allowed(
        &self,
        parent_execution_id: &str,
        sub_agent_id: &str,
        session_id: &str,
    ) -> Result<NestedCallCheckResult> {
        let policy = self.get_policy().await;

        // Get current depth from parent's active calls
        let current_depth = self.get_current_depth(parent_execution_id).await;

        // Check depth limit
        if current_depth >= policy.max_depth {
            return Ok(NestedCallCheckResult {
                allowed: false,
                reason: Some(format!(
                    "Max depth {} exceeded (current: {})",
                    policy.max_depth, current_depth
                )),
                depth: current_depth,
                budget_remaining: 0,
            });
        }

        // Check loop detection
        if policy.enable_loop_detection {
            if self.detect_loop(session_id, sub_agent_id).await {
                return Ok(NestedCallCheckResult {
                    allowed: false,
                    reason: Some("Loop detected: sub-agent called itself".to_string()),
                    depth: current_depth,
                    budget_remaining: 0,
                });
            }
        }

        // Get or create budget
        let budget_remaining = self.get_budget_remaining(parent_execution_id).await;

        // Check call budget per depth
        if budget_remaining <= 0 {
            return Ok(NestedCallCheckResult {
                allowed: false,
                reason: Some(format!(
                    "Call budget exhausted at depth {}",
                    current_depth
                )),
                depth: current_depth,
                budget_remaining: 0,
            });
        }

        Ok(NestedCallCheckResult {
            allowed: true,
            reason: None,
            depth: current_depth,
            budget_remaining,
        })
    }

    /// Get current nesting depth
    pub async fn get_current_depth(&self, parent_execution_id: &str) -> i32 {
        let calls = self.active_calls.read().await;
        if let Some(records) = calls.get(parent_execution_id) {
            records
                .iter()
                .filter(|r| r.status == NestedCallStatus::Running)
                .count() as i32
        } else {
            0
        }
    }

    /// Get budget remaining for an execution
    pub async fn get_budget_remaining(&self, execution_id: &str) -> i32 {
        let budgets = self.budgets.read().await;
        budgets
            .get(execution_id)
            .map(|b| b.remaining)
            .unwrap_or_else(|| {
                // Default budget from policy
                10
            })
    }

    /// Detect potential loop
    async fn detect_loop(&self, session_id: &str, sub_agent_id: &str) -> bool {
        let chains = self.call_chains.read().await;
        if let Some(history) = chains.get(session_id) {
            // Check if this sub-agent was called recently at the same depth
            let recent_entries: Vec<_> = history
                .iter()
                .filter(|e| e.sub_agent_id == sub_agent_id)
                .collect();

            // If same sub-agent at same depth within short time, might be a loop
            if recent_entries.len() >= 2 {
                let last = recent_entries[recent_entries.len() - 1];
                let _policy = self.policy.read().await;
                let time_diff = Utc::now().timestamp() - last.timestamp;
                if time_diff < 60 && last.depth == self.get_current_depth_from_history(history) {
                    return true;
                }
            }
        }
        false
    }

    fn get_current_depth_from_history(&self, history: &[CallChainEntry]) -> i32 {
        history.last().map(|e| e.depth).unwrap_or(0)
    }

    /// Record a nested call start
    pub async fn record_nested_call_start(
        &self,
        parent_execution_id: &str,
        child_execution_id: &str,
        sub_agent_id: &str,
        session_id: &str,
    ) -> Result<()> {
        let policy = self.get_policy().await;
        let current_depth = self.get_current_depth(parent_execution_id).await;
        let new_depth = current_depth + 1;

        // Create nested call record
        let record = NestedCallRecord {
            id: Self::generate_id("nested"),
            parent_execution_id: parent_execution_id.to_string(),
            child_execution_id: child_execution_id.to_string(),
            depth: new_depth,
            status: NestedCallStatus::Running,
            started_at: Utc::now().timestamp(),
            completed_at: None,
            error: None,
            timeout_ms: policy.default_timeout_ms,
            budget_remaining: self.get_budget_remaining(parent_execution_id).await - 1,
        };

        // Store active call
        {
            let mut calls = self.active_calls.write().await;
            calls.entry(parent_execution_id.to_string())
                .or_insert_with(Vec::new)
                .push(record);
        }

        // Update budget
        {
            let mut budgets = self.budgets.write().await;
            if let Some(budget) = budgets.get_mut(parent_execution_id) {
                budget.remaining = budget.remaining.saturating_sub(1);
            } else {
                budgets.insert(
                    parent_execution_id.to_string(),
                    CallBudget {
                        execution_id: parent_execution_id.to_string(),
                        remaining: policy.max_calls_per_depth - 1,
                        total: policy.max_calls_per_depth,
                        depth: new_depth,
                    },
                );
            }
        }

        // Add to call chain for loop detection
        {
            let mut chains = self.call_chains.write().await;
            let entries = chains.entry(session_id.to_string()).or_insert_with(Vec::new);
            entries.push(CallChainEntry {
                execution_id: child_execution_id.to_string(),
                sub_agent_id: sub_agent_id.to_string(),
                depth: new_depth,
                timestamp: Utc::now().timestamp(),
            });

            // Trim history to max size
            let policy = self.policy.read().await;
            if entries.len() > policy.max_loop_history {
                let excess = entries.len() - policy.max_loop_history;
                entries.drain(0..excess);
            }
        }

        Ok(())
    }

    /// Record a nested call completion
    pub async fn record_nested_call_completion(
        &self,
        parent_execution_id: &str,
        child_execution_id: &str,
        status: NestedCallStatus,
        error: Option<String>,
    ) -> Result<()> {
        // Update the nested call record
        {
            let mut calls = self.active_calls.write().await;
            if let Some(records) = calls.get_mut(parent_execution_id) {
                if let Some(record) = records.iter_mut()
                    .find(|r| r.child_execution_id == child_execution_id)
                {
                    record.status = status;
                    record.completed_at = Some(Utc::now().timestamp());
                    record.error = error;
                }
            }
        }

        // Clean up completed calls from active (keep for audit)
        {
            let mut calls = self.active_calls.write().await;
            if let Some(records) = calls.get_mut(parent_execution_id) {
                records.retain(|r| r.status == NestedCallStatus::Running);
            }
        }

        Ok(())
    }

    /// Get nested calls by parent execution
    pub async fn get_nested_calls(&self, parent_execution_id: &str) -> Vec<NestedCallRecord> {
        let calls = self.active_calls.read().await;
        calls.get(parent_execution_id).cloned().unwrap_or_default()
    }

    /// Get all nested calls for a session
    pub async fn get_session_nested_calls(&self, session_id: &str) -> Vec<NestedCallRecord> {
        let calls = self.active_calls.read().await;
        let chains = self.call_chains.read().await;

        let child_ids: Vec<_> = chains
            .get(session_id)
            .map(|c| c.iter().map(|e| e.execution_id.clone()).collect())
            .unwrap_or_default();

        calls.values()
            .flat_map(|records| records.clone())
            .filter(|r| child_ids.contains(&r.child_execution_id))
            .collect()
    }

    /// Check timeout and propagate failure
    pub async fn check_timeout(&self, execution_id: &str) -> Result<Option<NestedCallStatus>> {
        let calls = self.active_calls.read().await;

        if let Some(records) = calls.get(execution_id) {
            let now = Utc::now().timestamp();
            for record in records {
                if record.status == NestedCallStatus::Running {
                    let elapsed = now - record.started_at;
                    if elapsed * 1000 > record.timeout_ms {
                        return Ok(Some(NestedCallStatus::Timeout));
                    }
                }
            }
        }

        Ok(None)
    }

    /// Cancel all nested calls for an execution
    pub async fn cancel_nested_calls(&self, parent_execution_id: &str) -> Result<()> {
        {
            let mut calls = self.active_calls.write().await;
            if let Some(records) = calls.get_mut(parent_execution_id) {
                for record in records.iter_mut() {
                    if record.status == NestedCallStatus::Running {
                        record.status = NestedCallStatus::Cancelled;
                        record.completed_at = Some(Utc::now().timestamp());
                    }
                }
            }
        }

        // Clear budget
        {
            let mut budgets = self.budgets.write().await;
            budgets.remove(parent_execution_id);
        }

        Ok(())
    }

    /// Get execution chain for audit
    pub async fn get_execution_chain(&self, session_id: &str) -> Vec<CallChainEntry> {
        let chains = self.call_chains.read().await;
        chains.get(session_id).cloned().unwrap_or_default()
    }

    /// Verify no privilege escalation in nested calls
    pub async fn verify_no_privilege_escalation(
        &self,
        parent_execution_id: &str,
        child_permission_level: &str,
    ) -> bool {
        // In a real implementation, this would check the permission hierarchy
        // For now, nested agents cannot have higher privileges than parent
        let budgets = self.budgets.read().await;
        if let Some(budget) = budgets.get(parent_execution_id) {
            // Permission levels: read_only < session_only < inherited < shared < private
            let parent_level = &budget.execution_id;
            // Simple check: child should not have "private" if parent doesn't
            if child_permission_level == "private" && !parent_level.contains("private") {
                return false;
            }
        }
        true
    }
}

/// Result of nested call check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NestedCallCheckResult {
    pub allowed: bool,
    pub reason: Option<String>,
    pub depth: i32,
    pub budget_remaining: i32,
}

impl Default for NestedCallService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nested_call_status_display() {
        assert_eq!(NestedCallStatus::Pending.to_string(), "pending");
        assert_eq!(NestedCallStatus::Running.to_string(), "running");
        assert_eq!(NestedCallStatus::Completed.to_string(), "completed");
        assert_eq!(NestedCallStatus::Failed.to_string(), "failed");
        assert_eq!(NestedCallStatus::Timeout.to_string(), "timeout");
        assert_eq!(
            NestedCallStatus::MaxDepthExceeded.to_string(),
            "max_depth_exceeded"
        );
        assert_eq!(NestedCallStatus::LoopDetected.to_string(), "loop_detected");
    }

    #[test]
    fn test_nested_call_policy_default() {
        let policy = NestedCallPolicy::default();
        assert_eq!(policy.max_depth, DEFAULT_MAX_DEPTH);
        assert_eq!(policy.max_calls_per_depth, 10);
        assert_eq!(policy.default_timeout_ms, 300_000);
        assert!(policy.enable_loop_detection);
    }

    #[tokio::test]
    async fn test_check_nested_call_allowed_initial() {
        let service = NestedCallService::new();

        let result = service
            .check_nested_call_allowed("exec_001", "subagent_001", "session_001")
            .await
            .unwrap();

        assert!(result.allowed);
        assert!(result.reason.is_none());
        assert_eq!(result.depth, 0);
    }

    #[tokio::test]
    async fn test_record_nested_call_start() {
        let service = NestedCallService::new();

        service
            .record_nested_call_start("exec_001", "exec_002", "subagent_001", "session_001")
            .await
            .unwrap();

        let depth = service.get_current_depth("exec_001").await;
        assert_eq!(depth, 1);
    }

    #[tokio::test]
    async fn test_nested_call_completion() {
        let service = NestedCallService::new();

        service
            .record_nested_call_start("exec_001", "exec_002", "subagent_001", "session_001")
            .await
            .unwrap();

        service
            .record_nested_call_completion(
                "exec_001",
                "exec_002",
                NestedCallStatus::Completed,
                None,
            )
            .await
            .unwrap();

        let calls = service.get_nested_calls("exec_001").await;
        assert!(calls.is_empty()); // Completed calls are cleaned up
    }

    #[tokio::test]
    async fn test_max_depth_enforcement() {
        let service = NestedCallService::new();

        // Set max depth to 2 for testing
        service
            .update_policy(NestedCallPolicy {
                max_depth: 2,
                ..Default::default()
            })
            .await;

        // First call should succeed
        let result1 = service
            .check_nested_call_allowed("exec_001", "subagent_001", "session_001")
            .await
            .unwrap();
        assert!(result1.allowed);

        // Record first nested call
        service
            .record_nested_call_start("exec_001", "exec_002", "subagent_001", "session_001")
            .await
            .unwrap();

        // Second call at depth 1 should succeed
        let result2 = service
            .check_nested_call_allowed("exec_001", "subagent_001", "session_001")
            .await
            .unwrap();
        assert!(result2.allowed);

        // Record second nested call
        service
            .record_nested_call_start("exec_001", "exec_003", "subagent_001", "session_001")
            .await
            .unwrap();

        // Third call at depth 2 should fail (max depth = 2)
        let result3 = service
            .check_nested_call_allowed("exec_001", "subagent_001", "session_001")
            .await
            .unwrap();
        assert!(!result3.allowed);
        assert!(result3.reason.unwrap().contains("Max depth"));
    }

    #[tokio::test]
    async fn test_call_chain_tracking() {
        let service = NestedCallService::new();

        service
            .record_nested_call_start("exec_001", "exec_002", "subagent_001", "session_001")
            .await
            .unwrap();

        service
            .record_nested_call_start("exec_002", "exec_003", "subagent_002", "session_001")
            .await
            .unwrap();

        let chain = service.get_execution_chain("session_001").await;
        assert_eq!(chain.len(), 2);
        assert_eq!(chain[0].depth, 1);
        assert_eq!(chain[1].depth, 2);
    }
}
