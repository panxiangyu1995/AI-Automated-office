//! Agent execution integration module.
//!
//! This module integrates all the new agent mechanisms:
//! - BuiltinAgentType system
//! - Tool filtering and permissions
//! - Lifecycle hooks
//! - Progress tracking
//! - Layered memory
//!
//! It provides a unified execution context that combines all these systems.

use std::sync::Arc;
use std::time::Instant;

use tokio::sync::RwLock;
use uuid::Uuid;

#[cfg(feature = "agent-tauri")]
use tauri::Emitter;

use crate::agent::builtin_agent::{
    builtin_agent_config::AgentConfigRegistry,
    builtin_agent_types::BuiltinAgentType,
};
use crate::agent::lifecycle_hooks::{
    HookContext, HookRegistry, LoggingHook, MetricsHook,
    PermissionHook,
};
use crate::agent::progress_tracking::ProgressTracker;
use crate::agent::layered_memory::{LayeredMemory, MemoryFileEntry, MemoryScope};

/// Integrated execution context for the main agent
pub struct AgentExecutionContext {
    /// Task ID for progress tracking
    pub task_id: Uuid,
    /// Agent type
    pub agent_type: BuiltinAgentType,
    /// Session ID
    pub session_id: String,
    /// User ID
    pub user_id: String,
    /// Project ID
    pub project_id: String,
    /// Tenant ID
    pub tenant_id: String,
    /// Progress tracker
    pub progress_tracker: ProgressTracker,
    /// Hook registry
    pub hook_registry: HookRegistry,
    /// Layered memory
    pub layered_memory: Arc<RwLock<LayeredMemory>>,
    /// Agent config registry
    pub config_registry: Arc<AgentConfigRegistry>,
    /// Execution start time
    pub started_at: Instant,
}

impl AgentExecutionContext {
    /// Create a new execution context
    pub fn new(
        session_id: String,
        user_id: String,
        project_id: String,
        tenant_id: String,
        agent_type: BuiltinAgentType,
    ) -> Self {
        let task_id = Uuid::new_v4();

        Self {
            task_id,
            agent_type,
            session_id,
            user_id,
            project_id,
            tenant_id,
            progress_tracker: ProgressTracker::new(),
            hook_registry: HookRegistry::new(),
            layered_memory: Arc::new(RwLock::new(LayeredMemory::new(
                dirs::home_dir().unwrap_or_default(),
                std::env::current_dir().unwrap_or_default(),
            ))),
            config_registry: Arc::new(AgentConfigRegistry::new()),
            started_at: Instant::now(),
        }
    }

    /// Start tracking a task
    pub async fn start_task(&self, max_turns: usize) {
        self.progress_tracker.start_task(self.task_id, max_turns).await;
    }

    /// Record a tool call with hooks and progress
    pub async fn record_tool_call(
        &self,
        tool_name: &str,
        params: &serde_json::Value,
        result: &Result<serde_json::Value, String>,
        duration_ms: u64,
    ) -> bool {
        let success = result.is_ok();
        let error_msg = result.as_ref().err().cloned();

        // Create hook context
        let hook_ctx = HookContext::new(
            &self.task_id.to_string(),
            &self.agent_type.to_string(),
            &self.session_id,
            &self.user_id,
            &self.tenant_id,
        )
        .with_tool(tool_name, params.clone())
        .with_metadata("duration_ms", serde_json::json!(duration_ms));

        // Add result/error info
        let hook_ctx = match result {
            Ok(result) => hook_ctx.with_result(result.clone()),
            Err(err) => hook_ctx.with_error(err),
        };

        // Execute pre-tool hooks
        let pre_results = self.hook_registry.dispatch(hook_ctx.clone()).await;

        // Check if any hook blocked the execution
        let continue_execution = pre_results.iter().all(|r| r.continue_execution);
        if !continue_execution {
            return false;
        }

        // Record to progress tracker
        self.progress_tracker
            .record_tool_call(self.task_id, tool_name, duration_ms, success)
            .await;

        // Execute post-tool hooks with result
        let post_ctx = hook_ctx.with_result(
            result.as_ref().ok()
                .cloned()
                .unwrap_or(serde_json::Value::Null)
        );

        self.hook_registry.dispatch(post_ctx).await;

        true
    }

    /// Record token usage
    pub async fn record_token_usage(&self, input_tokens: u64, output_tokens: u64) {
        self.progress_tracker
            .add_token_usage(self.task_id, input_tokens, output_tokens)
            .await;
    }

    /// Increment turn counter
    pub async fn increment_turn(&self) {
        self.progress_tracker.increment_turn(self.task_id).await;
    }

    /// Update activity description
    pub async fn update_activity(&self, description: &str) {
        self.progress_tracker
            .update_activity(self.task_id, description)
            .await;
    }

    /// Check if tool is allowed for current agent type
    pub fn is_tool_allowed(&self, tool_name: &str) -> bool {
        if let Some(config) = self.config_registry.get(&self.agent_type) {
            config.is_tool_allowed(tool_name)
        } else {
            true // Default allow if no config
        }
    }

    /// Save memory to layered memory
    pub async fn save_memory(
        &self,
        scope: MemoryScope,
        name: &str,
        content: String,
    ) -> std::io::Result<()> {
        let entry = MemoryFileEntry::with_scope(content, scope);
        let memory = self.layered_memory.read().await;
        memory.add_entry(scope, name, entry).await
    }

