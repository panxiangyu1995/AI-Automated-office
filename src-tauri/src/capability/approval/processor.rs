//! Approval processor implementation.

use super::ApprovalStatus;

/// Approval decision
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum ApprovalDecision {
    /// Approve the request
    Approve {
        /// Approver user ID
        approver: String,
        /// Decision timestamp
        decided_at: i64,
        /// Optional notes
        notes: Option<String>,
    },
    /// Reject the request
    Reject {
        /// Rejector user ID
        rejector: String,
        /// Decision timestamp
        decided_at: i64,
        /// Rejection reason
        reason: String,
    },
    /// Request more information
    RequestMoreInfo {
        /// Approver user ID
        approver: String,
        /// Decision timestamp
        decided_at: i64,
        /// Questions to answer
        questions: Vec<String>,
    },
}

/// Approval processor
pub struct ApprovalProcessor;

impl ApprovalProcessor {
    /// Process an approval decision
    pub fn process(decision: ApprovalDecision) -> ApprovalStatus {
        match decision {
            ApprovalDecision::Approve { .. } => ApprovalStatus::Approved,
            ApprovalDecision::Reject { .. } => ApprovalStatus::Rejected,
            ApprovalDecision::RequestMoreInfo { .. } => ApprovalStatus::Pending,
        }
    }

    /// Check if a decision allows installation
    pub fn allows_installation(decision: &ApprovalDecision) -> bool {
        matches!(decision, ApprovalDecision::Approve { .. })
    }

    /// Get the approver/rejector from a decision
    pub fn get_decided_by(decision: &ApprovalDecision) -> String {
        match decision {
            ApprovalDecision::Approve { approver, .. } => approver.clone(),
            ApprovalDecision::Reject { rejector, .. } => rejector.clone(),
            ApprovalDecision::RequestMoreInfo { approver, .. } => approver.clone(),
        }
    }
}

impl Default for ApprovalProcessor {
    fn default() -> Self {
        Self
    }
}
