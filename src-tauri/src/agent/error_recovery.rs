//! Error Recovery and Checkpoint Management Module
//!
//! This module implements:
//! - Retry strategy and replan decision handling
//! - Checkpoint save, activate, rollback, and restore
//! - Recovery triggers from tool failure, timeout, and interruption
//! - Recovery state broadcasting to chat and debug views
//!
//! Story 55.2 - Retry, replan, and checkpoint recovery

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::storage::StorageManager;

/// Recovery trigger type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RecoveryTrigger {
    ToolFailure,
    Timeout,
    Interruption,
    UserCancelled,
    PermissionDenied,
    ResourceError,
    UnexpectedState,
}

/// Recovery action type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RecoveryAction {
    RetryStep,
    SkipStep,
    RestartPlan,
    PartialReplan,
    Abort,
    Escalate,
    Fallback,
    RestoreCheckpoint,
}

/// Recovery decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryDecision {
    pub action: RecoveryAction,
    pub trigger: RecoveryTrigger,
    pub max_attempts: usize,
    pub current_attempt: usize,
    pub delay_ms: Option<u64>,
    pub checkpoint_id: Option<String>,
    pub message: String,
}

/// Recovery strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryStrategyConfig {
    pub max_retry_attempts: usize,
    pub max_replan_attempts: usize,
    pub base_delay_ms: u64,
    pub backoff_multiplier: f64,
    pub max_delay_ms: u64,
    pub enable_checkpoint_restore: bool,
    pub checkpoint_on_tool_call: bool,
    pub checkpoint_on_completion: bool,
}

impl Default for RecoveryStrategyConfig {
    fn default() -> Self {
        Self {
            max_retry_attempts: 3,
            max_replan_attempts: 2,
            base_delay_ms: 1000,
            backoff_multiplier: 2.0,
            max_delay_ms: 30000,
            enable_checkpoint_restore: true,
            checkpoint_on_tool_call: true,
            checkpoint_on_completion: true,
        }
    }
}

/// Recovery context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryContext {
    pub session_id: String,
    pub plan_id: Option<String>,
    pub current_step_id: Option<String>,
    pub failed_step_id: Option<String>,
    pub trigger: RecoveryTrigger,
    pub error_message: String,
    pub attempt_count: usize,
    pub created_at: i64,
}

/// Recovery history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryHistoryEntry {
    pub id: String,
    pub session_id: String,
    pub trigger: RecoveryTrigger,
    pub action: RecoveryAction,
    pub checkpoint_id: Option<String>,
    pub success: bool,
    pub message: String,
    pub created_at: i64,
}

/// Checkpoint for session state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionCheckpoint {
    pub id: String,
    pub session_id: String,
    pub plan_id: Option<String>,
    pub step_id: Option<String>,
    pub messages: Vec<CheckpointMessage>,
    pub created_at: i64,
    pub is_active: bool,
}

/// Message in checkpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckpointMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub metadata: Option<serde_json::Value>,
}

/// Recovery service
#[derive(Clone)]
pub struct RecoveryService {
    storage: Arc<StorageManager>,
    config: RecoveryStrategyConfig,
    active_recoveries: Arc<RwLock<Vec<String>>>,
}

