//! Permission engine type definitions
//!
//! Contains types, enums, and structs for the three-layer permission system.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::{DataScopeType, ToolConstraint};
use crate::session::TenantContext;

/// Permission domain types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PermissionDomain {
    /// Platform-level permissions
    Platform,
    /// Department-level permissions
    Department,
    /// Role-level permissions
    Role,
}

impl std::fmt::Display for PermissionDomain {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionDomain::Platform => write!(f, "platform"),
            PermissionDomain::Department => write!(f, "department"),
            PermissionDomain::Role => write!(f, "role"),
        }
    }
}

/// Permission error types
#[derive(Debug, Error)]
pub enum PermissionError {
    #[error("User not found: {0}")]
    UserNotFound(String),

    #[error("Department not found: {0}")]
    DepartmentNotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Tool not allowed: {0}")]
    ToolNotAllowed(String),

    #[error("Permission calculation timeout")]
    CalculationTimeout,

    #[error("Invalid role: {0}")]
    InvalidRole(String),

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    #[error("Cycle detected in permission rules")]
    CycleDetected,
}

/// Execution context for permission calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionContext {
    /// Tenant ID
    pub tenant_id: String,
    /// User ID
    pub user_id: String,
    /// User role
    pub role: String,
    /// Department ID (optional)
    pub department_id: Option<String>,
    /// Tool being executed
    pub tool_id: Option<String>,
    /// Requested data scope
    pub requested_scope: Option<DataScopeType>,
    /// Additional metadata
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
}

impl ExecutionContext {
    pub fn new(tenant_id: String, user_id: String, role: String) -> Self {
        Self {
            tenant_id,
            user_id,
            role,
            department_id: None,
            tool_id: None,
            requested_scope: None,
            metadata: HashMap::new(),
        }
    }

    pub fn with_department(mut self, department_id: String) -> Self {
        self.department_id = Some(department_id);
        self
    }

    pub fn with_tool(mut self, tool_id: String) -> Self {
        self.tool_id = Some(tool_id);
        self
    }

    pub fn with_scope(mut self, scope: DataScopeType) -> Self {
        self.requested_scope = Some(scope);
        self
    }

    /// Create ExecutionContext from TenantContext
    pub fn from_tenant_context(ctx: &TenantContext) -> Self {
        Self {
            tenant_id: ctx.tenant_id.clone(),
            user_id: ctx.user_id.clone(),
            role: ctx.role.clone(),
            department_id: ctx.department_id.clone(),
            tool_id: None,
            requested_scope: None,
            metadata: HashMap::new(),
        }
    }
}

/// User permissions result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPermissions {
    /// Allowed tool IDs
    pub allowed_tools: Vec<String>,
    /// Denied tool IDs (explicitly blocked)
    pub denied_tools: Vec<String>,
    /// Tool constraints by tool ID
    pub tool_constraints: HashMap<String, ToolConstraint>,
    /// Data scope by domain
    pub data_scope: HashMap<String, DataScopeType>,
    /// Field permissions by tool (tool_id -> allowed_fields)
    pub field_permissions: HashMap<String, Vec<String>>,
    /// Blacklisted tools
    pub blacklist: Vec<String>,
    /// Effective role
    pub effective_role: String,
    /// Effective department
    pub effective_department: Option<String>,
}

impl Default for UserPermissions {
    fn default() -> Self {
        Self {
            allowed_tools: Vec::new(),
            denied_tools: Vec::new(),
            tool_constraints: HashMap::new(),
            data_scope: HashMap::new(),
            field_permissions: HashMap::new(),
            blacklist: Vec::new(),
            effective_role: "staff".to_string(),
            effective_department: None,
        }
    }
}

impl UserPermissions {
    /// Check if a tool is allowed
    pub fn is_tool_allowed(&self, tool_id: &str) -> bool {
        // Check blacklist first
        if self.blacklist.contains(&tool_id.to_string()) {
            return false;
        }
        // Check denied list
        if self.denied_tools.contains(&tool_id.to_string()) {
            return false;
        }
        // Check allowed list (if not empty, tool must be in it)
        if !self.allowed_tools.is_empty() {
            return self.allowed_tools.contains(&tool_id.to_string());
        }
        // If allowed list is empty, allow by default
        true
    }

    /// Get tool constraints for a specific tool
    pub fn get_tool_constraint(&self, tool_id: &str) -> Option<&ToolConstraint> {
        self.tool_constraints.get(tool_id)
    }

    /// Get allowed fields for a tool
    pub fn get_allowed_fields(&self, tool_id: &str) -> Option<&Vec<String>> {
        self.field_permissions.get(tool_id)
    }

    /// Get data scope for a domain
    pub fn get_data_scope(&self, domain: &str) -> DataScopeType {
        self.data_scope.get(domain).copied().unwrap_or(DataScopeType::Personal)
    }
}

/// Platform base permissions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformPermissions {
    /// Default allowed tools
    pub default_allowed_tools: Vec<String>,
    /// Default denied tools
    pub default_denied_tools: Vec<String>,
    /// System-level tool constraints
    pub tool_constraints: HashMap<String, ToolConstraint>,
    /// Platform data scope
    pub default_data_scope: DataScopeType,
}

impl Default for PlatformPermissions {
    fn default() -> Self {
        Self {
            default_allowed_tools: Vec::new(),
            default_denied_tools: vec![
                "system_admin_*".to_string(),
                "security_*".to_string(),
                "debug_*".to_string(),
            ],
            tool_constraints: HashMap::new(),
            default_data_scope: DataScopeType::Personal,
        }
    }
}

/// Department capability permissions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentPermissions {
    /// Department ID
    pub department_id: String,
    /// Department name
    pub name: String,
    /// Allowed tools for this department
    pub allowed_tools: Vec<String>,
    /// Denied tools for this department
    pub denied_tools: Vec<String>,
    /// Tool constraints specific to this department
    pub tool_constraints: HashMap<String, ToolConstraint>,
    /// Field permissions by tool
    pub field_permissions: HashMap<String, Vec<String>>,
    /// Default data scope
    pub default_data_scope: DataScopeType,
}

impl Default for DepartmentPermissions {
    fn default() -> Self {
        Self {
            department_id: String::new(),
            name: String::new(),
            allowed_tools: Vec::new(),
            denied_tools: Vec::new(),
            tool_constraints: HashMap::new(),
            field_permissions: HashMap::new(),
            default_data_scope: DataScopeType::Department,
        }
    }
}

/// Role enhancement permissions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RolePermissions {
    /// Role name
    pub role: String,
    /// Additional allowed tools
    pub allowed_tools: Vec<String>,
    /// Tools denied for this role (override allows)
    pub denied_tools: Vec<String>,
    /// Tool constraints by role
    pub tool_constraints: HashMap<String, ToolConstraint>,
    /// Field permissions by tool
    pub field_permissions: HashMap<String, Vec<String>>,
    /// Data scope for this role
    pub data_scope: DataScopeType,
    /// Can bypass department restrictions
    pub bypass_department: bool,
}

impl Default for RolePermissions {
    fn default() -> Self {
        Self {
            role: "staff".to_string(),
            allowed_tools: Vec::new(),
            denied_tools: Vec::new(),
            tool_constraints: HashMap::new(),
            field_permissions: HashMap::new(),
            data_scope: DataScopeType::Personal,
            bypass_department: false,
        }
    }
}