    /// Build memory prompt from all layers
    pub async fn build_memory_prompt(&self) -> String {
        let memory = self.layered_memory.read().await;
        memory
            .build_memory_prompt(&self.user_id, &self.project_id, &self.session_id)
            .await
    }

    /// Complete the task
    pub async fn complete_task(&self) -> Option<crate::agent::progress_tracking::TaskMetrics> {
        self.progress_tracker.complete_task(self.task_id).await
    }

    /// Fail the task
    pub async fn fail_task(&self, error: &str) -> Option<crate::agent::progress_tracking::TaskMetrics> {
        self.progress_tracker.fail_task(self.task_id, error).await
    }

    /// Cancel the task
    pub async fn cancel_task(&self) {
        self.progress_tracker.cancel_task(self.task_id).await;
    }

    /// Get current progress
    pub async fn get_progress(
        &self,
    ) -> Option<crate::agent::progress_tracking::ProgressUpdate> {
        self.progress_tracker.get_progress(self.task_id).await
    }

    /// Subscribe to progress updates
    pub fn subscribe_progress(&self) -> tokio::sync::broadcast::Receiver<crate::agent::progress_tracking::ProgressUpdate> {
        self.progress_tracker.subscribe_channel()
    }
}

/// Extension trait for integrating hooks with existing execution
#[async_trait::async_trait]
pub trait HookIntegration {
    async fn setup_builtin_hooks(&self);
}

#[async_trait::async_trait]
impl HookIntegration for HookRegistry {
    async fn setup_builtin_hooks(&self) {
        // Add logging hook
        let config = crate::agent::lifecycle_hooks::HookConfig::new("builtin:logging");
        self.register(LoggingHook::new(), config).await;

        // Add metrics hook
        let config = crate::agent::lifecycle_hooks::HookConfig::new("builtin:metrics");
        self.register(MetricsHook::new(), config).await;

        // Add permission hook
        let config = crate::agent::lifecycle_hooks::HookConfig::new("builtin:permission");
        self.register(PermissionHook::new(), config).await;
    }
}

/// Progress streaming adapter for Tauri events
#[cfg(feature = "agent-tauri")]
pub mod progress_stream {
    use super::*;

    /// Start streaming progress to a Tauri event emitter
    pub async fn start_progress_stream(
        tracker: &ProgressTracker,
        session_id: String,
        window: tauri::Window,
    ) {
        let mut receiver = tracker.subscribe_channel();

        while let Ok(progress) = receiver.recv().await {
            let payload = serde_json::json!({
                "session_id": session_id,
                "progress": progress,
            });

            if let Err(e) = window.emit("agent-progress", payload) {
                tracing::warn!("Failed to emit progress event: {:?}", e);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(feature = "agent-tauri")]
    use crate::agent::progress_tracking::ProgressTaskStatus;

    #[tokio::test]
    async fn test_execution_context_creation() {
        let ctx = AgentExecutionContext::new(
            "session-1".to_string(),
            "user-1".to_string(),
            "project-1".to_string(),
            "tenant-1".to_string(),
            BuiltinAgentType::GeneralPurpose,
        );

        assert_eq!(ctx.agent_type, BuiltinAgentType::GeneralPurpose);
        assert_eq!(ctx.session_id, "session-1");
    }

    #[tokio::test]
    async fn test_task_tracking() {
        let ctx = AgentExecutionContext::new(
            "session-1".to_string(),
            "user-1".to_string(),
            "project-1".to_string(),
            "tenant-1".to_string(),
            BuiltinAgentType::Explore,
        );

        ctx.start_task(10).await;

        let progress = ctx.get_progress().await;
        assert!(progress.is_some());
        let p = progress.unwrap();
        assert_eq!(p.status, ProgressTaskStatus::Running);
        assert_eq!(p.max_turns, 10);
    }

    #[tokio::test]
    async fn test_tool_filtering() {
        let ctx = AgentExecutionContext::new(
            "session-1".to_string(),
            "user-1".to_string(),
            "project-1".to_string(),
            "tenant-1".to_string(),
            BuiltinAgentType::Explore,
        );

        // Explore type should not allow write tools
        assert!(ctx.is_tool_allowed("search_code"));
        assert!(!ctx.is_tool_allowed("fs_write")); // Write tools not allowed for Explore
    }

    #[tokio::test]
    async fn test_complete_task() {
        let ctx = AgentExecutionContext::new(
            "session-1".to_string(),
            "user-1".to_string(),
            "project-1".to_string(),
            "tenant-1".to_string(),
            BuiltinAgentType::GeneralPurpose,
        );

        ctx.start_task(10).await;
        ctx.increment_turn().await;

        let metrics = ctx.complete_task().await;
        assert!(metrics.is_some());
        let m = metrics.unwrap();
        assert!(m.success);
        assert_eq!(m.turns, 1);
    }

    #[tokio::test]
    async fn test_fail_task() {
        let ctx = AgentExecutionContext::new(
            "session-1".to_string(),
            "user-1".to_string(),
            "project-1".to_string(),
            "tenant-1".to_string(),
            BuiltinAgentType::GeneralPurpose,
        );

        ctx.start_task(10).await;

        let metrics = ctx.fail_task("Test error").await;
        assert!(metrics.is_some());
        let m = metrics.unwrap();
        assert!(!m.success);
    }
}
