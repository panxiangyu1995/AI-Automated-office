//! Skill execution context utilities.

use std::collections::HashMap;

use chrono::Utc;
use serde_json::Value;

use super::super::{SkillExecutionContext, SkillCategory, Permission, PermissionType, AccessLevel};

/// Create a new execution context
pub fn create_execution_context(
    skill_id: &str,
    endpoint: &str,
    tenant_id: &str,
) -> SkillExecutionContext {
    SkillExecutionContext {
        skill_id: skill_id.to_string(),
        endpoint: endpoint.to_string(),
        tenant_id: tenant_id.to_string(),
        user_id: None,
        parameters: HashMap::new(),
        session_id: None,
        timestamp: Utc::now().to_rfc3339(),
    }
}

/// Add a parameter to the context
pub fn add_parameter(ctx: &mut SkillExecutionContext, key: &str, value: Value) {
    ctx.parameters.insert(key.to_string(), value);
}

/// Set user ID in context
pub fn set_user(ctx: &mut SkillExecutionContext, user_id: &str) {
    ctx.user_id = Some(user_id.to_string());
}

/// Set session ID in context
pub fn set_session(ctx: &mut SkillExecutionContext, session_id: &str) {
    ctx.session_id = Some(session_id.to_string());
}

/// Check if skill category requires specific permissions
pub fn category_permissions(category: &SkillCategory) -> Vec<Permission> {
    match category {
        SkillCategory::Core => vec![
            Permission {
                permission_type: PermissionType::Read,
                resource: "*".to_string(),
                level: AccessLevel::Full,
            },
        ],
        SkillCategory::Department(dept) => vec![
            Permission {
                permission_type: PermissionType::Read,
                resource: format!("department:{}", dept),
                level: AccessLevel::ReadWrite,
            },
        ],
        SkillCategory::Plugin(plugin) => vec![
            Permission {
                permission_type: PermissionType::Read,
                resource: format!("plugin:{}", plugin),
                level: AccessLevel::ReadOnly,
            },
        ],
        SkillCategory::Custom => vec![],
        SkillCategory::Integration => vec![
            Permission {
                permission_type: PermissionType::Execute,
                resource: "external".to_string(),
                level: AccessLevel::ReadOnly,
            },
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_execution_context() {
        let ctx = create_execution_context("test-skill", "execute", "tenant-1");

        assert_eq!(ctx.skill_id, "test-skill");
        assert_eq!(ctx.endpoint, "execute");
        assert_eq!(ctx.tenant_id, "tenant-1");
        assert!(ctx.user_id.is_none());
        assert!(ctx.parameters.is_empty());
    }

    #[test]
    fn test_add_parameter() {
        let mut ctx = create_execution_context("test", "exec", "t");
        add_parameter(&mut ctx, "key", serde_json::json!("value"));

        assert_eq!(ctx.parameters.get("key"), Some(&serde_json::json!("value")));
    }
}