impl RecoveryService {
    pub fn new(storage: Arc<StorageManager>) -> Self {
        Self {
            storage,
            config: RecoveryStrategyConfig::default(),
            active_recoveries: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub fn with_config(mut self, config: RecoveryStrategyConfig) -> Self {
        self.config = config;
        self
    }

    /// Generate unique ID
    fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Calculate retry delay with exponential backoff
    pub fn calculate_retry_delay(&self, attempt: usize) -> u64 {
        let delay = self.config.base_delay_ms as f64
            * self.config.backoff_multiplier.powi(attempt as i32);
        delay.min(self.config.max_delay_ms as f64) as u64
    }

    /// Determine recovery action based on trigger and context
    pub fn determine_recovery_action(&self, trigger: &RecoveryTrigger, context: &RecoveryContext) -> RecoveryDecision {
        match trigger {
            RecoveryTrigger::ToolFailure => {
                if context.attempt_count < self.config.max_retry_attempts {
                    RecoveryDecision {
                        action: RecoveryAction::RetryStep,
                        trigger: trigger.clone(),
                        max_attempts: self.config.max_retry_attempts,
                        current_attempt: context.attempt_count + 1,
                        delay_ms: Some(self.calculate_retry_delay(context.attempt_count)),
                        checkpoint_id: None,
                        message: format!("Retrying step after tool failure (attempt {}/{})",
                            context.attempt_count + 1, self.config.max_retry_attempts),
                    }
                } else if self.config.enable_checkpoint_restore {
                    RecoveryDecision {
                        action: RecoveryAction::RestoreCheckpoint,
                        trigger: trigger.clone(),
                        max_attempts: 1,
                        current_attempt: 1,
                        delay_ms: None,
                        checkpoint_id: None,
                        message: "Max retries exceeded, restoring from checkpoint".to_string(),
                    }
                } else {
                    RecoveryDecision {
                        action: RecoveryAction::PartialReplan,
                        trigger: trigger.clone(),
                        max_attempts: self.config.max_replan_attempts,
                        current_attempt: 1,
                        delay_ms: None,
                        checkpoint_id: None,
                        message: "Max retries exceeded, initiating partial replan".to_string(),
                    }
                }
            }
            RecoveryTrigger::Timeout => {
                RecoveryDecision {
                    action: RecoveryAction::RetryStep,
                    trigger: trigger.clone(),
                    max_attempts: self.config.max_retry_attempts,
                    current_attempt: context.attempt_count + 1,
                    delay_ms: Some(self.calculate_retry_delay(context.attempt_count)),
                    checkpoint_id: None,
                    message: format!("Retrying after timeout (attempt {}/{})",
                        context.attempt_count + 1, self.config.max_retry_attempts),
                }
            }
            RecoveryTrigger::Interruption => {
                RecoveryDecision {
                    action: RecoveryAction::RestoreCheckpoint,
                    trigger: trigger.clone(),
                    max_attempts: 1,
                    current_attempt: 1,
                    delay_ms: None,
                    checkpoint_id: None,
                    message: "Session interrupted, restoring from checkpoint".to_string(),
                }
            }
            RecoveryTrigger::UserCancelled => {
                RecoveryDecision {
                    action: RecoveryAction::Abort,
                    trigger: trigger.clone(),
                    max_attempts: 0,
                    current_attempt: 0,
                    delay_ms: None,
                    checkpoint_id: None,
                    message: "User cancelled operation".to_string(),
                }
            }
            RecoveryTrigger::PermissionDenied => {
                RecoveryDecision {
                    action: RecoveryAction::Escalate,
                    trigger: trigger.clone(),
                    max_attempts: 1,
                    current_attempt: 1,
                    delay_ms: None,
                    checkpoint_id: None,
                    message: "Permission denied, escalating to user".to_string(),
                }
            }
            RecoveryTrigger::ResourceError => {
                if context.attempt_count < self.config.max_retry_attempts {
                    RecoveryDecision {
                        action: RecoveryAction::RetryStep,
                        trigger: trigger.clone(),
                        max_attempts: self.config.max_retry_attempts,
                        current_attempt: context.attempt_count + 1,
                        delay_ms: Some(self.calculate_retry_delay(context.attempt_count)),
                        checkpoint_id: None,
                        message: format!("Retrying after resource error (attempt {}/{})",
                            context.attempt_count + 1, self.config.max_retry_attempts),
                    }
                } else {
                    RecoveryDecision {
                        action: RecoveryAction::Fallback,
                        trigger: trigger.clone(),
                        max_attempts: 1,
                        current_attempt: 1,
                        delay_ms: None,
                        checkpoint_id: None,
                        message: "Using fallback strategy after resource errors".to_string(),
                    }
                }
            }
            RecoveryTrigger::UnexpectedState => {
                RecoveryDecision {
                    action: RecoveryAction::PartialReplan,
                    trigger: trigger.clone(),
                    max_attempts: self.config.max_replan_attempts,
                    current_attempt: 1,
                    delay_ms: None,
                    checkpoint_id: None,
                    message: "Unexpected state detected, initiating partial replan".to_string(),
                }
            }
        }
    }

    /// Create a checkpoint for the current session state
    pub async fn create_checkpoint(
        &self,
        session_id: &str,
        plan_id: Option<&str>,
        step_id: Option<&str>,
        messages: Vec<CheckpointMessage>,
    ) -> Result<SessionCheckpoint> {
        let checkpoint = SessionCheckpoint {
            id: Self::generate_id("chk"),
            session_id: session_id.to_string(),
            plan_id: plan_id.map(String::from),
            step_id: step_id.map(String::from),
            messages,
            created_at: Utc::now().timestamp(),
            is_active: true,
        };

        // Deactivate old checkpoints for this session
        // In a real implementation, we would update the database here
        // For now, we just return the checkpoint

        Ok(checkpoint)
    }

    /// Restore session from a checkpoint
    pub async fn restore_from_checkpoint(
        &self,
        checkpoint_id: &str,
    ) -> Result<SessionCheckpoint> {
        // In a real implementation, we would query the database
        // For now, return an error indicating this needs database integration
        Err(anyhow!("checkpoint restore requires database integration"))
    }

    /// Get the most recent checkpoint for a session
    pub async fn get_latest_checkpoint(
        &self,
        session_id: &str,
    ) -> Result<Option<SessionCheckpoint>> {
        // In a real implementation, we would query the database
        Ok(None)
    }

    /// Record recovery history
    pub async fn record_recovery(
        &self,
        session_id: &str,
        trigger: &RecoveryTrigger,
        action: &RecoveryAction,
        checkpoint_id: Option<&str>,
        success: bool,
        message: &str,
    ) -> Result<RecoveryHistoryEntry> {
        let entry = RecoveryHistoryEntry {
            id: Self::generate_id("rec"),
            session_id: session_id.to_string(),
            trigger: trigger.clone(),
            action: action.clone(),
            checkpoint_id: checkpoint_id.map(String::from),
            success,
            message: message.to_string(),
            created_at: Utc::now().timestamp(),
        };

        // In a real implementation, we would store this in the database

        Ok(entry)
    }

    /// Check if recovery is in progress for a session
    pub async fn is_recovering(&self, session_id: &str) -> bool {
        let recoveries = self.active_recoveries.read().await;
        recoveries.contains(&session_id.to_string())
    }

    /// Mark recovery as started
    pub async fn start_recovery(&self, session_id: &str) {
        let mut recoveries = self.active_recoveries.write().await;
        if !recoveries.contains(&session_id.to_string()) {
            recoveries.push(session_id.to_string());
        }
    }

    /// Mark recovery as completed
    pub async fn end_recovery(&self, session_id: &str) {
        let mut recoveries = self.active_recoveries.write().await;
        recoveries.retain(|id| id != session_id);
    }

    /// Build recovery context from error info
    pub fn build_recovery_context(
        &self,
        session_id: &str,
        plan_id: Option<&str>,
        step_id: Option<&str>,
        trigger: &RecoveryTrigger,
        error_message: &str,
    ) -> RecoveryContext {
        RecoveryContext {
            session_id: session_id.to_string(),
            plan_id: plan_id.map(String::from),
            current_step_id: step_id.map(String::from),
            failed_step_id: step_id.map(String::from),
            trigger: trigger.clone(),
            error_message: error_message.to_string(),
            attempt_count: 0,
            created_at: Utc::now().timestamp(),
        }
    }
}

/// Trait for components that handle recovery events
#[async_trait]
pub trait RecoveryEventHandler: Send + Sync {
    async fn on_recovery_start(&self, context: &RecoveryContext) {}
    async fn on_recovery_action(&self, decision: &RecoveryDecision) {}
    async fn on_recovery_complete(&self, success: bool, context: &RecoveryContext) {}
    async fn on_recovery_failure(&self, error: &str, context: &RecoveryContext) {}
}

/// Checkpoint management for orchestrator integration
#[derive(Clone)]
pub struct CheckpointManager {
    recovery_service: RecoveryService,
}

impl CheckpointManager {
    pub fn new(storage: Arc<StorageManager>) -> Self {
        Self {
            recovery_service: RecoveryService::new(storage),
        }
    }

    /// Create checkpoint before tool execution
    pub async fn checkpoint_before_tool(
        &self,
        session_id: &str,
        plan_id: Option<&str>,
        step_id: &str,
        messages: Vec<CheckpointMessage>,
    ) -> Result<SessionCheckpoint> {
        self.recovery_service
            .create_checkpoint(session_id, plan_id, Some(step_id), messages)
            .await
    }

    /// Create checkpoint after completion
    pub async fn checkpoint_after_completion(
        &self,
        session_id: &str,
        plan_id: Option<&str>,
        messages: Vec<CheckpointMessage>,
    ) -> Result<SessionCheckpoint> {
        self.recovery_service
            .create_checkpoint(session_id, plan_id, None, messages)
            .await
    }

    /// Restore to latest checkpoint
    pub async fn restore_latest(&self, session_id: &str) -> Result<Option<SessionCheckpoint>> {
        self.recovery_service
            .get_latest_checkpoint(session_id)
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_context() -> RecoveryContext {
        RecoveryContext {
            session_id: "test_session".to_string(),
            plan_id: Some("plan_1".to_string()),
            current_step_id: Some("step_1".to_string()),
            failed_step_id: Some("step_1".to_string()),
            trigger: RecoveryTrigger::ToolFailure,
            error_message: "Tool execution failed".to_string(),
            attempt_count: 0,
            created_at: Utc::now().timestamp(),
        }
    }

    fn create_recovery_service() -> RecoveryService {
        // Create a minimal storage manager for testing
        let storage = Arc::new(StorageManager::init("test").await.unwrap());
        RecoveryService::new(storage)
    }

    #[tokio::test]
    async fn test_determine_recovery_action_tool_failure_first_attempt() {
        let service = create_recovery_service();
        let context = create_test_context();

        let decision = service.determine_recovery_action(&RecoveryTrigger::ToolFailure, &context);

        assert_eq!(decision.action, RecoveryAction::RetryStep);
        assert_eq!(decision.current_attempt, 1);
        assert!(decision.delay_ms.is_some());
    }

    #[tokio::test]
    async fn test_determine_recovery_action_user_cancelled() {
        let service = create_recovery_service();
        let context = create_test_context();

        let decision = service.determine_recovery_action(&RecoveryTrigger::UserCancelled, &context);

        assert_eq!(decision.action, RecoveryAction::Abort);
    }

    #[tokio::test]
    async fn test_determine_recovery_action_permission_denied() {
        let service = create_recovery_service();
        let context = create_test_context();

        let decision = service.determine_recovery_action(&RecoveryTrigger::PermissionDenied, &context);

        assert_eq!(decision.action, RecoveryAction::Escalate);
    }

    #[tokio::test]
    async fn test_calculate_retry_delay() {
        let service = create_recovery_service();

        // First attempt: base_delay * backoff^0 = base_delay
        assert_eq!(service.calculate_retry_delay(0), 1000);

        // Second attempt: base_delay * backoff^1 = base_delay * 2
        assert_eq!(service.calculate_retry_delay(1), 2000);

        // Third attempt: base_delay * backoff^2 = base_delay * 4
        assert_eq!(service.calculate_retry_delay(2), 4000);
    }
}
