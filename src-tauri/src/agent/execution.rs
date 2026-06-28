//! Sub-Agent Execution Module
//!
//! This module implements:
//! - Isolated execution context for Sub-Agent calls
//! - Memory scope isolation and management
//! - Tool filtering based on permissions
//! - Permission inheritance with shrinkage
//! - Link back to main trace
//!
//! Story 52.2 - Sub-Agent execution context and isolation

use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Memory scope for Sub-Agent
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MemoryScope {
    Private,  // Sub-Agent's own isolated memory
    Shared,   // Shared with main agent
}

impl std::fmt::Display for MemoryScope {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MemoryScope::Private => write!(f, "private"),
            MemoryScope::Shared => write!(f, "shared"),
        }
    }
}

/// Tool permission
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ToolPermission {
    Allowed,
    Denied,
    ReadOnly,
}

impl std::fmt::Display for ToolPermission {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ToolPermission::Allowed => write!(f, "allowed"),
            ToolPermission::Denied => write!(f, "denied"),
            ToolPermission::ReadOnly => write!(f, "read_only"),
        }
    }
}

/// Tool access rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolAccessRule {
    pub tool_pattern: String,
    pub permission: ToolPermission,
    pub reason: Option<String>,
}

/// Memory entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub scope: MemoryScope,
    pub created_at: i64,
    pub expires_at: Option<i64>,
}

/// Sub-Agent execution context (enhanced from routing.rs)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentContext {
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub parent_trace_id: String,
    pub session_id: String,
    pub execution_id: String,
    pub original_input: String,
    pub memory_scope: MemoryScope,
    pub tool_rules: Vec<ToolAccessRule>,
    pub permission_level: String,
    pub max_steps: i32,
    pub timeout_seconds: i32,
    pub created_at: i64,
    pub metadata: Option<serde_json::Value>,
}

/// Sub-Agent call record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentCallRecord {
    pub id: String,
    pub execution_id: String,
    pub parent_trace_id: String,
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub status: SubAgentStatus,
    pub steps_used: i32,
    pub memory_entries: Vec<String>,
    pub tools_used: Vec<String>,
    pub tools_denied: Vec<String>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub error: Option<String>,
}

/// Sub-Agent status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SubAgentStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Timeout,
    Cancelled,
}

impl std::fmt::Display for SubAgentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SubAgentStatus::Pending => write!(f, "pending"),
            SubAgentStatus::Running => write!(f, "running"),
            SubAgentStatus::Completed => write!(f, "completed"),
            SubAgentStatus::Failed => write!(f, "failed"),
            SubAgentStatus::Timeout => write!(f, "timeout"),
            SubAgentStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Main agent context projection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MainAgentProjection {
    pub session_id: String,
    pub trace_id: String,
    pub user_id: String,
    pub tenant_id: String,
    pub available_tools: Vec<String>,
    pub permission_level: String,
    pub context_summary: String,
    pub memory_snapshot: Vec<MemoryEntry>,
}

/// Execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub execution_id: String,
    pub sub_agent_id: String,
    pub status: SubAgentStatus,
    pub output: Option<String>,
    pub steps_used: i32,
    pub tools_used: Vec<String>,
    pub tools_denied: Vec<String>,
    pub memory_summary: Vec<MemoryEntry>,
    pub error: Option<String>,
    pub duration_ms: i64,
}

/// Sub-Agent execution service
#[derive(Clone)]
pub struct SubAgentExecutionService {
    active_contexts: Arc<RwLock<HashMap<String, SubAgentContext>>>,
    call_records: Arc<RwLock<Vec<SubAgentCallRecord>>>,
    memory_store: Arc<RwLock<HashMap<String, Vec<MemoryEntry>>>>,
}

