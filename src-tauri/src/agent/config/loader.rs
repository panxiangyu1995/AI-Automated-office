//! Agent Configuration Loader
//!
//! Loads agent configurations from Markdown files with YAML front matter.
//!
//! File format:
//! ```markdown
//! ---
//! name: office-general
//! mode: primary
//! description: 通用办公助手
//! permission:
//!   department: ask
//!   document: allow
//! ---
//!
//! # Agent Prompt
//!
//! This is the agent's system prompt...
//! ```

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tracing;

/// Configuration for a single agent
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    /// Agent name (unique identifier)
    pub name: String,
    /// Agent mode: "primary" or "subagent"
    pub mode: String,
    /// Human-readable description
    pub description: String,
    /// System prompt / instructions (Markdown body after front matter)
    pub prompt: String,
    /// List of skills
    #[serde(default)]
    pub skills: Vec<String>,
    /// List of tools
    #[serde(default)]
    pub tools: Vec<String>,
    /// List of MCP tools
    #[serde(default)]
    pub mcp_tools: Vec<String>,
    /// Permission ruleset (operation -> pattern -> action)
    #[serde(default)]
    pub permissions: HashMap<String, HashMap<String, String>>,
    /// Additional options
    #[serde(default)]
    pub options: HashMap<String, serde_json::Value>,
}

/// YAML front matter metadata (subset of AgentConfig)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct YamlFrontMatter {
    name: String,
    mode: String,
    description: String,
    #[serde(default)]
    skills: Vec<String>,
    #[serde(default)]
    tools: Vec<String>,
    #[serde(default)]
    mcp_tools: Vec<String>,
    #[serde(default)]
    permissions: HashMap<String, HashMap<String, String>>,
    #[serde(default)]
    options: HashMap<String, serde_json::Value>,
}

impl From<YamlFrontMatter> for AgentConfig {
    fn from(yaml: YamlFrontMatter) -> Self {
        Self {
            name: yaml.name,
            mode: yaml.mode,
            description: yaml.description,
            prompt: String::new(), // Will be set separately
            skills: yaml.skills,
            tools: yaml.tools,
            mcp_tools: yaml.mcp_tools,
            permissions: yaml.permissions,
            options: yaml.options,
        }
    }
}

/// Errors that can occur when loading agent configurations
#[derive(Debug, thiserror::Error)]
pub enum ConfigLoadError {
    #[error("Failed to read file: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Failed to parse YAML: {0}")]
    YamlError(#[from] serde_yaml::Error),
    #[error("Invalid front matter format: missing required field '{0}'")]
    MissingField(String),
    #[error("Invalid mode '{0}', expected 'primary' or 'subagent'")]
    InvalidMode(String),
    #[error("No markdown content found after front matter")]
    NoContent,
}

/// Agent configuration loader
#[derive(Debug, Clone, Default)]
pub struct AgentConfigLoader;

impl AgentConfigLoader {
    /// Create a new loader
    pub fn new() -> Self {
        Self
    }

    /// Load all agent configurations from a directory
    ///
    /// Scans the directory for `.md` files and loads each one.
    pub fn load_all(&self, dir: &Path) -> Result<Vec<AgentConfig>, ConfigLoadError> {
        let mut configs = Vec::new();

        if !dir.is_dir() {
            return Err(ConfigLoadError::IoError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Directory not found: {:?}", dir),
            )));
        }

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("md") {
                match self.load_file(&path) {
                    Ok(config) => configs.push(config),
                    Err(e) => {
                        tracing::warn!("Failed to load {:?}: {}", path, e);
                    }
                }
            }
        }

        Ok(configs)
    }

    /// Load a single agent configuration from a file
    pub fn load_file(&self, path: &Path) -> Result<AgentConfig, ConfigLoadError> {
        let content = fs::read_to_string(path)?;

        // Parse front matter and body
        let (yaml_content, markdown_body) = Self::split_front_matter(&content)?;

        // Parse YAML front matter
        let yaml: YamlFrontMatter = serde_yaml::from_str(&yaml_content)?;

        // Validate required fields
        if yaml.name.is_empty() {
            return Err(ConfigLoadError::MissingField("name".to_string()));
        }

        // Validate mode
        if yaml.mode != "primary" && yaml.mode != "subagent" {
            return Err(ConfigLoadError::InvalidMode(yaml.mode));
        }

        // Build config
        let mut config: AgentConfig = yaml.into();
        config.prompt = markdown_body.trim().to_string();

        // Validate
        self.validate(&config)?;

        Ok(config)
    }

    /// Split content into YAML front matter and Markdown body
    fn split_front_matter(content: &str) -> Result<(String, String), ConfigLoadError> {
        let content = content.trim();

        // Must start with ---
        if !content.starts_with("---") {
            return Err(ConfigLoadError::MissingField("front matter delimiter".to_string()));
        }

        // Find the closing ---
        let after_first_dash = &content[3..];
        let closing_marker = after_first_dash
            .find("---")
            .ok_or_else(|| ConfigLoadError::MissingField("closing ---".to_string()))?;

        let yaml_content = after_first_dash[..closing_marker].trim().to_string();
        let markdown_body = after_first_dash[closing_marker + 3..].to_string();

        Ok((yaml_content, markdown_body))
    }

    /// Validate agent configuration
    fn validate(&self, config: &AgentConfig) -> Result<(), ConfigLoadError> {
        // Name should be valid identifier (alphanumeric, underscore, hyphen)
        if !config.name.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
            return Err(ConfigLoadError::MissingField(
                "name must be alphanumeric with underscores/hyphens".to_string(),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_front_matter() {
        let content = r#"---
name: test-agent
mode: primary
---
# Prompt"#;

        let (yaml, body) = AgentConfigLoader.split_front_matter(content).unwrap();
        assert_eq!(yaml, "name: test-agent\nmode: primary");
        assert_eq!(body.trim(), "# Prompt");
    }

    #[test]
    fn test_parse_config() {
        let content = r#"---
name: office-general
mode: primary
description: 通用办公助手
skills:
  - conversation
  - search
tools:
  - department_query
permissions:
  department:
    "*": "ask"
---
# System Prompt"#;

        let loader = AgentConfigLoader;
        let config = loader.load_file_from_content(Path::new("test.md"), content).unwrap();

        assert_eq!(config.name, "office-general");
        assert_eq!(config.mode, "primary");
        assert_eq!(config.skills, vec!["conversation", "search"]);
        assert_eq!(config.tools, vec!["department_query"]);
    }

    #[test]
    fn test_invalid_mode() {
        let content = r#"---
name: test-agent
mode: invalid
---
# Prompt"#;

        let loader = AgentConfigLoader;
        let result = loader.load_file_from_content(Path::new("test.md"), content);
        assert!(matches!(result, Err(ConfigLoadError::InvalidMode(_))));
    }

    // Helper method for testing
    impl AgentConfigLoader {
        fn load_file_from_content(&self, path: &Path, content: &str) -> Result<AgentConfig, ConfigLoadError> {
            use std::io::Write;

            // Create temp file
            let mut temp = std::env::temp_dir();
            temp.push("agent_config_test.md");

            let mut file = fs::File::create(&temp)?;
            file.write_all(content.as_bytes())?;
            drop(file);

            let result = self.load_file(&temp);
            let _ = fs::remove_file(temp);
            result
        }
    }
}
