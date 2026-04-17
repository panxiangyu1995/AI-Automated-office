//! Workflow Types Module
//!
//! Defines the core types for workflow orchestration.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    /// Unique workflow ID
    pub id: String,
    /// Workflow name
    pub name: String,
    /// Workflow description
    pub description: Option<String>,
    /// Workflow steps
    pub steps: Vec<WorkflowStep>,
    /// Timeout in minutes (None = no timeout)
    pub timeout_minutes: Option<u32>,
    /// Created at
    pub created_at: DateTime<Utc>,
    /// Updated at
    pub updated_at: DateTime<Utc>,
}

/// Workflow step types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WorkflowStep {
    /// Action step - executes a tool or skill
    Action {
        /// Step ID
        id: String,
        /// Step name
        name: String,
        /// Tool/skill to execute
        tool: String,
        /// Parameters for the tool
        params: serde_json::Value,
        /// Next step ID on success
        on_success: Option<String>,
        /// Next step ID on failure
        on_failure: Option<String>,
    },
    /// Approval step - requires human approval
    Approval {
        /// Step ID
        id: String,
        /// Step name
        name: String,
        /// Approver user IDs or roles
        approvers: Vec<String>,
        /// Timeout in minutes
        timeout_minutes: Option<u32>,
        /// Next step ID on approval
        on_approved: Option<String>,
        /// Next step ID on rejection
        on_rejected: Option<String>,
    },
    /// Condition step - branches based on expression
    Condition {
        /// Step ID
        id: String,
        /// Step name
        name: String,
        /// Expression to evaluate (DSL: ${var} > 0)
        expression: String,
        /// Next step ID if true
        on_true: String,
        /// Next step ID if false
        on_false: String,
    },
    /// End step - terminates the workflow
    End {
        /// Final result
        result: serde_json::Value,
    },
}

/// Workflow execution state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum WorkflowState {
    /// Workflow is pending execution
    Pending,
    /// Workflow is running
    Running,
    /// Workflow is paused
    Paused,
    /// Workflow is waiting for approval
    AwaitingApproval(String), // step_id
    /// Workflow completed successfully
    Completed,
    /// Workflow failed with error
    Failed(String), // error message
    /// Workflow was cancelled
    Cancelled,
}

/// Workflow instance - a running workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowInstance {
    /// Instance ID
    pub id: String,
    /// Workflow definition ID
    pub definition_id: String,
    /// Current state
    pub state: WorkflowState,
    /// Current step ID
    pub current_step_id: Option<String>,
    /// Execution context (variables)
    pub context: serde_json::Value,
    /// Execution history
    pub history: Vec<StepResult>,
    /// Tenant ID for isolation
    pub tenant_id: String,
    /// Created at
    pub created_at: DateTime<Utc>,
    /// Updated at
    pub updated_at: DateTime<Utc>,
}

/// Result of a step execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepResult {
    /// Step ID
    pub step_id: String,
    /// Step type
    pub step_type: String,
    /// Execution result
    pub result: serde_json::Value,
    /// Whether the step succeeded
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
    /// Executed at
    pub executed_at: DateTime<Utc>,
}

/// Workflow execution request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowExecuteRequest {
    /// Definition ID to execute
    pub definition_id: String,
    /// Initial context/variables
    pub context: Option<serde_json::Value>,
    /// Trigger type
    pub trigger: Option<String>,
}

/// Workflow pause/resume request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowControlRequest {
    /// Instance ID
    pub instance_id: String,
}

/// Workflow approval request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowApprovalRequest {
    /// Instance ID
    pub instance_id: String,
    /// Step ID being approved
    pub step_id: String,
    /// Whether approved or rejected
    pub approved: bool,
    /// Approval comment
    pub comment: Option<String>,
    /// Approver user ID
    pub approver_id: String,
}
