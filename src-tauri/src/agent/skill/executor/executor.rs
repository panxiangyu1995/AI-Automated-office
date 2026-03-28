//! Skill execution service.

use std::sync::Arc;
use std::time::Instant;

use tokio::sync::RwLock;

use super::{ExecutionHook, ExecutionStage};
use super::super::{SkillExecutionContext, SkillExecutionResult, SkillError};

/// Skill execution service
pub struct SkillExecutorService {
    /// Registered execution hooks
    hooks: Arc<RwLock<Vec<Arc<dyn ExecutionHook>>>>,
    /// Timeout for skill execution (ms)
    timeout_ms: u64,
}

impl SkillExecutorService {
    /// Create a new executor service
    pub fn new() -> Self {
        Self {
            hooks: Arc::new(RwLock::new(Vec::new())),
            timeout_ms: 30000, // 30 seconds default
        }
    }

    /// Set execution timeout
    pub fn with_timeout(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }

    /// Register an execution hook
    pub async fn register_hook(&self, hook: Arc<dyn ExecutionHook>) {
        let mut hooks = self.hooks.write().await;
        hooks.push(hook);
    }

    /// Execute a skill with context
    pub async fn execute(
        &self,
        ctx: &SkillExecutionContext,
        handler: impl Fn(&SkillExecutionContext) -> Result<SkillExecutionResult, SkillError> + Send + Sync + 'static,
    ) -> Result<SkillExecutionResult, SkillError> {
        // Run pre-execution hooks
        self.run_pre_hooks(ctx).await?;

        let start = Instant::now();
        let mut result = SkillExecutionResult::default();

        // Execute handler directly (handler is synchronous)
        // timeout returns Result<Result<T, E>, Elapsed>
        let exec_result = tokio::time::timeout(
            std::time::Duration::from_millis(self.timeout_ms),
            async {
                handler(ctx)
            }
        ).await;

        result.execution_time_ms = start.elapsed().as_millis() as u64;

        match exec_result {
            Ok(Ok(res)) => {
                result = res;
                result.success = true;
                self.run_post_hooks(ctx, &result).await;
            }
            Ok(Err(e)) => {
                result.success = false;
                result.error = Some(e.to_string());
                self.run_error_hooks(ctx, &e).await;
                return Err(e);
            }
            Err(_) => {
                let err = SkillError {
                    code: super::super::SkillErrorCode::ExecutionError,
                    message: format!("Execution timeout after {}ms", self.timeout_ms),
                    skill_id: Some(ctx.skill_id.clone()),
                    source: None,
                };
                result.success = false;
                result.error = Some(err.message.clone());
                self.run_error_hooks(ctx, &err).await;
                return Err(err);
            }
        }

        Ok(result)
    }

    /// Run pre-execution hooks
    async fn run_pre_hooks(&self, ctx: &SkillExecutionContext) -> Result<(), SkillError> {
        let hooks = self.hooks.read().await;
        for hook in hooks.iter() {
            hook.pre_execute(ctx)?;
        }
        Ok(())
    }

    /// Run post-execution hooks
    async fn run_post_hooks(&self, ctx: &SkillExecutionContext, result: &SkillExecutionResult) {
        let hooks = self.hooks.read().await;
        for hook in hooks.iter() {
            hook.post_execute(ctx, result);
        }
    }

    /// Run error hooks
    async fn run_error_hooks(&self, ctx: &SkillExecutionContext, error: &SkillError) {
        let hooks = self.hooks.read().await;
        for hook in hooks.iter() {
            hook.on_error(ctx, error);
        }
    }
}

impl Default for SkillExecutorService {
    fn default() -> Self {
        Self::new()
    }
}
