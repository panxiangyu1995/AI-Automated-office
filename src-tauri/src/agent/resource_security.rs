//! Resource Security Management Module
//!
//! This module implements:
//! - Resource validation (signature verification)
//! - Security scanning
//! - Approval workflow for risky resources
//! - Audit logging for security events
//! - Security policy management
//!
//! Story 10.6 / Task 190 - Resource Security Management (FR746-FR755)

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Validation status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ValidationStatus {
    Pending,
    Valid,
    Invalid,
    Warning,
}

/// Scan level
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ScanLevel {
    Basic,
    Standard,
    Deep,
}

/// Security risk level
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SecurityRiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Approval status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

/// Signature type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SignatureType {
    None,
    Sha256,
    Pgp,
    X509,
}

/// Audit action
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AuditAction {
    Validate,
    Scan,
    Approve,
    Reject,
    Bypass,
}

/// Resource type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ResourceType {
    Plugin,
    Skill,
    Template,
    Knowledge,
}

/// Security validation record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityValidation {
    pub id: String,
    pub resource_id: String,
    pub resource_name: String,
    pub resource_type: ResourceType,
    pub source: String,
    pub signature_type: SignatureType,
    pub signature_valid: bool,
    pub signature_verified_at: Option<i64>,
    pub signer: Option<String>,
    pub validation_status: ValidationStatus,
    pub validation_message: Option<String>,
}

impl SecurityValidation {
    pub fn new(
        resource_id: String,
        resource_name: String,
        resource_type: ResourceType,
        source: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            resource_id,
            resource_name,
            resource_type,
            source,
            signature_type: SignatureType::None,
            signature_valid: false,
            signature_verified_at: None,
            signer: None,
            validation_status: ValidationStatus::Pending,
            validation_message: None,
        }
    }
}

/// Security issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityIssue {
    pub id: String,
    pub severity: SecurityRiskLevel,
    pub category: String,
    pub title: String,
    pub description: String,
    pub location: Option<String>,
    pub fix_available: bool,
    pub fix_suggestion: Option<String>,
}

/// Security scan record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityScan {
    pub id: String,
    pub resource_id: String,
    pub resource_name: String,
    pub scan_level: ScanLevel,
    pub risk_level: SecurityRiskLevel,
    pub issues: Vec<SecurityIssue>,
    pub scanned_at: i64,
    pub duration_ms: u64,
    pub scanner: String,
}

impl SecurityScan {
    pub fn new(
        resource_id: String,
        resource_name: String,
        scan_level: ScanLevel,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            resource_id,
            resource_name,
            scan_level,
            risk_level: SecurityRiskLevel::Low,
            issues: Vec::new(),
            scanned_at: Utc::now().timestamp(),
            duration_ms: 0,
            scanner: "ClawHub Security Scanner v2.1".to_string(),
        }
    }
}

/// Approval request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRequest {
    pub id: String,
    pub resource_id: String,
    pub resource_name: String,
    pub resource_type: ResourceType,
    pub requester: String,
    pub requested_at: i64,
    pub risk_level: SecurityRiskLevel,
    pub reason: String,
    pub status: ApprovalStatus,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<i64>,
    pub review_comment: Option<String>,
    pub security_scan_id: Option<String>,
}

impl ApprovalRequest {
    pub fn new(
        resource_id: String,
        resource_name: String,
        resource_type: ResourceType,
        requester: String,
        risk_level: SecurityRiskLevel,
        reason: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            resource_id,
            resource_name,
            resource_type,
            requester,
            requested_at: Utc::now().timestamp(),
            risk_level,
            reason,
            status: ApprovalStatus::Pending,
            reviewed_by: None,
            reviewed_at: None,
            review_comment: None,
            security_scan_id: None,
        }
    }
}

/// Audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityAuditEntry {
    pub id: String,
    pub timestamp: i64,
    pub actor: String,
    pub action: AuditAction,
    pub resource_id: String,
    pub resource_name: String,
    pub result: String,
    pub details: Option<String>,
}

