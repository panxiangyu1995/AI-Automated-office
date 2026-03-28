//! Skill loader module.

mod loader;

pub use loader::SkillLoader;

use super::{
    SkillError, SkillLoadResult, LoadingProgress,
};
use std::path::Path;

/// Skill loader trait
#[async_trait::async_trait]
pub trait SkillLoaderTrait: Send + Sync {
    /// Load a skill from path
    async fn load(&self, path: &Path) -> Result<SkillLoadResult, SkillError>;

    /// Get loading progress
    async fn progress(&self) -> LoadingProgress;
}
