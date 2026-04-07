//! Skill format converter.

use std::collections::HashMap;
use super::super::{Skill, SkillError};

/// Converter for different skill formats
pub struct SkillConverter;

impl SkillConverter {
    /// Create a new converter
    pub fn new() -> Self {
        Self
    }

    /// Convert Skill to JSON
    pub fn to_json(&self, skill: &Skill) -> Result<String, SkillError> {
        serde_json::to_string_pretty(skill)
            .map_err(|e| SkillError::parse_error(&e.to_string(), "JSON conversion"))
    }

    /// Convert Skill to YAML
    pub fn to_yaml(&self, skill: &Skill) -> Result<String, SkillError> {
        serde_yaml::to_string(skill)
            .map_err(|e| SkillError::parse_error(&e.to_string(), "YAML conversion"))
    }

    /// Parse Skill from JSON
    pub fn from_json(&self, json: &str) -> Result<Skill, SkillError> {
        serde_json::from_str(json)
            .map_err(|e| SkillError::parse_error(&e.to_string(), "JSON parsing"))
    }

    /// Parse Skill from YAML
    pub fn from_yaml(&self, yaml: &str) -> Result<Skill, SkillError> {
        serde_yaml::from_str(yaml)
            .map_err(|e| SkillError::parse_error(&e.to_string(), "YAML parsing"))
    }

    /// Convert Skill to tool descriptor JSON
    pub fn skill_to_tool(&self, skill: &Skill) -> serde_json::Value {
        let mut properties: HashMap<String, serde_json::Value> = HashMap::new();

        // Add skill properties as tool parameters
        properties.insert("skill_id".to_string(), serde_json::json!({
            "type": "string",
            "description": "The skill identifier"
        }));
        properties.insert("action".to_string(), serde_json::json!({
            "type": "string",
            "description": "The action to perform",
            "enum": skill.endpoints.iter().map(|e| e.name.clone()).collect::<Vec<_>>()
        }));

        serde_json::json!({
            "name": format!("skill_{}", skill.id.replace("-", "_")),
            "description": skill.description,
            "category": format!("{:?}", skill.category),
            "version": skill.version,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": vec!["skill_id", "action"]
            },
            "endpoints": skill.endpoints.iter().map(|e| {
                serde_json::json!({
                    "name": e.name,
                    "method": e.method,
                    "path": e.path,
                    "description": e.description
                })
            }).collect::<Vec<_>>(),
            "permissions": skill.permissions.iter().map(|p| {
                serde_json::json!({
                    "type": format!("{:?}", p.permission_type),
                    "resource": p.resource,
                    "level": format!("{:?}", p.level)
                })
            }).collect::<Vec<_>>(),
            "metadata": {
                "author": skill.metadata.author,
                "tags": skill.metadata.tags
            }
        })
    }

    /// Convert Skill to trigger config
    pub fn skill_to_trigger(&self, skill: &Skill) -> serde_json::Value {
        serde_json::json!({
            "type": "skill",
            "skill_id": skill.id,
            "enabled": true,
            "keywords": skill.metadata.tags.clone(),
            "category": format!("{:?}", skill.category)
        })
    }
}

impl Default for SkillConverter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::types::{SkillCategory, SkillMetadata, ParametersSchema};

    #[test]
    fn test_json_roundtrip() {
        let converter = SkillConverter::new();
        let skill = Skill {
            id: "test".to_string(),
            name: "Test".to_string(),
            version: "1.0.0".to_string(),
            description: "Test skill".to_string(),
            category: SkillCategory::Custom,
            permissions: Vec::new(),
            parameters: ParametersSchema {
                required: Vec::new(),
                optional: Vec::new(),
                schema: serde_json::json!({}),
            },
            endpoints: Vec::new(),
            dependencies: Vec::new(),
            metadata: SkillMetadata {
                author: "test".to_string(),
                tags: vec!["test".to_string()],
                icon: None,
                config_template: None,
            },
        };

        let json = converter.to_json(&skill).unwrap();
        let parsed = converter.from_json(&json).unwrap();

        assert_eq!(parsed.id, skill.id);
        assert_eq!(parsed.name, skill.name);
    }
}
