//! Security module type definitions
//!
//! Contains all types, enums, and structs for the security enforcement system.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Risk level for actions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl std::fmt::Display for RiskLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RiskLevel::Low => write!(f, "low"),
            RiskLevel::Medium => write!(f, "medium"),
            RiskLevel::High => write!(f, "high"),
            RiskLevel::Critical => write!(f, "critical"),
        }
    }
}

/// Sensitivity category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SensitivityCategory {
    DataDeletion,
    DataModification,
    DataExport,
    PermissionChange,
    SystemConfig,
    Financial,
    Authentication,
    Integration,
    BulkOperation,
    PiiAccess,
}

impl std::fmt::Display for SensitivityCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SensitivityCategory::DataDeletion => write!(f, "data_deletion"),
            SensitivityCategory::DataModification => write!(f, "data_modification"),
            SensitivityCategory::DataExport => write!(f, "data_export"),
            SensitivityCategory::PermissionChange => write!(f, "permission_change"),
            SensitivityCategory::SystemConfig => write!(f, "system_config"),
            SensitivityCategory::Financial => write!(f, "financial"),
            SensitivityCategory::Authentication => write!(f, "authentication"),
            SensitivityCategory::Integration => write!(f, "integration"),
            SensitivityCategory::BulkOperation => write!(f, "bulk_operation"),
            SensitivityCategory::PiiAccess => write!(f, "pii_access"),
        }
    }
}

/// Rule condition type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleCondition {
    pub condition_type: String,
    pub operator: String,
    pub value: serde_json::Value,
}

/// Sensitive action rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensitiveActionRule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: SensitivityCategory,
    pub risk_level: RiskLevel,
    pub conditions: Vec<RuleCondition>,
    pub requires_confirmation: bool,
    pub requires_approval: bool,
    pub approval_workflow: Option<String>,
    pub audit_level: String,
}

/// Detected sensitive action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedSensitiveAction {
    pub id: String,
    pub step_id: String,
    pub rule_id: String,
    pub rule_name: String,
    pub category: SensitivityCategory,
    pub risk_level: RiskLevel,
    pub requires_confirmation: bool,
    pub requires_approval: bool,
    pub approval_workflow: Option<String>,
    pub matched_conditions: Vec<RuleCondition>,
    pub metadata: Option<serde_json::Value>,
    pub timestamp: i64,
}

/// Risk assessment result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub action_id: String,
    pub step_id: String,
    pub overall_risk: RiskLevel,
    pub sensitive_actions: Vec<DetectedSensitiveAction>,
    pub requires_confirmation: bool,
    pub requires_approval: bool,
    pub blocked: bool,
    pub block_reason: Option<String>,
    pub recommendations: Vec<String>,
}

/// Authorization outcome
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AuthorizationOutcome {
    Allowed,
    Denied,
    Restricted,
    RequiresApproval,
}

impl std::fmt::Display for AuthorizationOutcome {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthorizationOutcome::Allowed => write!(f, "allowed"),
            AuthorizationOutcome::Denied => write!(f, "denied"),
            AuthorizationOutcome::Restricted => write!(f, "restricted"),
            AuthorizationOutcome::RequiresApproval => write!(f, "requires_approval"),
        }
    }
}

/// Authorization scope
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AuthorizationScope {
    Field,
    Action,
    Datasource,
    Resource,
}

impl std::fmt::Display for AuthorizationScope {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthorizationScope::Field => write!(f, "field"),
            AuthorizationScope::Action => write!(f, "action"),
            AuthorizationScope::Datasource => write!(f, "datasource"),
            AuthorizationScope::Resource => write!(f, "resource"),
        }
    }
}

/// Permission level
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PermissionLevel {
    None,
    Read,
    Write,
    Delete,
    Admin,
}

impl std::fmt::Display for PermissionLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionLevel::None => write!(f, "none"),
            PermissionLevel::Read => write!(f, "read"),
            PermissionLevel::Write => write!(f, "write"),
            PermissionLevel::Delete => write!(f, "delete"),
            PermissionLevel::Admin => write!(f, "admin"),
        }
    }
}

/// Confirmation outcome
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConfirmationOutcome {
    Approved,
    Rejected,
    Cancelled,
    Timeout,
}

impl std::fmt::Display for ConfirmationOutcome {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfirmationOutcome::Approved => write!(f, "approved"),
            ConfirmationOutcome::Rejected => write!(f, "rejected"),
            ConfirmationOutcome::Cancelled => write!(f, "cancelled"),
            ConfirmationOutcome::Timeout => write!(f, "timeout"),
        }
    }
}

/// Security event entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEvent {
    pub id: String,
    pub trace_id: String,
    pub session_id: String,
    pub event_type: String,
    pub severity: String,
    pub category: String,
    pub outcome: String,
    pub target: String,
    pub user_id: Option<String>,
    pub reason: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: i64,
}

/// Tool execution context for security checks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolExecutionContext {
    pub tool_id: String,
    pub tool_name: String,
    pub tool_category: Option<String>,
    pub parameters: HashMap<String, serde_json::Value>,
    pub session_id: String,
    pub trace_id: String,
    pub user_id: Option<String>,
    pub tenant_id: Option<String>,
}

/// Security check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityCheckResult {
    pub allowed: bool,
    pub requires_confirmation: bool,
    pub requires_approval: bool,
    pub blocked: bool,
    pub risk_level: RiskLevel,
    pub sensitive_actions: Vec<DetectedSensitiveAction>,
    pub denial_reason: Option<String>,
    pub confirmation_id: Option<String>,
}
