//! Skill registry implementation.

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use super::{SkillExecutor, super::{Skill, SkillError, SkillExecutionContext, SkillExecutionResult}};
use super::super::SkillCategory;

/// Thread-safe skill registry
pub struct SkillRegistry {
    /// Registered skills by ID
    skills: Arc<RwLock<HashMap<String, Skill>>>,
    /// Executors by "skill_id/endpoint" key
    executors: Arc<RwLock<HashMap<String, Arc<dyn SkillExecutor>>>>,
    /// Skills by category
    categories: Arc<RwLock<HashMap<String, Vec<String>>>>,
}

impl SkillRegistry {
    /// Create a new registry
    pub fn new() -> Self {
        Self {
            skills: Arc::new(RwLock::new(HashMap::new())),
            executors: Arc::new(RwLock::new(HashMap::new())),
            categories: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a skill
    pub async fn register(&self, skill: Skill) -> Result<(), SkillError> {
        let skill_id = skill.id.clone();

        // Validate skill
        self.validate_skill(&skill)?;

        // Store skill
        let mut skills = self.skills.write().await;
        skills.insert(skill_id.clone(), skill.clone());

        // Update category index
        let category_key = match &skill.category {
            SkillCategory::Core => "core",
            SkillCategory::Department(d) => d,
            SkillCategory::Plugin(p) => p,
            SkillCategory::Custom => "custom",
            SkillCategory::Integration => "integration",
        };

        let mut categories = self.categories.write().await;
        categories
            .entry(category_key.to_string())
            .or_insert_with(Vec::new)
            .push(skill_id.clone());

        tracing::info!("Registered skill: {}", skill_id);
        Ok(())
    }

    /// Register an executor for a skill endpoint
    pub async fn register_executor(&self, executor: Arc<dyn SkillExecutor>) -> Result<(), SkillError> {
        let key = format!("{}/{}", executor.skill_id(), executor.endpoint());
        let mut executors = self.executors.write().await;
        executors.insert(key, executor);
        Ok(())
    }

    /// Unregister a skill
    pub async fn unregister(&self, skill_id: &str) -> Result<(), SkillError> {
        let mut skills = self.skills.write().await;
        if skills.remove(skill_id).is_none() {
            return Err(SkillError::not_found(skill_id));
        }

        // Remove associated executors
        let mut executors = self.executors.write().await;
        executors.retain(|key, _| !key.starts_with(skill_id));

        tracing::info!("Unregistered skill: {}", skill_id);
        Ok(())
    }

    /// Get a skill by ID
    pub async fn get(&self, skill_id: &str) -> Option<Skill> {
        let skills = self.skills.read().await;
        skills.get(skill_id).cloned()
    }

    /// List all registered skills
    pub async fn list(&self) -> Vec<Skill> {
        let skills = self.skills.read().await;
        skills.values().cloned().collect()
    }

    /// List skills by category
    pub async fn list_by_category(&self, category: &str) -> Vec<Skill> {
        let categories = self.categories.read().await;
        let skills = self.skills.read().await;

        categories
            .get(category)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| skills.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Execute a skill endpoint
    pub async fn execute(
        &self,
        ctx: &SkillExecutionContext,
    ) -> Result<SkillExecutionResult, SkillError> {
        let key = format!("{}/{}", ctx.skill_id, ctx.endpoint);

        let executors = self.executors.read().await;
        let executor = executors
            .get(&key)
            .ok_or_else(|| SkillError::not_found(&key))?;

        executor.execute(ctx).await
    }

    /// Check if a skill is registered
    pub async fn contains(&self, skill_id: &str) -> bool {
        let skills = self.skills.read().await;
        skills.contains_key(skill_id)
    }

    /// Get skill count
    pub async fn count(&self) -> usize {
        let skills = self.skills.read().await;
        skills.len()
    }

    /// Validate a skill definition
    fn validate_skill(&self, skill: &Skill) -> Result<(), SkillError> {
        if skill.id.is_empty() {
            return Err(SkillError::parse_error("Skill ID cannot be empty", ""));
        }

        if skill.name.is_empty() {
            return Err(SkillError::parse_error("Skill name cannot be empty", &skill.id));
        }

        // Validate version format (semver)
        if !semver::Version::parse(&skill.version).is_ok() {
            return Err(SkillError::parse_error(
                &format!("Invalid version format: {}", skill.version),
                &skill.id,
            ));
        }

        Ok(())
    }
}

impl Default for SkillRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::types::{SkillEndpoint, SkillMetadata, ParametersSchema};

    #[tokio::test]
    async fn test_register_and_get() {
        let registry = SkillRegistry::new();

        let skill = Skill {
            id: "test-skill".to_string(),
            name: "Test Skill".to_string(),
            version: "1.0.0".to_string(),
            description: "A test skill".to_string(),
            category: SkillCategory::Custom,
            permissions: Vec::new(),
            parameters: ParametersSchema {
                required: Vec::new(),
                optional: Vec::new(),
                schema: serde_json::json!({}),
            },
            endpoints: vec![SkillEndpoint {
                name: "execute".to_string(),
                method: "POST".to_string(),
                path: "/execute".to_string(),
                handler: "execute".to_string(),
                description: "Execute the skill".to_string(),
            }],
            dependencies: Vec::new(),
            metadata: SkillMetadata {
                author: "test".to_string(),
                tags: vec!["test".to_string()],
                icon: None,
                config_template: None,
            },
        };

        registry.register(skill.clone()).await.unwrap();

        let retrieved = registry.get("test-skill").await.unwrap();
        assert_eq!(retrieved.id, "test-skill");
        assert_eq!(retrieved.name, "Test Skill");
    }

    #[tokio::test]
    async fn test_unregister() {
        let registry = SkillRegistry::new();

        let skill = Skill {
            id: "test-skill-2".to_string(),
            name: "Test Skill 2".to_string(),
            version: "1.0.0".to_string(),
            description: "A test skill".to_string(),
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
                tags: Vec::new(),
                icon: None,
                config_template: None,
            },
        };

        registry.register(skill).await.unwrap();
        assert!(registry.contains("test-skill-2").await);

        registry.unregister("test-skill-2").await.unwrap();
        assert!(!registry.contains("test-skill-2").await);
    }
}