impl SecurityAuditEntry {
    pub fn new(
        actor: String,
        action: AuditAction,
        resource_id: String,
        resource_name: String,
        result: String,
        details: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now().timestamp(),
            actor,
            action,
            resource_id,
            resource_name,
            result,
            details,
        }
    }
}

/// Security policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityPolicy {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub require_signature: bool,
    pub min_scan_level: ScanLevel,
    pub auto_approve_low_risk: bool,
    pub require_admin_approval_high_risk: bool,
    pub max_risk_level: SecurityRiskLevel,
}

impl Default for SecurityPolicy {
    fn default() -> Self {
        Self {
            id: "default".to_string(),
            name: "Default Security Policy".to_string(),
            enabled: true,
            require_signature: true,
            min_scan_level: ScanLevel::Standard,
            auto_approve_low_risk: true,
            require_admin_approval_high_risk: true,
            max_risk_level: SecurityRiskLevel::Medium,
        }
    }
}

/// Resource security statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceSecurityStats {
    pub total_resources: u32,
    pub validated_resources: u32,
    pub pending_validation: u32,
    pub failed_validation: u32,
    pub risky_resources: u32,
    pub pending_approvals: u32,
    pub approved_today: u32,
    pub rejected_today: u32,
}

impl Default for ResourceSecurityStats {
    fn default() -> Self {
        Self {
            total_resources: 0,
            validated_resources: 0,
            pending_validation: 0,
            failed_validation: 0,
            risky_resources: 0,
            pending_approvals: 0,
            approved_today: 0,
            rejected_today: 0,
        }
    }
}

/// Resource security service
pub struct ResourceSecurityService {
    validations: Arc<RwLock<HashMap<String, SecurityValidation>>>,
    scans: Arc<RwLock<HashMap<String, SecurityScan>>>,
    approvals: Arc<RwLock<HashMap<String, ApprovalRequest>>>,
    audit_log: Arc<RwLock<Vec<SecurityAuditEntry>>>,
    policy: Arc<RwLock<SecurityPolicy>>,
}

impl ResourceSecurityService {
    pub fn new() -> Self {
        Self {
            validations: Arc::new(RwLock::new(HashMap::new())),
            scans: Arc::new(RwLock::new(HashMap::new())),
            approvals: Arc::new(RwLock::new(HashMap::new())),
            audit_log: Arc::new(RwLock::new(Vec::new())),
            policy: Arc::new(RwLock::new(SecurityPolicy::default())),
        }
    }

