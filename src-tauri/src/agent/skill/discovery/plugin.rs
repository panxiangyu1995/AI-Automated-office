//! Plugin-based skill discovery.

use super::{SkillDiscoverer, super::SkillError};
use super::super::Skill;

/// Plugin-based skill discoverer
pub struct PluginDiscoverer;

impl PluginDiscoverer {
    /// Create a new plugin discoverer
    pub fn new() -> Self {
        Self
    }
}

impl Default for PluginDiscoverer {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl SkillDiscoverer for PluginDiscoverer {
    async fn discover(&self, _source: &str) -> Result<Vec<Skill>, SkillError> {
        // Skills from plugins would be discovered through the plugin system
        // This is a placeholder that returns empty - actual implementation
        // would query the plugin registry for skills
        Ok(Vec::new())
    }

    fn source_type(&self) -> &str {
        "plugin"
    }
}
