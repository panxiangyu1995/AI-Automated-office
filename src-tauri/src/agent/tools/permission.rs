use super::descriptor::ToolDescriptor;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionCheckResult {
    pub allowed: bool,
    pub reason: Option<String>,
    pub required: Vec<String>,
    pub missing: Vec<String>,
}

pub fn check_permissions(descriptor: &ToolDescriptor, permissions: &[String]) -> PermissionCheckResult {
    let requirements = descriptor
        .permissions
        .as_ref()
        .map(|perms| {
            perms
                .iter()
                .map(|perm| format!("{}:{}", perm.permission_type, perm.resource))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    if requirements.is_empty() {
        return PermissionCheckResult {
            allowed: true,
            reason: None,
            required: vec![],
            missing: vec![],
        };
    }

    let mut missing = Vec::new();

    for requirement in &requirements {
        if !permissions.iter().any(|perm| matches_permission(perm, requirement)) {
            missing.push(requirement.clone());
        }
    }

    if missing.is_empty() {
        PermissionCheckResult {
            allowed: true,
            reason: None,
            required: requirements,
            missing,
        }
    } else {
        PermissionCheckResult {
            allowed: false,
            reason: Some("Missing required permissions".to_string()),
            required: requirements,
            missing,
        }
    }
}

fn matches_permission(granted: &str, required: &str) -> bool {
    if granted == "*" || granted == required {
        return true;
    }

    if let Some(prefix) = granted.strip_suffix('*') {
        return required.starts_with(prefix);
    }

    let granted_parts: Vec<&str> = granted.split(':').collect();
    let required_parts: Vec<&str> = required.split(':').collect();

    if granted_parts.len() >= 2 && required_parts.len() >= 2 {
        if granted_parts[0] == "admin" {
            return true;
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent::tools::descriptor::{
        ToolCapabilities, ToolCategory, ToolContextRequirements, ToolDescriptor, ToolExecutionMode,
        ToolMetadata, ToolParameter, ToolParameterType, ToolParameterTypeSpec,
        ToolPermissionRequirement,
    };

    fn descriptor_with_permission() -> ToolDescriptor {
        ToolDescriptor {
            id: "secure_tool".to_string(),
            name: "Secure Tool".to_string(),
            description: "Needs permission".to_string(),
            category: ToolCategory::Core,
            parameters: vec![ToolParameter {
                name: "input".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "Input".to_string(),
                required: true,
                default: None,
                r#enum: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            }],
            return_type: None,
            execution_mode: ToolExecutionMode::Sync,
            capabilities: ToolCapabilities {
                supports_streaming: false,
                supports_cancellation: false,
                requires_permission: true,
                requires_confirmation: false,
                is_read_only: true,
                has_side_effects: false,
                supports_retry: false,
                estimated_duration: None,
            },
            permissions: Some(vec![ToolPermissionRequirement {
                permission_type: "network".to_string(),
                resource: "external".to_string(),
                description: "Need network".to_string(),
                optional: None,
            }]),
            dependencies: None,
            context_requirements: Some(ToolContextRequirements {
                requires_session: false,
                requires_user_context: false,
                requires_workspace: false,
                requires_network_access: true,
                requires_file_system_access: false,
                required_env_vars: None,
            }),
            metadata: ToolMetadata {
                author: None,
                version: "1.0.0".to_string(),
                license: None,
                homepage: None,
                repository: None,
                tags: vec![],
                category: "test".to_string(),
                subcategory: None,
            },
            enabled: true,
            deprecated: None,
            deprecation_message: None,
            handler_module: None,
            handler_function: None,
        }
    }

    #[test]
    fn check_permissions_denies_missing() {
        let descriptor = descriptor_with_permission();
        let result = check_permissions(&descriptor, &[]);
        assert!(!result.allowed);
        assert_eq!(result.missing.len(), 1);
    }

    #[test]
    fn check_permissions_allows_match() {
        let descriptor = descriptor_with_permission();
        let result = check_permissions(&descriptor, &[String::from("network:external")]);
        assert!(result.allowed);
        assert!(result.missing.is_empty());
    }
}
