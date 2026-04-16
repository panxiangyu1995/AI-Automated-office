//! Skill execution module.

mod executor;
mod context;

use super::{SkillExecutionContext, SkillExecutionResult, SkillError};

/// Execution stage
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExecutionStage {
    /// Before execution
    PreExecution,
    /// Main execution
    Execution,
    /// After execution (cleanup)
    PostExecution,
}

/// Hook for execution events
pub trait ExecutionHook: Send + Sync {
    /// Called before execution
    fn pre_execute(&self, ctx: &SkillExecutionContext) -> Result<(), SkillError>;

    /// Called after execution
    fn post_execute(&self, ctx: &SkillExecutionContext, result: &SkillExecutionResult);

    /// Called on execution error
    fn on_error(&self, ctx: &SkillExecutionContext, error: &SkillError);
}
