//! Approval requester implementation.

use crate::capability::{CapabilityPackageManifest, SecurityScanResult};
use anyhow::Result;

/// Approval request
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ApprovalRequest {
    /// Request ID
    pub request_id: String,
    /// Package manifest
    pub manifest: CapabilityPackageManifest,
    /// Requester user ID
    pub requested_by: String,
    /// Request timestamp
    pub requested_at: i64,
    /// Reason for request
    pub reason: String,
    /// Security scan result
    pub security_scan: Option<SecurityScanResult>,
    /// Required permissions
    pub permissions_required: Vec<String>,
    /// Urgency level
    pub urgency: ApprovalUrgency,
}

/// Approval urgency
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalUrgency {
    Normal,
    Urgent,
    Critical,
}

impl Default for ApprovalUrgency {
    fn default() -> Self {
        Self::Normal
    }
}

/// Approval requester
pub struct ApprovalRequester;

impl ApprovalRequester {
    /// Create a new approval request
    pub fn create_request(
        manifest: CapabilityPackageManifest,
        requested_by: &str,
        reason: &str,
        security_scan: Option<SecurityScanResult>,
    ) -> Result<ApprovalRequest> {
        let urgency = Self::calculate_urgency(&manifest, security_scan.as_ref());

        Ok(ApprovalRequest {
            request_id: uuid::Uuid::new_v4().to_string(),
            manifest,
            requested_by: requested_by.to_string(),
            requested_at: chrono::Utc::now().timestamp(),
            reason: reason.to_string(),
            security_scan,
            permissions_required: vec![],
            urgency,
        })
    }

    /// Calculate urgency based on manifest and security scan
    fn calculate_urgency(
        manifest: &CapabilityPackageManifest,
        security_scan: Option<&SecurityScanResult>,
    ) -> ApprovalUrgency {
        // Check security scan score
        if let Some(scan) = security_scan {
            if !scan.passed {
                return ApprovalUrgency::Critical;
            }
            if scan.score < 80 {
                return ApprovalUrgency::Urgent;
            }
        }

        // Check for sensitive permissions
        for perm in &manifest.permissions {
            if perm.required {
                return ApprovalUrgency::Urgent;
            }
        }

        ApprovalUrgency::Normal
    }
}

impl Default for ApprovalRequester {
    fn default() -> Self {
        Self
    }
}
