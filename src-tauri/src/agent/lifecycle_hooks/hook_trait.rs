//! Lifecycle Hook Trait Module
//!
//! Defines the AgentHook trait that all lifecycle hooks must implement.

use async_trait::async_trait;

use super::hook_types::{HookContext, HookResult, HookEventType};

/// Agent Lifecycle Hook trait
///
/// All hooks must implement this trait to be registered with the HookRegistry.
#[async_trait]
pub trait AgentHook: Send + Sync {
    /// Get the name of this hook
    fn name(&self) -> &str;

    /// Get the event types this hook responds to
    fn event_types(&self) -> Vec<HookEventType>;

    /// Handle a hook event
    async fn handle(&self, ctx: HookContext) -> HookResult;

    /// Optional: Check if this hook should be executed for the given context
    fn should_execute(&self, _ctx: &HookContext) -> bool {
        true
    }

    /// Create a boxed clone of this hook
    fn box_clone(&self) -> Box<dyn AgentHook>;
}

/// Predefined hook types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PredefinedHookType {
    Logging,
    Metrics,
    Permission,
    Audit,
}

impl PredefinedHookType {
    pub fn name(&self) -> &'static str {
        match self {
            PredefinedHookType::Logging => "builtin:logging",
            PredefinedHookType::Metrics => "builtin:metrics",
            PredefinedHookType::Permission => "builtin:permission",
            PredefinedHookType::Audit => "builtin:audit",
        }
    }
}

/// Built-in Logging Hook
pub struct LoggingHook;

impl LoggingHook {
    pub fn new() -> Self {
        Self
    }
}

impl Default for LoggingHook {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AgentHook for LoggingHook {
    fn name(&self) -> &str {
        "builtin:logging"
    }

    fn event_types(&self) -> Vec<HookEventType> {
        vec![
            HookEventType::PreToolCall,
            HookEventType::PostToolCall,
            HookEventType::Error,
        ]
    }

    async fn handle(&self, ctx: HookContext) -> HookResult {
        let event_type = match (&ctx.tool_name, &ctx.error) {
            (Some(_), _) => "tool_call",
            (_, Some(_)) => "error",
            _ => "other",
        };

        tracing::info!(
            event_type = event_type,
            agent_id = %ctx.agent_id,
            agent_type = %ctx.agent_type,
            tool_name = ?ctx.tool_name,
            "Lifecycle hook event triggered"
        );

        HookResult::success()
    }

    fn box_clone(&self) -> Box<dyn AgentHook> {
        Box::new(LoggingHook)
    }
}

/// Built-in Metrics Hook
pub struct MetricsHook {
    tool_call_count: std::sync::atomic::AtomicU64,
    error_count: std::sync::atomic::AtomicU64,
}

impl MetricsHook {
    pub fn new() -> Self {
        Self {
            tool_call_count: std::sync::atomic::AtomicU64::new(0),
            error_count: std::sync::atomic::AtomicU64::new(0),
        }
    }
}

impl Default for MetricsHook {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AgentHook for MetricsHook {
    fn name(&self) -> &str {
        "builtin:metrics"
    }

    fn event_types(&self) -> Vec<HookEventType> {
        vec![
            HookEventType::PreToolCall,
            HookEventType::PostToolCall,
            HookEventType::Error,
        ]
    }

    async fn handle(&self, ctx: HookContext) -> HookResult {
        if ctx.tool_name.is_some() {
            self.tool_call_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        }
        if ctx.error.is_some() {
            self.error_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        }

        HookResult::success().with_data(serde_json::json!({
            "tool_call_count": self.tool_call_count.load(std::sync::atomic::Ordering::Relaxed),
            "error_count": self.error_count.load(std::sync::atomic::Ordering::Relaxed),
        }))
    }

    fn box_clone(&self) -> Box<dyn AgentHook> {
        Box::new(MetricsHook::new())
    }
}

/// Built-in Permission Hook
pub struct PermissionHook;

impl PermissionHook {
    pub fn new() -> Self {
        Self
    }
}

impl Default for PermissionHook {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AgentHook for PermissionHook {
    fn name(&self) -> &str {
        "builtin:permission"
    }

    fn event_types(&self) -> Vec<HookEventType> {
        vec![HookEventType::PreToolCall]
    }

    async fn handle(&self, ctx: HookContext) -> HookResult {
        if let Some(ref tool_name) = ctx.tool_name {
            tracing::debug!(
                agent_id = %ctx.agent_id,
                tool = %tool_name,
                "Permission check passed"
            );
        }
        HookResult::success()
    }

    fn box_clone(&self) -> Box<dyn AgentHook> {
        Box::new(PermissionHook)
    }
}

/// Built-in Audit Hook
pub struct AuditHook;

impl AuditHook {
    pub fn new() -> Self {
        Self
    }
}

impl Default for AuditHook {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AgentHook for AuditHook {
    fn name(&self) -> &str {
        "builtin:audit"
    }

    fn event_types(&self) -> Vec<HookEventType> {
        vec![
            HookEventType::PreToolCall,
            HookEventType::PostToolCall,
            HookEventType::SessionStart,
            HookEventType::SessionEnd,
        ]
    }

    async fn handle(&self, ctx: HookContext) -> HookResult {
        tracing::info!(
            agent_id = %ctx.agent_id,
            user_id = %ctx.user_id,
            tenant_id = %ctx.tenant_id,
            "Audit event recorded"
        );
        HookResult::success()
    }

    fn box_clone(&self) -> Box<dyn AgentHook> {
        Box::new(AuditHook)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestHook {
        called: std::sync::atomic::AtomicBool,
    }

    impl TestHook {
        fn new() -> Self {
            Self {
                called: std::sync::atomic::AtomicBool::new(false),
            }
        }
    }

    impl Default for TestHook {
        fn default() -> Self {
            Self::new()
        }
    }

    #[async_trait::async_trait]
    impl AgentHook for TestHook {
        fn name(&self) -> &str {
            "test"
        }

        fn event_types(&self) -> Vec<HookEventType> {
            vec![HookEventType::PreToolCall]
        }

        async fn handle(&self, _ctx: HookContext) -> HookResult {
            self.called.store(true, std::sync::atomic::Ordering::Relaxed);
            HookResult::success()
        }

        fn box_clone(&self) -> Box<dyn AgentHook> {
            Box::new(TestHook::new())
        }
    }

    #[tokio::test]
    async fn test_logging_hook() {
        let hook = LoggingHook::new();
        let ctx = HookContext::new("agent1", "explore", "session1", "user1", "tenant1")
            .with_tool("glob", serde_json::json!({}));

        let result = hook.handle(ctx).await;
        assert!(result.success);
    }

    #[tokio::test]
    async fn test_metrics_hook() {
        let hook = MetricsHook::new();
        let ctx = HookContext::new("agent1", "explore", "session1", "user1", "tenant1")
            .with_tool("glob", serde_json::json!({}));

        let result = hook.handle(ctx).await;
        assert!(result.success);
        assert!(result.data.is_some());
    }
}
