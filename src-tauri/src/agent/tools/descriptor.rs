use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolCategory {
    Core,
    Plugin,
    Mcp,
    Builtin,
    External,
    Memory,
    Session,
    Media,
    Automation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolExecutionMode {
    Sync,
    Async,
    Streaming,
    Batch,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ToolParameterType {
    String,
    Number,
    Boolean,
    Object,
    Array,
    Null,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ToolParameterTypeSpec {
    Single(ToolParameterType),
    Multiple(Vec<ToolParameterType>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolParameter {
    pub name: String,
    #[serde(rename = "type")]
    pub param_type: ToolParameterTypeSpec,
    pub description: String,
    pub required: bool,
    pub default: Option<Value>,
    pub r#enum: Option<Vec<String>>,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
    pub pattern: Option<String>,
    pub items: Option<Box<ToolParameter>>,
    pub properties: Option<std::collections::HashMap<String, ToolParameter>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolReturnType {
    #[serde(rename = "type")]
    pub return_type: ToolParameterType,
    pub description: Option<String>,
    pub items: Option<Box<ToolReturnType>>,
    pub properties: Option<std::collections::HashMap<String, ToolReturnType>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCapabilities {
    pub supports_streaming: bool,
    pub supports_cancellation: bool,
    pub requires_permission: bool,
    pub requires_confirmation: bool,
    pub is_read_only: bool,
    pub has_side_effects: bool,
    pub supports_retry: bool,
    pub estimated_duration: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolPermissionRequirement {
    #[serde(rename = "type")]
    pub permission_type: String,
    pub resource: String,
    pub description: String,
    pub optional: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDependency {
    pub tool_id: String,
    #[serde(rename = "type")]
    pub dependency_type: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolMetadata {
    pub author: Option<String>,
    pub version: String,
    pub license: Option<String>,
    pub homepage: Option<String>,
    pub repository: Option<String>,
    pub tags: Vec<String>,
    pub category: String,
    pub subcategory: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolContextRequirements {
    pub requires_session: bool,
    pub requires_user_context: bool,
    pub requires_workspace: bool,
    pub requires_network_access: bool,
    pub requires_file_system_access: bool,
    pub required_env_vars: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDescriptor {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: ToolCategory,
    pub parameters: Vec<ToolParameter>,
    pub return_type: Option<ToolReturnType>,
    pub execution_mode: ToolExecutionMode,
    pub capabilities: ToolCapabilities,
    pub permissions: Option<Vec<ToolPermissionRequirement>>,
    pub dependencies: Option<Vec<ToolDependency>>,
    pub context_requirements: Option<ToolContextRequirements>,
    pub metadata: ToolMetadata,
    pub enabled: bool,
    pub deprecated: Option<bool>,
    pub deprecation_message: Option<String>,
    pub handler_module: Option<String>,
    pub handler_function: Option<String>,
}

pub fn validate_parameters(
    descriptor: &ToolDescriptor,
    params: &serde_json::Map<String, Value>,
) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    for param in &descriptor.parameters {
        let value = params.get(&param.name);
        if param.required && value.is_none() {
            errors.push(format!("Missing required parameter: {}", param.name));
            continue;
        }

        if value.is_none() {
            continue;
        }

        if let Some(value) = value {
            if !matches_type(value, &param.param_type) {
                errors.push(format!("Parameter {} has invalid type", param.name));
            }

            if let Some(enum_values) = &param.r#enum {
                if let Some(value_str) = value.as_str() {
                    if !enum_values.contains(&value_str.to_string()) {
                        errors.push(format!("Parameter {} must be one of {:?}", param.name, enum_values));
                    }
                }
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

fn matches_type(value: &Value, expected: &ToolParameterTypeSpec) -> bool {
    match expected {
        ToolParameterTypeSpec::Single(param_type) => matches_single_type(value, param_type),
        ToolParameterTypeSpec::Multiple(types) => types.iter().any(|t| matches_single_type(value, t)),
    }
}

fn matches_single_type(value: &Value, expected: &ToolParameterType) -> bool {
    match expected {
        ToolParameterType::String => value.is_string(),
        ToolParameterType::Number => value.is_number(),
        ToolParameterType::Boolean => value.is_boolean(),
        ToolParameterType::Object => value.is_object(),
        ToolParameterType::Array => value.is_array(),
        ToolParameterType::Null => value.is_null(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_descriptor() -> ToolDescriptor {
        ToolDescriptor {
            id: "sample".to_string(),
            name: "Sample".to_string(),
            description: "Sample".to_string(),
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
                requires_permission: false,
                requires_confirmation: false,
                is_read_only: true,
                has_side_effects: false,
                supports_retry: false,
                estimated_duration: None,
            },
            permissions: None,
            dependencies: None,
            context_requirements: None,
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
    fn validate_parameters_requires_input() {
        let descriptor = sample_descriptor();
        let params = serde_json::Map::new();
        let result = validate_parameters(&descriptor, &params);
        assert!(result.is_err());
    }

    #[test]
    fn validate_parameters_accepts_string() {
        let descriptor = sample_descriptor();
        let mut params = serde_json::Map::new();
        params.insert("input".to_string(), Value::String("ok".to_string()));
        let result = validate_parameters(&descriptor, &params);
        assert!(result.is_ok());
    }
}