impl SubAgentExecutionService {
    pub fn new() -> Self {
        Self {
            active_contexts: Arc::new(RwLock::new(HashMap::new())),
            call_records: Arc::new(RwLock::new(Vec::new())),
            memory_store: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Create isolated execution context from routing context
    pub async fn create_context(
        &self,
        sub_agent_id: &str,
        sub_agent_name: &str,
        parent_trace_id: &str,
        session_id: &str,
        original_input: &str,
        projection: &MainAgentProjection,
        constraints: Option<ExecutionConstraints>,
    ) -> Result<SubAgentContext> {
        let execution_id = Self::generate_id("exec");

        // Default constraints
        let constraints = constraints.unwrap_or(ExecutionConstraints {
            max_steps: 10,
            timeout_seconds: 300,
            memory_scope: MemoryScope::Shared,
            tool_rules: vec![],
            permission_level: projection.permission_level.clone(),
        });

        // Build tool rules - inherit from parent but apply shrinkage
        let tool_rules = self.build_tool_rules(&projection, &constraints);

        // Create context
        let context = SubAgentContext {
            sub_agent_id: sub_agent_id.to_string(),
            sub_agent_name: sub_agent_name.to_string(),
            parent_trace_id: parent_trace_id.to_string(),
            session_id: session_id.to_string(),
            execution_id: execution_id.clone(),
            original_input: original_input.to_string(),
            memory_scope: constraints.memory_scope.clone(),
            tool_rules,
            permission_level: constraints.permission_level.clone(),
            max_steps: constraints.max_steps,
            timeout_seconds: constraints.timeout_seconds,
            created_at: Utc::now().timestamp(),
            metadata: None,
        };

        // Store context
        {
            let mut contexts = self.active_contexts.write().await;
            contexts.insert(execution_id.clone(), context.clone());
        }

        // Create call record
        self.create_call_record(&context).await?;

        // Initialize memory store
        {
            let mut memory = self.memory_store.write().await;
            memory.insert(execution_id.clone(), Vec::new());
        }

        Ok(context)
    }

    /// Build tool rules with permission inheritance/shrinkage
    fn build_tool_rules(
        &self,
        projection: &MainAgentProjection,
        constraints: &ExecutionConstraints,
    ) -> Vec<ToolAccessRule> {
        let mut rules = Vec::new();

        // Inherit available tools as allowed
        for tool in &projection.available_tools {
            rules.push(ToolAccessRule {
                tool_pattern: tool.clone(),
                permission: ToolPermission::Allowed,
                reason: Some("Inherited from main agent".to_string()),
            });
        }

        // Apply constraint-based restrictions
        for rule in &constraints.tool_rules {
            if let Some(existing) = rules.iter_mut().find(|r| r.tool_pattern == rule.tool_pattern) {
                // Shrink permission if needed
                existing.permission = Self::shrink_permission(&existing.permission, &rule.permission);
                existing.reason = rule.reason.clone();
            } else {
                rules.push(rule.clone());
            }
        }

        // Default deny for tools not explicitly listed
        rules.push(ToolAccessRule {
            tool_pattern: "*".to_string(),
            permission: ToolPermission::Denied,
            reason: Some("Default deny for safety".to_string()),
        });

        rules
    }

    /// Shrink permission level (permissions can only go down)
    fn shrink_permission(parent: &ToolPermission, requested: &ToolPermission) -> ToolPermission {
        match (parent, requested) {
            // If parent is denied, stay denied
            (ToolPermission::Denied, _) => ToolPermission::Denied,
            // If parent is read-only, stay read-only
            (ToolPermission::ReadOnly, _) => ToolPermission::ReadOnly,
            // If requested is denied, deny
            (_, ToolPermission::Denied) => ToolPermission::Denied,
            // If requested is read-only, downgrade
            (_, ToolPermission::ReadOnly) => ToolPermission::ReadOnly,
            // Otherwise keep parent's permission
            _ => parent.clone(),
        }
    }

    /// Create call record
    async fn create_call_record(&self, context: &SubAgentContext) -> Result<()> {
        let record = SubAgentCallRecord {
            id: Self::generate_id("call"),
            execution_id: context.execution_id.clone(),
            parent_trace_id: context.parent_trace_id.clone(),
            sub_agent_id: context.sub_agent_id.clone(),
            sub_agent_name: context.sub_agent_name.clone(),
            status: SubAgentStatus::Pending,
            steps_used: 0,
            memory_entries: Vec::new(),
            tools_used: Vec::new(),
            tools_denied: Vec::new(),
            created_at: Utc::now().timestamp(),
            completed_at: None,
            error: None,
        };

        let mut records = self.call_records.write().await;
        records.push(record);
        Ok(())
    }

    /// Get context by execution ID
    pub async fn get_context(&self, execution_id: &str) -> Option<SubAgentContext> {
        let contexts = self.active_contexts.read().await;
        contexts.get(execution_id).cloned()
    }

    /// Check tool access
    pub async fn check_tool_access(
        &self,
        execution_id: &str,
        tool_name: &str,
    ) -> ToolPermission {
        let contexts = self.active_contexts.read().await;
        if let Some(context) = contexts.get(execution_id) {
            for rule in &context.tool_rules {
                if Self::tool_matches_pattern(tool_name, &rule.tool_pattern) {
                    return rule.permission.clone();
                }
            }
        }
        // Default deny
        ToolPermission::Denied
    }

    /// Check if tool matches pattern
    fn tool_matches_pattern(tool_name: &str, pattern: &str) -> bool {
        if pattern == "*" {
            return true;
        }
        if pattern.ends_with('*') {
            let prefix = &pattern[..pattern.len() - 1];
            return tool_name.starts_with(prefix);
        }
        tool_name == pattern
    }

    /// Record tool usage
    pub async fn record_tool_usage(
        &self,
        execution_id: &str,
        tool_name: &str,
        allowed: bool,
    ) -> Result<()> {
        let mut records = self.call_records.write().await;
        if let Some(record) = records.iter_mut().find(|r| r.execution_id == execution_id) {
            if allowed {
                if !record.tools_used.contains(&tool_name.to_string()) {
                    record.tools_used.push(tool_name.to_string());
                }
            } else {
                if !record.tools_denied.contains(&tool_name.to_string()) {
                    record.tools_denied.push(tool_name.to_string());
                }
            }
        }
        Ok(())
    }

    /// Record step usage
    pub async fn record_step(&self, execution_id: &str) -> Result<bool> {
        let mut records = self.call_records.write().await;
        if let Some(record) = records.iter_mut().find(|r| r.execution_id == execution_id) {
            record.steps_used += 1;

            // Check if max steps exceeded
            let contexts = self.active_contexts.read().await;
            if let Some(context) = contexts.get(execution_id) {
                if record.steps_used >= context.max_steps {
                    record.status = SubAgentStatus::Failed;
                    record.error = Some("Max steps exceeded".to_string());
                    return Ok(false);
                }
            }
        }
        Ok(true)
    }

    /// Store memory entry
    pub async fn store_memory(
        &self,
        execution_id: &str,
        key: &str,
        value: serde_json::Value,
        scope: MemoryScope,
    ) -> Result<()> {
        let entry = MemoryEntry {
            key: key.to_string(),
            value,
            scope,
            created_at: Utc::now().timestamp(),
            expires_at: None,
        };

        let mut memory = self.memory_store.write().await;
        if let Some(entries) = memory.get_mut(execution_id) {
            entries.push(entry);
        }

        // Update call record
        let mut records = self.call_records.write().await;
        if let Some(record) = records.iter_mut().find(|r| r.execution_id == execution_id) {
            record.memory_entries.push(key.to_string());
        }

        Ok(())
    }

    /// Get memory entries
    pub async fn get_memory(&self, execution_id: &str) -> Vec<MemoryEntry> {
        let memory = self.memory_store.read().await;
        memory.get(execution_id).cloned().unwrap_or_default()
    }

    /// Complete execution
    pub async fn complete_execution(
        &self,
        execution_id: &str,
        status: SubAgentStatus,
        _output: Option<String>,
        error: Option<String>,
    ) -> Result<()> {
        // Update context
        {
            let mut contexts = self.active_contexts.write().await;
            contexts.remove(execution_id);
        }

        // Update call record
        let mut records = self.call_records.write().await;
        if let Some(record) = records.iter_mut().find(|r| r.execution_id == execution_id) {
            record.status = status;
            record.completed_at = Some(Utc::now().timestamp());
            record.error = error;
        }

        Ok(())
    }

    /// Get call records by parent trace
    pub async fn get_calls_by_parent_trace(&self, parent_trace_id: &str) -> Vec<SubAgentCallRecord> {
        let records = self.call_records.read().await;
        records
            .iter()
            .filter(|r| r.parent_trace_id == parent_trace_id)
            .cloned()
            .collect()
    }

    /// Get call records by session
    pub async fn get_calls_by_session(&self, session_id: &str) -> Vec<SubAgentCallRecord> {
        let contexts = self.active_contexts.read().await;
        let session_contexts: Vec<String> = contexts
            .values()
            .filter(|c| c.session_id == session_id)
            .map(|c| c.execution_id.clone())
            .collect();

        let records = self.call_records.read().await;
        records
            .iter()
            .filter(|r| session_contexts.contains(&r.execution_id))
            .cloned()
            .collect()
    }

    /// Project main agent context into isolated form
    pub fn project_main_context(
        &self,
        session_id: &str,
        trace_id: &str,
        user_id: &str,
        tenant_id: &str,
        available_tools: Vec<String>,
        permission_level: &str,
        context_summary: &str,
    ) -> MainAgentProjection {
        MainAgentProjection {
            session_id: session_id.to_string(),
            trace_id: trace_id.to_string(),
            user_id: user_id.to_string(),
            tenant_id: tenant_id.to_string(),
            available_tools,
            permission_level: permission_level.to_string(),
            context_summary: context_summary.to_string(),
            memory_snapshot: Vec::new(),
        }
    }
}

/// Execution constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionConstraints {
    pub max_steps: i32,
    pub timeout_seconds: i32,
    pub memory_scope: MemoryScope,
    pub tool_rules: Vec<ToolAccessRule>,
    pub permission_level: String,
}

impl Default for ExecutionConstraints {
    fn default() -> Self {
        Self {
            max_steps: 10,
            timeout_seconds: 300,
            memory_scope: MemoryScope::Shared,
            tool_rules: Vec::new(),
            permission_level: "read_only".to_string(),
        }
    }
}

impl Default for SubAgentExecutionService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_scope_display() {
        assert_eq!(MemoryScope::Private.to_string(), "private");
        assert_eq!(MemoryScope::Shared.to_string(), "shared");
    }

