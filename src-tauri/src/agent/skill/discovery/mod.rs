//! Skill discovery module.

mod discovery;

pub use discovery::SkillDiscoveryService;

use super::{Skill, SkillDiscoveryResult, SkillError};

/// Skill discoverer trait
#[async_trait::async_trait]
pub trait SkillDiscoverer: Send + Sync {
    /// Discover skills from a source
    async fn discover(&self, source: &str) -> Result<Vec<Skill>, SkillError>;

    /// Get the source type
    fn source_type(&self) -> &str;
}

/// File-based skill discoverer
pub mod file;
/// Plugin-based skill discoverer
pub mod plugin;
