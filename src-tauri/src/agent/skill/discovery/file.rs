//! File-based skill discovery.

use std::path::Path;

use super::{SkillDiscoverer, super::SkillError};
use super::super::Skill;

/// File-based skill discoverer
pub struct FileDiscoverer {
    base_paths: Vec<String>,
}

impl FileDiscoverer {
    /// Create a new file discoverer
    pub fn new() -> Self {
        Self {
            base_paths: vec![
                "skills/".to_string(),
                "plugins/*/skills/".to_string(),
            ],
        }
    }

    /// Add a base path to scan
    pub fn add_path(&mut self, path: &str) {
        self.base_paths.push(path.to_string());
    }
}

impl Default for FileDiscoverer {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl SkillDiscoverer for FileDiscoverer {
    async fn discover(&self, _source: &str) -> Result<Vec<Skill>, SkillError> {
        let mut skills = Vec::new();

        for base_path in &self.base_paths {
            let path = Path::new(base_path);
            if path.exists() {
                if let Ok(entries) = glob::glob(base_path) {
                    for entry in entries.flatten() {
                        let skill_md = entry.join("SKILL.md");
                        if skill_md.exists() {
                            match self.load_skill_file(&skill_md).await {
                                Ok(skill) => skills.push(skill),
                                Err(e) => {
                                    tracing::warn!("Failed to load skill from {:?}: {}", skill_md, e);
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(skills)
    }

    fn source_type(&self) -> &str {
        "file"
    }
}

impl FileDiscoverer {
    /// Load a SKILL.md file
    async fn load_skill_file(&self, path: &Path) -> Result<Skill, SkillError> {
        use tokio::fs;

        let content = fs::read_to_string(path)
            .await
            .map_err(|e| SkillError::parse_error(&e.to_string(), path.to_str().unwrap_or("")))?;

        // Simple markdown parsing - in production would use proper markdown parser
        self.parse_skill_markdown(&content, path)
    }

    /// Parse SKILL.md markdown content
    fn parse_skill_markdown(&self, content: &str, source: &Path) -> Result<Skill, SkillError> {
        // Very simplified markdown parsing for SKILL.md
        // Real implementation would use a proper markdown parser

        let skill_dir = source.parent().unwrap_or(Path::new(""));
        let id = skill_dir
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Extract YAML frontmatter if present
        let mut skill = Skill {
            id: id.clone(),
            name: id.clone(),
            version: "1.0.0".to_string(),
            description: String::new(),
            category: super::super::SkillCategory::Custom,
            permissions: Vec::new(),
            parameters: super::super::ParametersSchema {
                required: Vec::new(),
                optional: Vec::new(),
                schema: serde_json::json!({}),
            },
            endpoints: Vec::new(),
            dependencies: Vec::new(),
            metadata: super::super::SkillMetadata {
                author: String::new(),
                tags: Vec::new(),
                icon: None,
                config_template: None,
            },
        };

        // Simple line-by-line parsing
        let mut current_section = String::new();

        for line in content.lines() {
            let line = line.trim();

            if line.starts_with('#') {
                current_section = line.trim_start_matches('#').trim().to_lowercase();
                continue;
            }

            match current_section.as_str() {
                "name" => {
                    if !line.is_empty() && skill.name == id {
                        skill.name = line.to_string();
                    }
                }
                "description" | "描述" => {
                    if !line.is_empty() {
                        if skill.description.is_empty() {
                            skill.description = line.to_string();
                        } else {
                            skill.description.push_str(" ");
                            skill.description.push_str(line);
                        }
                    }
                }
                "version" | "版本" => {
                    if !line.is_empty() && line.starts_with(|c: char| c.is_ascii_digit()) {
                        skill.version = line.to_string();
                    }
                }
                _ => {}
            }
        }

        if skill.description.is_empty() {
            skill.description = format!("Skill: {}", skill.name);
        }

        Ok(skill)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_file_discoverer_source_type() {
        let discoverer = FileDiscoverer::new();
        assert_eq!(discoverer.source_type(), "file");
    }
}
