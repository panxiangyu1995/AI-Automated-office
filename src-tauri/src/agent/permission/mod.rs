//! Permission Module
//!
//! Implements three-layer permission system:
//! - Platform Base: System-level default permissions
//! - Department Capability: Department-specific tool permissions
//! - Role Enhancement: Role-based permission overrides
//!
//! Permission calculation: Final = (Platform ∪ Department ∪ Role) \ Blacklist

pub mod ruleset;

// Re-export ruleset types for convenience
pub use ruleset::{PermissionAction, PermissionRule, Ruleset, PermissionChecker};

// Sandbox module
pub mod sandbox;

/// Get the default office ruleset
pub fn default_office_ruleset() -> Ruleset {
    vec![
        PermissionRule::new("department", "*", PermissionAction::Allow),
        PermissionRule::new("approval", "*", PermissionAction::Allow),
        PermissionRule::new("document", "*", PermissionAction::Allow),
        PermissionRule::new("employee", "*", PermissionAction::Allow),
        PermissionRule::new("finance", "*", PermissionAction::Ask),
        PermissionRule::new("warehouse", "*", PermissionAction::Ask),
    ]
}

// Permission engine - three-layer permission calculation
pub mod engine;
pub mod engine_types;

// Field-level permission checker
pub mod field_checker;

// Data scope filter
pub mod scope_filter;

// Permission middleware for tool execution pipeline
pub mod middleware;


use serde::{Deserialize, Serialize};

/// Role type for permission system
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    Admin,
    Manager,
    Specialist,
    Staff,
    Guest,
}

impl Role {
    /// Parse from string
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "admin" => Some(Role::Admin),
            "manager" => Some(Role::Manager),
            "specialist" => Some(Role::Specialist),
            "staff" => Some(Role::Staff),
            "guest" => Some(Role::Guest),
            _ => None,
        }
    }

    /// Get role hierarchy level (higher = more permissions)
    pub fn level(&self) -> u8 {
        match self {
            Role::Admin => 100,
            Role::Manager => 70,
            Role::Specialist => 50,
            Role::Staff => 30,
            Role::Guest => 10,
        }
    }
}

impl std::fmt::Display for Role {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Role::Admin => write!(f, "admin"),
            Role::Manager => write!(f, "manager"),
            Role::Specialist => write!(f, "specialist"),
            Role::Staff => write!(f, "staff"),
            Role::Guest => write!(f, "guest"),
        }
    }
}

impl Default for Role {
    fn default() -> Self {
        Role::Staff
    }
}

/// Executive role (for convenience in finance context)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutiveRole {
    Staff,
    Specialist,
    Manager,
    Executive,
}

impl ExecutiveRole {
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "staff" => Some(ExecutiveRole::Staff),
            "specialist" => Some(ExecutiveRole::Specialist),
            "manager" => Some(ExecutiveRole::Manager),
            "executive" => Some(ExecutiveRole::Executive),
            _ => None,
        }
    }

    pub fn level(&self) -> u8 {
        match self {
            ExecutiveRole::Executive => 90,
            ExecutiveRole::Manager => 70,
            ExecutiveRole::Specialist => 50,
            ExecutiveRole::Staff => 30,
        }
    }
}

impl Default for ExecutiveRole {
    fn default() -> Self {
        ExecutiveRole::Staff
    }
}

/// Tool constraint for permission calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolConstraint {
    /// Maximum calls per day
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_per_day: Option<u32>,
    /// Maximum amount limit
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_amount: Option<f64>,
    /// Allowed fields for this tool
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allowed_fields: Option<Vec<String>>,
    /// Data scope constraint
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_scope: Option<DataScopeType>,
}

/// Data scope type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataScopeType {
    /// Only user's own data
    Personal,
    /// Department data only
    Department,
    /// All data
    All,
    /// Executive scope (includes sensitive data)
    Executive,
}

impl Default for DataScopeType {
    fn default() -> Self {
        DataScopeType::Personal
    }
}

impl std::fmt::Display for DataScopeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataScopeType::Personal => write!(f, "personal"),
            DataScopeType::Department => write!(f, "department"),
            DataScopeType::All => write!(f, "all"),
            DataScopeType::Executive => write!(f, "executive"),
        }
    }
}
