//! Approval Workflow Integration Module
//!
//! Bridges approval module with workflow engine for automated approval flows.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::approval::types::{ApprovalFlow, ApprovalRecord, Approver, RecordStatus, StepType};
use crate::workflow::types::{WorkflowDefinition, WorkflowInstance, WorkflowStep, WorkflowExecuteRequest, WorkflowApprovalRequest};

/// Approval workflow integration service
pub struct ApprovalWorkflowService {
    /// Workflow engine state (managed by Tauri)
    workflow_instances: Arc<RwLock<Vec<WorkflowInstance>>>,
    /// Pending workflow approvals
    pending_approvals: Arc<RwLock<Vec<PendingApproval>>>,
}

/// Pending approval waiting for user action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingApproval {
    pub workflow_instance_id: String,
    pub step_id: String,
    pub approval_record_id: String,
    pub title: String,
    pub description: String,
    pub requester: String,
    pub approvers: Vec<String>,
    pub created_at: i64,
    pub step_order: i32,
}

impl ApprovalWorkflowService {
    pub fn new() -> Self {
        Self {
            workflow_instances: Arc::new(RwLock::new(Vec::new())),
            pending_approvals: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Create a workflow with embedded approval step
    pub fn create_approval_workflow(
        &self,
        name: &str,
        description: &str,
        approval_flow: &ApprovalFlow,
        context: serde_json::Value,
        tenant_id: &str,
    ) -> WorkflowDefinition {
        // Convert approval flow steps to workflow steps
        let mut workflow_steps = Vec::new();

        for (idx, step) in approval_flow.steps.iter().enumerate() {
            let approver_ids: Vec<String> = step.approvers.iter()
                .map(|a| a.id.clone())
                .collect();

            // Determine next step
            let next_step = if idx < approval_flow.steps.len() - 1 {
                Some(format!("approval_step_{}", idx + 1))
            } else {
                None
            };

            workflow_steps.push(WorkflowStep::Approval {
                id: format!("approval_step_{}", idx),
                name: step.approvers.first()
                    .map(|a| a.name.clone())
                    .unwrap_or_else(|| format!("审批步骤{}", idx + 1)),
                approvers: approver_ids,
                timeout_minutes: Some(1440), // 24 hours default
                on_approved: next_step.clone(),
                on_rejected: Some("reject_end".to_string()),
            });
        }

        // Add end step
        workflow_steps.push(WorkflowStep::End {
            result: serde_json::json!({
                "status": "approved",
                "message": "审批流程已完成"
            }),
        });

        // Add rejection end (for rejected path)
        workflow_steps.push(WorkflowStep::Action {
            id: "reject_end".to_string(),
            name: "审批拒绝".to_string(),
            tool: "approval_reject_notification".to_string(),
            params: serde_json::json!({}),
            on_success: Some("end".to_string()),
            on_failure: None,
        });

        // Add final end
        workflow_steps.push(WorkflowStep::End {
            result: serde_json::json!({
                "status": "rejected",
                "message": "审批流程已拒绝"
            }),
        });

        WorkflowDefinition {
            id: format!("approval-wf-{}", uuid::Uuid::new_v4()),
            tenant_id: tenant_id.to_string(),
            name: name.to_string(),
            description: Some(description.to_string()),
            steps: workflow_steps,
            timeout_minutes: Some(10080), // 7 days
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        }
    }

    /// Extract approval info from workflow step
    pub fn extract_approval_from_step(step: &WorkflowStep) -> Option<(String, Vec<String>, Option<u32>)> {
        match step {
            WorkflowStep::Approval {
                id,
                approvers,
                timeout_minutes,
                ..
            } => Some((id.clone(), approvers.clone(), *timeout_minutes)),
            _ => None,
        }
    }

    /// Build approval record from workflow context
    pub fn build_approval_record(
        &self,
        workflow_instance: &WorkflowInstance,
        step: &WorkflowStep,
        step_order: i32,
    ) -> Option<PendingApproval> {
        if let WorkflowStep::Approval { name, approvers, .. } = step {
            Some(PendingApproval {
                workflow_instance_id: workflow_instance.id.clone(),
                step_id: name.clone(),
                approval_record_id: format!("approval-{}-{}", workflow_instance.id, step_order),
                title: format!("{} - 工作流审批", workflow_instance.definition_id),
                description: format!(
                    "来自工作流 {} 的审批请求",
                    workflow_instance.definition_id
                ),
                requester: workflow_instance.tenant_id.clone(),
                approvers: approvers.clone(),
                created_at: chrono::Utc::now().timestamp(),
                step_order,
            })
        } else {
            None
        }
    }

    /// Get all pending approvals for a user
    pub async fn get_pending_for_user(&self, user_id: &str) -> Vec<PendingApproval> {
        let pending = self.pending_approvals.read().await;
        pending
            .iter()
            .filter(|p| p.approvers.contains(&user_id.to_string()))
            .cloned()
            .collect()
    }

    /// Approve a pending workflow step
    pub async fn approve_step(
        &self,
        workflow_instance_id: &str,
        step_id: &str,
        approver_id: &str,
        comment: Option<String>,
    ) -> Result<WorkflowInstance, String> {
        // Update pending list
        let mut pending = self.pending_approvals.write().await;
        pending.retain(|p| {
            !(p.workflow_instance_id == workflow_instance_id && p.step_id == step_id)
        });
        drop(pending);

        // Return success (actual workflow continuation would be handled by workflow engine)
        tracing::info!(
            "[ApprovalWorkflow] Step approved: workflow={}, step={}, approver={}",
            workflow_instance_id, step_id, approver_id
        );

        Ok(WorkflowInstance {
            id: workflow_instance_id.to_string(),
            definition_id: String::new(),
            state: crate::workflow::types::WorkflowState::Running,
            current_step_id: None,
            context: serde_json::json!({}),
            history: Vec::new(),
            tenant_id: String::new(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        })
    }

    /// Reject a pending workflow step
    pub async fn reject_step(
        &self,
        workflow_instance_id: &str,
        step_id: &str,
        approver_id: &str,
        comment: Option<String>,
    ) -> Result<WorkflowInstance, String> {
        // Update pending list
        let mut pending = self.pending_approvals.write().await;
        pending.retain(|p| {
            !(p.workflow_instance_id == workflow_instance_id && p.step_id == step_id)
        });
        drop(pending);

        tracing::info!(
            "[ApprovalWorkflow] Step rejected: workflow={}, step={}, approver={}",
            workflow_instance_id, step_id, approver_id
        );

        Err(format!("审批已拒绝: {}", comment.unwrap_or_default()))
    }

    /// Add pending approval
    pub async fn add_pending(&self, approval: PendingApproval) {
        let mut pending = self.pending_approvals.write().await;
        pending.push(approval);
    }

    /// Get pending count
    pub async fn get_pending_count(&self, user_id: &str) -> usize {
        let pending = self.pending_approvals.read().await;
        pending
            .iter()
            .filter(|p| p.approvers.contains(&user_id.to_string()))
            .count()
    }
}

impl Default for ApprovalWorkflowService {
    fn default() -> Self {
        Self::new()
    }
}

/// Type alias for the service state
pub type ApprovalWorkflowState = Arc<RwLock<ApprovalWorkflowService>>;
