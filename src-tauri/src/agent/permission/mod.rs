//! Permission Ruleset Module
//!
//! Implements fine-grained permission control for office scenarios:
//! - Operation-level permissions (department, approval, document, etc.)
//! - Pattern-based resource matching with glob support
//! - Rule merging with deny-priority semantics
//!
//! See spec: openspec/changes/subagent-architecture-alignment/specs/subagent-permission-ruleset/spec.md

pub mod ruleset;

pub use ruleset::{
    PermissionAction, PermissionChecker, PermissionOperation, PermissionRule, Ruleset,
};

/// Default permission ruleset for office operations
pub fn default_office_ruleset() -> Ruleset {
    vec![
        // Department - ask by default, allow public queries
        PermissionRule::new("department", "public_*", PermissionAction::Allow),
        PermissionRule::new("department", "*", PermissionAction::Ask),
        // Approval - ask by default
        PermissionRule::new("approval", "*", PermissionAction::Ask),
        // Document - read allowed, write asks, delete denied
        PermissionRule::new("document", "read_*", PermissionAction::Allow),
        PermissionRule::new("document", "write_*", PermissionAction::Ask),
        PermissionRule::new("document", "delete_*", PermissionAction::Deny),
        // Employee - profile read allowed, salary denied
        PermissionRule::new("employee", "profile_*", PermissionAction::Allow),
        PermissionRule::new("employee", "salary_*", PermissionAction::Deny),
        // Finance - ask by default
        PermissionRule::new("finance", "*", PermissionAction::Ask),
        // Warehouse - ask by default
        PermissionRule::new("warehouse", "*", PermissionAction::Ask),
        // MCP tools - ask by default
        PermissionRule::new("mcp_*", "*", PermissionAction::Ask),
    ]
}
