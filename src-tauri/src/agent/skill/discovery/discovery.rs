//! Skill discovery service.

use std::sync::Arc;

use tokio::sync::RwLock;

use super::{SkillDiscoverer, file::FileDiscoverer, plugin::PluginDiscoverer};
use crate::agent::skill::{Skill, SkillDiscoveryResult, SkillError};

/// Service for discovering skills from various sources
pub struct SkillDiscoveryService {
    discoverers: Vec<Arc<dyn SkillDiscoverer>>,
    discovered_skills: Arc<RwLock<Vec<Skill>>>,
}

impl SkillDiscoveryService {
    /// Create a new discovery service
    pub fn new() -> Self {
        let mut service = Self {
            discoverers: Vec::new(),
            discovered_skills: Arc::new(RwLock::new(Vec::new())),
        };

        // Register built-in discoverers
        service.register_discoverer(Arc::new(FileDiscoverer::new()));
        service.register_discoverer(Arc::new(PluginDiscoverer::new()));

        service
    }

    /// Register a discoverer
    pub fn register_discoverer(&mut self, discoverer: Arc<dyn SkillDiscoverer>) {
        tracing::debug!("Registering skill discoverer: {}", discoverer.source_type());
        self.discoverers.push(discoverer);
    }

    /// Discover all skills from all sources
    pub async fn discover_all(&self) -> Result<SkillDiscoveryResult, SkillError> {
        let mut all_skills = Vec::new();

        for discoverer in &self.discoverers {
            match discoverer.discover(discoverer.source_type()).await {
                Ok(skills) => {
                    tracing::info!(
                        "Discovered {} skills from {}",
                        skills.len(),
                        discoverer.source_type()
                    );
                    all_skills.extend(skills);
                }
                Err(e) => {
                    tracing::warn!(
                        "Failed to discover skills from {}: {}",
                        discoverer.source_type(),
                        e
                    );
                }
            }
        }

        let total = all_skills.len();

        // Update cached skills
        let mut cached = self.discovered_skills.write().await;
        *cached = all_skills.clone();

        Ok(SkillDiscoveryResult {
            skills: all_skills,
            total,
            source: "all".to_string(),
        })
    }

    /// Discover skills from a specific source
    pub async fn discover_from(&self, source: &str) -> Result<Vec<Skill>, SkillError> {
        for discoverer in &self.discoverers {
            if discoverer.source_type() == source {
                return discoverer.discover(source).await;
            }
        }

        Err(SkillError::not_found(source))
    }

    /// Get cached discovered skills
    pub async fn get_cached(&self) -> Vec<Skill> {
        self.discovered_skills.read().await.clone()
    }

    /// Search skills by name or description
    pub async fn search(&self, query: &str) -> Vec<Skill> {
        let skills = self.discovered_skills.read().await;
        let query_lower = query.to_lowercase();

        skills
            .iter()
            .filter(|skill| {
                skill.name.to_lowercase().contains(&query_lower)
                    || skill.description.to_lowercase().contains(&query_lower)
                    || skill.metadata.tags.iter().any(|t| t.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }

    /// Get skill by ID from cache
    pub async fn get_by_id(&self, skill_id: &str) -> Option<Skill> {
        let skills = self.discovered_skills.read().await;
        skills.iter().find(|s| s.id == skill_id).cloned()
    }
}

impl Default for SkillDiscoveryService {
    fn default() -> Self {
        Self::new()
    }
}