    /// Initialize with mock data for testing
    pub async fn initialize_mock_data(&self) {
        // Add mock validations
        let val1 = SecurityValidation {
            id: "val-1".to_string(),
            resource_id: "plugin-1".to_string(),
            resource_name: "HR Employee Manager".to_string(),
            resource_type: ResourceType::Plugin,
            source: "official-market".to_string(),
            signature_type: SignatureType::Sha256,
            signature_valid: true,
            signature_verified_at: Some(Utc::now().timestamp()),
            signer: Some("ClawHub Official".to_string()),
            validation_status: ValidationStatus::Valid,
            validation_message: None,
        };

        let val2 = SecurityValidation {
            id: "val-2".to_string(),
            resource_id: "plugin-2".to_string(),
            resource_name: "Finance OCR Scanner".to_string(),
            resource_type: ResourceType::Plugin,
            source: "private-market".to_string(),
            signature_type: SignatureType::None,
            signature_valid: false,
            signature_verified_at: None,
            signer: None,
            validation_status: ValidationStatus::Warning,
            validation_message: Some("No signature provided - source not verified".to_string()),
        };

        let mut validations = self.validations.write().await;
        validations.insert(val1.id.clone(), val1);
        validations.insert(val2.id.clone(), val2);

        // Add mock scans
        let scan1 = SecurityScan {
            id: "scan-1".to_string(),
            resource_id: "plugin-1".to_string(),
            resource_name: "HR Employee Manager".to_string(),
            scan_level: ScanLevel::Deep,
            risk_level: SecurityRiskLevel::Low,
            issues: vec![],
            scanned_at: Utc::now().timestamp(),
            duration_ms: 12500,
            scanner: "ClawHub Security Scanner v2.1".to_string(),
        };

        let scan2 = SecurityScan {
            id: "scan-2".to_string(),
            resource_id: "plugin-2".to_string(),
            resource_name: "Finance OCR Scanner".to_string(),
            scan_level: ScanLevel::Standard,
            risk_level: SecurityRiskLevel::High,
            issues: vec![
                SecurityIssue {
                    id: "issue-1".to_string(),
                    severity: SecurityRiskLevel::High,
                    category: "permissions".to_string(),
                    title: "Excessive file system access".to_string(),
                    description: "Plugin requests access to read/write user home directory".to_string(),
                    location: Some("manifest.json::permissions[3]".to_string()),
                    fix_available: true,
                    fix_suggestion: Some("Limit to specific directories required for functionality".to_string()),
                },
                SecurityIssue {
                    id: "issue-2".to_string(),
                    severity: SecurityRiskLevel::Medium,
                    category: "vulnerability".to_string(),
                    title: "Outdated dependency".to_string(),
                    description: "Uses axios version with known CVE-2024-1234".to_string(),
                    location: Some("node_modules/axios/package.json".to_string()),
                    fix_available: true,
                    fix_suggestion: Some("Update to axios >= 1.6.0".to_string()),
                },
            ],
            scanned_at: Utc::now().timestamp(),
            duration_ms: 8200,
            scanner: "ClawHub Security Scanner v2.1".to_string(),
        };

        let mut scans = self.scans.write().await;
        scans.insert(scan1.id.clone(), scan1);
        scans.insert(scan2.id.clone(), scan2);

        // Add mock approvals
        let approval1 = ApprovalRequest {
            id: "apr-1".to_string(),
            resource_id: "plugin-2".to_string(),
            resource_name: "Finance OCR Scanner".to_string(),
            resource_type: ResourceType::Plugin,
            requester: "admin@company.com".to_string(),
            requested_at: Utc::now().timestamp(),
            risk_level: SecurityRiskLevel::High,
            reason: "Finance team needs OCR functionality for invoice processing".to_string(),
            status: ApprovalStatus::Pending,
            reviewed_by: None,
            reviewed_at: None,
            review_comment: None,
            security_scan_id: Some("scan-2".to_string()),
        };

        let mut approvals = self.approvals.write().await;
        approvals.insert(approval1.id.clone(), approval1);
    }

    /// Get all validations
    pub async fn get_validations(&self) -> Vec<SecurityValidation> {
        let validations = self.validations.read().await;
        validations.values().cloned().collect()
    }

    /// Get validation by ID
    pub async fn get_validation(&self, id: &str) -> Option<SecurityValidation> {
        let validations = self.validations.read().await;
        validations.get(id).cloned()
    }

    /// Add validation record
    pub async fn add_validation(&self, validation: SecurityValidation) {
        let mut validations = self.validations.write().await;
        validations.insert(validation.id.clone(), validation);
    }

    /// Get all scans
    pub async fn get_scans(&self) -> Vec<SecurityScan> {
        let scans = self.scans.read().await;
        scans.values().cloned().collect()
    }

    /// Get scan by ID
    pub async fn get_scan(&self, id: &str) -> Option<SecurityScan> {
        let scans = self.scans.read().await;
        scans.get(id).cloned()
    }

    /// Add scan record
    pub async fn add_scan(&self, scan: SecurityScan) {
        let mut scans = self.scans.write().await;
        scans.insert(scan.id.clone(), scan);
    }

    /// Get pending approvals
    pub async fn get_pending_approvals(&self) -> Vec<ApprovalRequest> {
        let approvals = self.approvals.read().await;
        approvals.values()
            .filter(|a| a.status == ApprovalStatus::Pending)
            .cloned()
            .collect()
    }

    /// Get approval by ID
    pub async fn get_approval(&self, id: &str) -> Option<ApprovalRequest> {
        let approvals = self.approvals.read().await;
        approvals.get(id).cloned()
    }

    /// Add approval request
    pub async fn add_approval(&self, approval: ApprovalRequest) {
        let mut approvals = self.approvals.write().await;
        approvals.insert(approval.id.clone(), approval);
    }

