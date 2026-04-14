//! Approval module for capability installation.
//!
//! This module implements:
//! - Approval request creation and management
//! - Approval workflow processing
//! - Human review boundary

mod requester;
mod processor;

pub use requester::{ApprovalRequester, ApprovalRequest, ApprovalUrgency};
pub use processor::{ApprovalProcessor, ApprovalDecision};

/// Approval status
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
    Cancelled,
}

/// Approval decision types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalDecisionType {
    Approve,
    Reject,
    RequestMoreInfo,
}
