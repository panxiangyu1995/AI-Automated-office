//! Common helper functions for tool modules
//!
//! This module provides shared helper functions to eliminate code duplication
//! across tool modules like core.rs, web.rs, shell.rs, filesystem.rs, browser.rs, etc.

use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolContextRequirements, ToolMetadata,
    ToolParameter, ToolParameterType, ToolParameterTypeSpec,
};

/// Create base metadata with common defaults
///
/// # Arguments
///
/// * `category` - The category name (e.g., "system", "network", "shell")
/// * `tags` - Tags for the tool (e.g., ["core", "system"])
///
/// # Example
///
/// ```rust,ignore
/// let metadata = base_metadata("system", vec!["core", "system"]);
/// ```
pub fn base_metadata(category: &str, tags: Vec<&str>) -> ToolMetadata {
    ToolMetadata {
        author: Some("core".to_string()),
        version: "1.0.0".to_string(),
        license: None,
        homepage: None,
        repository: None,
        tags: tags.into_iter().map(|t| t.to_string()).collect(),
        category: category.to_string(),
        subcategory: None,
    }
}

/// Create default read-only capabilities
pub fn base_readonly_capabilities() -> ToolCapabilities {
    ToolCapabilities {
        supports_streaming: false,
        supports_cancellation: true,
        requires_permission: false,
        requires_confirmation: false,
        is_read_only: true,
        has_side_effects: false,
        supports_retry: true,
        estimated_duration: None,
    }
}

/// Create default writable capabilities (has side effects)
pub fn base_writable_capabilities() -> ToolCapabilities {
    ToolCapabilities {
        supports_streaming: false,
        supports_cancellation: true,
        requires_permission: true,
        requires_confirmation: true,
        is_read_only: false,
        has_side_effects: true,
        supports_retry: true,
        estimated_duration: None,
    }
}

/// Create default capabilities for tools requiring permission
pub fn base_permission_capabilities() -> ToolCapabilities {
    ToolCapabilities {
        supports_streaming: false,
        supports_cancellation: true,
        requires_permission: true,
        requires_confirmation: false,
        is_read_only: true,
        has_side_effects: false,
        supports_retry: true,
        estimated_duration: None,
    }
}

/// Create a string parameter
pub fn string_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create an optional string parameter with default value
pub fn string_param_with_default(name: &str, description: &str, default: &str) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
        description: description.to_string(),
        required: false,
        default: Some(serde_json::Value::String(default.to_string())),
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create a string parameter with enum values
pub fn string_enum_param(
    name: &str,
    description: &str,
    required: bool,
    enum_values: Vec<&str>,
) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
        description: description.to_string(),
        required,
        default: None,
        r#enum: Some(enum_values.into_iter().map(|s| s.to_string()).collect()),
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create a number parameter
pub fn number_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create an optional number parameter with default value
pub fn number_param_with_default(name: &str, description: &str, default: f64) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
        description: description.to_string(),
        required: false,
        default: serde_json::Number::from_f64(default).map(serde_json::Value::Number),
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create a boolean parameter
pub fn bool_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create an optional boolean parameter with default value
pub fn bool_param_with_default(name: &str, description: &str, default: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
        description: description.to_string(),
        required: false,
        default: Some(serde_json::Value::Bool(default)),
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create an object parameter
pub fn object_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Object),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create an array parameter
pub fn array_param(name: &str, description: &str, required: bool) -> ToolParameter {
    ToolParameter {
        name: name.to_string(),
        param_type: ToolParameterTypeSpec::Single(ToolParameterType::Array),
        description: description.to_string(),
        required,
        default: None,
        r#enum: None,
        minimum: None,
        maximum: None,
        pattern: None,
        items: None,
        properties: None,
    }
}

/// Create a basic context requirements (no special requirements)
pub fn no_context_requirements() -> Option<ToolContextRequirements> {
    Some(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: false,
        requires_file_system_access: false,
        required_env_vars: None,
    })
}

/// Create context requirements for filesystem tools
pub fn filesystem_context_requirements() -> Option<ToolContextRequirements> {
    Some(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: true,
        requires_network_access: false,
        requires_file_system_access: true,
        required_env_vars: None,
    })
}

/// Create context requirements for network tools
pub fn network_context_requirements() -> Option<ToolContextRequirements> {
    Some(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: true,
        requires_file_system_access: false,
        required_env_vars: None,
    })
}

/// Create context requirements for tools requiring both network and filesystem
pub fn network_and_filesystem_context_requirements() -> Option<ToolContextRequirements> {
    Some(ToolContextRequirements {
        requires_session: false,
        requires_user_context: false,
        requires_workspace: false,
        requires_network_access: true,
        requires_file_system_access: true,
        required_env_vars: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_metadata() {
        let meta = base_metadata("test", vec!["core", "test"]);
        assert_eq!(meta.category, "test");
        assert_eq!(meta.tags, vec!["core", "test"]);
        assert_eq!(meta.version, "1.0.0");
    }

    #[test]
    fn test_string_param() {
        let param = string_param("name", "A name", true);
        assert_eq!(param.name, "name");
        assert!(param.required);
    }

    #[test]
    fn test_number_param_with_default() {
        let param = number_param_with_default("timeout", "Timeout in ms", 30000.0);
        assert!(!param.required);
        assert_eq!(param.default, Some(serde_json::Value::Number(serde_json::Number::from(30000))));
    }
}
