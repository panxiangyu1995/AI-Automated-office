//! Skill registry module.

mod registry;

pub use registry::SkillRegistry;

use async_trait::async_trait;

use super::{SkillError, SkillExecutionContext, SkillExecutionResult};

/// Skill executor trait
#[async_trait]
pub trait SkillExecutor: Send + Sync {
    /// Execute a skill
    async fn execute(
        &self,
        ctx: &SkillExecutionContext,
    ) -> Result<SkillExecutionResult, SkillError>;

    /// Get the skill ID this executor handles
    fn skill_id(&self) -> &str;

    /// Get the endpoint this executor handles
    fn endpoint(&self) -> &str;
}

/// Dynamic skill executor
pub struct DynamicExecutor {
    skill_id: String,
    endpoint: String,
    handler: Box<dyn Fn(&SkillExecutionContext) -> Result<SkillExecutionResult, SkillError> + Send + Sync>,
}

impl DynamicExecutor {
    /// Create a new dynamic executor
    pub fn new(
        skill_id: &str,
        endpoint: &str,
        handler: Box<dyn Fn(&SkillExecutionContext) -> Result<SkillExecutionResult, SkillError> + Send + Sync>,
    ) -> Self {
        Self {
            skill_id: skill_id.to_string(),
            endpoint: endpoint.to_string(),
            handler,
        }
    }
}

#[async_trait]
impl SkillExecutor for DynamicExecutor {
    async fn execute(
        &self,
        ctx: &SkillExecutionContext,
    ) -> Result<SkillExecutionResult, SkillError> {
        (self.handler)(ctx)
    }

    fn skill_id(&self) -> &str {
        &self.skill_id
    }

    fn endpoint(&self) -> &str {
        &self.endpoint
    }
}
