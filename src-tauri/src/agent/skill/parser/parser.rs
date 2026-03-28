//! SKILL.md parser implementation.

use std::path::Path;
use async_trait::async_trait;

use super::{SkillParserTrait, super::{
    Skill, SkillError, SkillCategory, Permission,
    ParametersSchema, SkillEndpoint, SkillDependency, SkillMetadata,
}};

/// Parser for SKILL.md files
pub struct SkillParser;

impl SkillParser {
    /// Create a new parser
    pub fn new() -> Self {
        Self
    }
}

impl Default for SkillParser {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl SkillParserTrait for SkillParser {
    async fn parse(&self, content: &str) -> Result<Skill, SkillError> {
        // Parse YAML frontmatter if present
        let (frontmatter, _markdown) = extract_frontmatter(content);

        if let Some(fm) = frontmatter {
            self.parse_yaml_frontmatter(&fm)
        } else {
            Err(SkillError::parse_error("No valid SKILL.md format found", content))
        }
    }

    async fn parse_file(&self, path: &Path) -> Result<Skill, SkillError> {
        let content = tokio::fs::read_to_string(path)
            .await
            .map_err(|e| SkillError::parse_error(&e.to_string(), path.to_str().unwrap_or("")))?;

        let mut skill = self.parse(&content).await?;

        // Set skill ID from directory name if not in frontmatter
        if skill.id.is_empty() || skill.id == "unknown" {
            if let Some(name) = path.parent().and_then(|p| p.file_name()).and_then(|n| n.to_str()) {
                skill.id = name.to_string();
            }
        }

        Ok(skill)
    }
}

impl SkillParser {
    /// Parse YAML frontmatter
    fn parse_yaml_frontmatter(&self, content: &str) -> Result<Skill, SkillError> {
        // Simple YAML parsing - in production would use serde_yaml
        let skill = serde_yaml::from_str::<SkillYaml>(content)
            .map_err(|e| SkillError::parse_error(&e.to_string(), content))?;

        Ok(self.yaml_to_skill(skill))
    }

    /// Convert YAML structure to Skill
    fn yaml_to_skill(&self, yaml: SkillYaml) -> Skill {
        Skill {
            id: yaml.id.unwrap_or_else(|| "unknown".to_string()),
            name: yaml.name.unwrap_or_else(|| "Unnamed Skill".to_string()),
            version: yaml.version.unwrap_or_else(|| "1.0.0".to_string()),
            description: yaml.description.unwrap_or_default(),
            category: yaml.category.map(|c| match c.as_str() {
                "core" => SkillCategory::Core,
                "custom" => SkillCategory::Custom,
                "integration" => SkillCategory::Integration,
                s if s.starts_with("department:") => {
                    SkillCategory::Department(s.trim_start_matches("department:").to_string())
                }
                s if s.starts_with("plugin:") => {
                    SkillCategory::Plugin(s.trim_start_matches("plugin:").to_string())
                }
                _ => SkillCategory::Custom,
            }).unwrap_or(SkillCategory::Custom),
            permissions: yaml.permissions.unwrap_or_default(),
            parameters: yaml.parameters.unwrap_or_else(|| ParametersSchema {
                required: Vec::new(),
                optional: Vec::new(),
                schema: serde_json::json!({}),
            }),
            endpoints: yaml.endpoints.unwrap_or_default(),
            dependencies: yaml.dependencies.unwrap_or_default(),
            metadata: SkillMetadata {
                author: yaml.author.unwrap_or_default(),
                tags: yaml.tags.unwrap_or_default(),
                icon: yaml.icon,
                config_template: yaml.config_template,
            },
        }
    }
}

/// Extract YAML frontmatter from markdown
fn extract_frontmatter(content: &str) -> (Option<String>, &str) {
    let content = content.trim();

    if content.starts_with("---") {
        if let Some(end) = content[3..].find("---") {
            let frontmatter = &content[3..end].trim();
            let markdown = &content[end + 3..];
            return (Some(frontmatter.to_string()), markdown);
        }
    }

    (None, content)
}

/// YAML structure for deserialization
#[derive(serde::Deserialize, Debug)]
struct SkillYaml {
    id: Option<String>,
    name: Option<String>,
    version: Option<String>,
    description: Option<String>,
    category: Option<String>,
    permissions: Option<Vec<Permission>>,
    parameters: Option<ParametersSchema>,
    endpoints: Option<Vec<SkillEndpoint>>,
    dependencies: Option<Vec<SkillDependency>>,
    author: Option<String>,
    tags: Option<Vec<String>>,
    icon: Option<String>,
    config_template: Option<serde_json::Value>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_parse_valid_frontmatter() {
        let parser = SkillParser::new();
        let content = r#"---
id: test-skill
name: Test Skill
version: 1.0.0
description: A test skill
category: custom
author: test
tags:
  - test
  - example
---
# Test Skill

This is a test skill.
"#;

        let result = parser.parse(content).await;
        assert!(result.is_ok());

        let skill = result.unwrap();
        assert_eq!(skill.id, "test-skill");
        assert_eq!(skill.name, "Test Skill");
        assert_eq!(skill.version, "1.0.0");
    }

    #[tokio::test]
    async fn test_parse_invalid_frontmatter() {
        let parser = SkillParser::new();
        let content = "No frontmatter here";

        let result = parser.parse(content).await;
        assert!(result.is_err());
    }
}
