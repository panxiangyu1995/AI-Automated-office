//! Delegation Executor
//!
//! Executes delegated tasks to subagents with:
//! - Timeout management
//! - Error handling
//! - Session lifecycle management

use std::time::Duration;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::RouteDecision;

/// Execution errors
#[derive(Error, Debug)]
pub enum ExecutionError {
    #[error("Session creation failed: {0}")]
    SessionCreationFailed(String),
    
    #[error("Execution failed: {0}")]
    ExecutionFailed(String),
    
    #[error("Timeout after {0:?}")]
    Timeout(Duration),
    
    #[error("Cleanup failed: {0}")]
    CleanupFailed(String),
}

/// Delegation context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationContext {
    /// Original user message
    pub original_message: String,
    /// Session ID of parent
    pub parent_session_id: String,
    /// Intent type
    pub intent: String,
    /// Additional context data
    pub context_data: serde_json::Value,
}

impl DelegationContext {
    /// Create a new delegation context
    pub fn new(original_message: String, parent_session_id: String, intent: String) -> Self {
        Self {
            original_message,
            parent_session_id,
            intent,
            context_data: serde_json::json!({}),
        }
    }

    /// Add context data
    pub fn with_data(mut self, key: String, value: serde_json::Value) -> Self {
        self.context_data[key] = value;
        self
    }
}

/// Subagent execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentResult {
    /// Whether execution was successful
    pub success: bool,
    /// Output content
    pub content: String,
    /// Error message (if failed)
    pub error: Option<String>,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
    /// Number of tool calls
    pub tool_calls: u32,
    /// Output format
    pub format: OutputFormat,
}

impl SubagentResult {
    /// Create a successful result
    pub fn success(content: String, duration_ms: u64, tool_calls: u32) -> Self {
        Self {
            success: true,
            content,
            error: None,
            duration_ms,
            tool_calls,
            format: OutputFormat::Text,
        }
    }

    /// Create a failed result
    pub fn failure(error: String) -> Self {
        Self {
            success: false,
            content: String::new(),
            error: Some(error),
            duration_ms: 0,
            tool_calls: 0,
            format: OutputFormat::Text,
        }
    }
}

/// Output format
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutputFormat {
    Text,
    Json,
    Markdown,
}

/// Delegation contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationContract {
    /// Delegation target
    pub target: DelegationTarget,
    /// Delegation constraints
    pub constraints: super::router::DelegationConstraints,
    /// Delegation context
    pub context: DelegationContext,
    /// Output contract
    pub output: OutputContract,
}

/// Delegation target
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationTarget {
    /// Subagent name
    pub subagent: String,
    /// Intent type
    pub intent: String,
}

/// Output contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputContract {
    /// Output format
    pub format: OutputFormat,
    /// Optional schema
    pub schema: Option<serde_json::Value>,
}

/// Delegation executor
pub struct DelegationExecutor {
    timeout: Duration,
    max_retries: u32,
}

impl DelegationExecutor {
    /// Create a new delegation executor
    pub fn new() -> Self {
        Self {
            timeout: Duration::from_secs(300), // 5 minutes default
            max_retries: 3,
        }
    }

    /// Set timeout
    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    /// Set max retries
    pub fn with_max_retries(mut self, retries: u32) -> Self {
        self.max_retries = retries;
        self
    }

    /// Execute delegation
    pub async fn execute(
        &self,
        decision: RouteDecision,
        context: DelegationContext,
    ) -> Result<SubagentResult, ExecutionError> {
        tracing::info!("Executing delegation to {:?}", decision.target);

        // 1. Build delegation contract
        let contract = self.build_contract(decision.clone(), context)?;

        // 2. Create subagent session
        let session = self.create_session(&contract).await?;

        // 3. Execute with timeout
        let result = self.execute_with_timeout(session.clone(), contract).await;

        // 4. Cleanup session
        if let Err(e) = self.cleanup_session(&session).await {
            tracing::warn!("Session cleanup failed: {}", e);
        }

        result
    }

    /// Build delegation contract
    fn build_contract(
        &self,
        decision: RouteDecision,
        context: DelegationContext,
    ) -> Result<DelegationContract, ExecutionError> {
        let target_name = decision.target_name.unwrap_or_else(|| {
            format!("{}-agent", decision.target.as_str())
        });

        Ok(DelegationContract {
            target: DelegationTarget {
                subagent: target_name,
                intent: context.intent.clone(),
            },
            constraints: decision.constraints,
            context,
            output: OutputContract {
                format: OutputFormat::Text,
                schema: None,
            },
        })
    }

    /// Create subagent session
    async fn create_session(
        &self,
        contract: &DelegationContract,
    ) -> Result<String, ExecutionError> {
        // In a real implementation, this would:
        // 1. Get the subagent from SubagentManager
        // 2. Create a new session with the contract
        // 3. Return the session ID
        
        let session_id = format!("session-{}", uuid::Uuid::new_v4());
        
        tracing::info!("Created subagent session: {} for {}", session_id, contract.target.subagent);
        
        Ok(session_id)
    }

    /// Execute with timeout
    async fn execute_with_timeout(
        &self,
        session_id: String,
        contract: DelegationContract,
    ) -> Result<SubagentResult, ExecutionError> {
        let timeout = Duration::from_secs(contract.constraints.timeout_seconds);
        
        tokio::select! {
            result = self.execute_session(session_id.clone(), contract) => {
                result
            }
            _ = tokio::time::sleep(timeout) => {
                tracing::warn!("Execution timeout for session: {}", session_id);
                Err(ExecutionError::Timeout(timeout))
            }
        }
    }

    /// Execute session (placeholder)
    async fn execute_session(
        &self,
        _session_id: String,
        contract: DelegationContract,
    ) -> Result<SubagentResult, ExecutionError> {
        // In a real implementation, this would:
        // 1. Send the message to the subagent
        // 2. Stream responses back
        // 3. Collect the final result
        
        // For now, return a placeholder result
        let start = std::time::Instant::now();
        
        // Simulate execution time
        tokio::time::sleep(Duration::from_millis(100)).await;
        
        let duration = start.elapsed();
        
        Ok(SubagentResult::success(
            format!("Delegated to {} successfully", contract.target.subagent),
            duration.as_millis() as u64,
            1,
        ))
    }

    /// Cleanup session
    async fn cleanup_session(&self, session_id: &str) -> Result<(), ExecutionError> {
        // In a real implementation, this would:
        // 1. Close any open resources
        // 2. Release any locks
        // 3. Remove session from manager
        
        tracing::info!("Cleaned up session: {}", session_id);
        
        Ok(())
    }
}

impl Default for DelegationExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execution_timeout() {
        let executor = DelegationExecutor::new()
            .with_timeout(Duration::from_millis(50));

        let decision = RouteDecision::new(SubagentType::Finance);
        let context = DelegationContext::new(
            "Test message".to_string(),
            "parent-session".to_string(),
            "test".to_string(),
        );

        // This should timeout
        let result = executor.execute(decision, context).await;
        assert!(result.is_err());
    }
}