    /// Update approval status
    pub async fn update_approval_status(
        &self,
        id: &str,
        status: ApprovalStatus,
        reviewed_by: String,
        comment: Option<String>,
    ) -> Option<ApprovalRequest> {
        let mut approvals = self.approvals.write().await;
        if let Some(approval) = approvals.get_mut(id) {
            approval.status = status.clone();
            approval.reviewed_by = Some(reviewed_by);
            approval.reviewed_at = Some(Utc::now().timestamp());
            approval.review_comment = comment;
            return Some(approval.clone());
        }
        None
    }

    /// Get audit log entries
    pub async fn get_audit_log(&self, limit: Option<u32>) -> Vec<SecurityAuditEntry> {
        let audit_log = self.audit_log.read().await;
        let mut entries = audit_log.clone();
        entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        if let Some(l) = limit {
            entries.truncate(l as usize);
        }
        entries
    }

    /// Add audit entry
    pub async fn add_audit_entry(&self, entry: SecurityAuditEntry) {
        let mut audit_log = self.audit_log.write().await;
        audit_log.push(entry);
    }

    /// Get security policy
    pub async fn get_policy(&self) -> SecurityPolicy {
        let policy = self.policy.read().await;
        policy.clone()
    }

    /// Update security policy
    pub async fn update_policy(&self, policy: SecurityPolicy) -> SecurityPolicy {
        let mut current_policy = self.policy.write().await;
        *current_policy = policy.clone();
        policy
    }

    /// Get statistics
    pub async fn get_stats(&self) -> ResourceSecurityStats {
        let validations = self.validations.read().await;
        let scans = self.scans.read().await;
        let approvals = self.approvals.read().await;

        let today_start = Utc::now().timestamp() - (Utc::now().timestamp() % 86400);

        ResourceSecurityStats {
            total_resources: validations.len() as u32,
            validated_resources: validations.values()
                .filter(|v| v.validation_status == ValidationStatus::Valid)
                .count() as u32,
            pending_validation: validations.values()
                .filter(|v| v.validation_status == ValidationStatus::Pending)
                .count() as u32,
            failed_validation: validations.values()
                .filter(|v| v.validation_status == ValidationStatus::Invalid)
                .count() as u32,
            risky_resources: scans.values()
                .filter(|s| s.risk_level == SecurityRiskLevel::High || s.risk_level == SecurityRiskLevel::Critical)
                .count() as u32,
            pending_approvals: approvals.values()
                .filter(|a| a.status == ApprovalStatus::Pending)
                .count() as u32,
            approved_today: approvals.values()
                .filter(|a| a.status == ApprovalStatus::Approved && a.reviewed_at.unwrap_or(0) >= today_start)
                .count() as u32,
            rejected_today: approvals.values()
                .filter(|a| a.status == ApprovalStatus::Rejected && a.reviewed_at.unwrap_or(0) >= today_start)
                .count() as u32,
        }
    }
}

impl Default for ResourceSecurityService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_resource_security_service() {
        let service = ResourceSecurityService::new();
        service.initialize_mock_data().await;

        let validations = service.get_validations().await;
        assert_eq!(validations.len(), 2);

        let stats = service.get_stats().await;
        assert_eq!(stats.total_resources, 2);
        assert_eq!(stats.pending_approvals, 1);
    }

    #[tokio::test]
    async fn test_approval_workflow() {
        let service = ResourceSecurityService::new();

        let approval = ApprovalRequest::new(
            "plugin-1".to_string(),
            "Test Plugin".to_string(),
            ResourceType::Plugin,
            "admin@test.com".to_string(),
            SecurityRiskLevel::High,
            "Test approval".to_string(),
        );

        service.add_approval(approval.clone()).await;
        let pending = service.get_pending_approvals().await;
        assert_eq!(pending.len(), 1);

        service.update_approval_status(
            &approval.id,
            ApprovalStatus::Approved,
            "admin@test.com".to_string(),
            Some("Approved".to_string()),
        ).await;

        let pending_after = service.get_pending_approvals().await;
        assert_eq!(pending_after.len(), 0);
    }
}
