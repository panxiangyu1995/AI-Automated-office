//! SKILL.md parser module.

mod parser;

pub use parser::SkillParser;

use super::{Skill, SkillError};
use std::path::Path;

/// Parser for SKILL.md files
#[async_trait::async_trait]
pub trait SkillParserTrait: Send + Sync {
    /// Parse SKILL.md content
    async fn parse(&self, content: &str) -> Result<Skill, SkillError>;

    /// Parse from file path
    async fn parse_file(&self, path: &Path) -> Result<Skill, SkillError>;
}
