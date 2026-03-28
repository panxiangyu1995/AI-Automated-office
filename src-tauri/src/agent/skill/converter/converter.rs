//! Skill format converter.

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