    #[test]
    fn test_tool_permission_display() {
        assert_eq!(ToolPermission::Allowed.to_string(), "allowed");
        assert_eq!(ToolPermission::Denied.to_string(), "denied");
        assert_eq!(ToolPermission::ReadOnly.to_string(), "read_only");
    }

    #[test]
    fn test_sub_agent_status_display() {
        assert_eq!(SubAgentStatus::Pending.to_string(), "pending");
        assert_eq!(SubAgentStatus::Running.to_string(), "running");
        assert_eq!(SubAgentStatus::Completed.to_string(), "completed");
        assert_eq!(SubAgentStatus::Failed.to_string(), "failed");
    }

    #[test]
    fn test_tool_matches_pattern() {
        assert!(SubAgentExecutionService::tool_matches_pattern("fs_read", "fs_*"));
        assert!(SubAgentExecutionService::tool_matches_pattern("fs_read", "fs_read"));
        assert!(SubAgentExecutionService::tool_matches_pattern("any_tool", "*"));
        assert!(!SubAgentExecutionService::tool_matches_pattern("http_get", "fs_*"));
    }

    #[test]
    fn test_shrink_permission() {
        // Parent Allowed
        assert_eq!(
            SubAgentExecutionService::shrink_permission(&ToolPermission::Allowed, &ToolPermission::Allowed),
            ToolPermission::Allowed
        );
        assert_eq!(
            SubAgentExecutionService::shrink_permission(&ToolPermission::Allowed, &ToolPermission::ReadOnly),
            ToolPermission::ReadOnly
        );
        assert_eq!(
            SubAgentExecutionService::shrink_permission(&ToolPermission::Allowed, &ToolPermission::Denied),
            ToolPermission::Denied
        );
        // Parent ReadOnly stays ReadOnly
        assert_eq!(
            SubAgentExecutionService::shrink_permission(&ToolPermission::ReadOnly, &ToolPermission::Allowed),
            ToolPermission::ReadOnly
        );
        // Parent Denied stays Denied
        assert_eq!(
            SubAgentExecutionService::shrink_permission(&ToolPermission::Denied, &ToolPermission::Allowed),
            ToolPermission::Denied
        );
    }

    #[tokio::test]
    async fn test_create_and_get_context() {
        let service = SubAgentExecutionService::new();
        let projection = MainAgentProjection {
            session_id: "test_session".to_string(),
            trace_id: "test_trace".to_string(),
            user_id: "test_user".to_string(),
            tenant_id: "test_tenant".to_string(),
            available_tools: vec!["fs_read".to_string(), "http_get".to_string()],
            permission_level: "read_write".to_string(),
            context_summary: "Test context".to_string(),
            memory_snapshot: Vec::new(),
        };

        let context = service
            .create_context(
                "subagent_001",
                "文档助手",
                "parent_trace",
                "test_session",
                "帮我起草文档",
                &projection,
                None,
            )
            .await
            .unwrap();

        assert_eq!(context.sub_agent_id, "subagent_001");
        assert_eq!(context.permission_level, "read_write");

        // Check tool access
        let access = service.check_tool_access(&context.execution_id, "fs_read").await;
        assert_eq!(access, ToolPermission::Allowed);
    }
}
