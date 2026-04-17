//! Approval Workflow Commands Module
//!
//! Tauri commands for approval workflow integration.

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::approval::workflow_integration::{ApprovalWorkflowService, ApprovalWorkflowState, PendingApproval};
use crate::approval::types::{ApprovalFlow, ApprovalStep, Approver, StepType, RecordStatus};

/// Create an approval workflow definition from approval flow
#[tauri::command]
pub async fn create_approval_workflow(
    tenant_id: String,
    name: String,
    description: String,
    approval_flow: ApprovalFlow,
    context: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let service = ApprovalWorkflowService::new();
    
    let workflow_def = service.create_approval_workflow(
        &name,
        &description,
        &approval_flow,
        context.unwrap_or(serde_json::json!({})),
        &tenant_id,
    );

    tracing::info!(
        "[ApprovalWorkflow] Created workflow: {} with {} steps",
        workflow_def.name,
        workflow_def.steps.len()
    );

    Ok(serde_json::to_value(&workflow_def).map_err(|e| e.to_string())?)
}

/// Get pending approvals for a user
#[tauri::command]
pub async fn get_workflow_pending_approvals(
    state: tauri::State<'_, ApprovalWorkflowState>,
    user_id: String,
) -> Result<Vec<PendingApproval>, String> {
    let service = state.read().await;
    Ok(service.get_pending_for_user(&user_id).await)
}

/// Get pending approval count
#[tauri::command]
pub async fn get_pending_approval_count(
    state: tauri::State<'_, ApprovalWorkflowState>,
    user_id: String,
) -> Result<usize, String> {
    let service = state.read().await;
    Ok(service.get_pending_count(&user_id).await)
}

/// Approve a workflow step
#[tauri::command]
pub async fn approve_workflow_step(
    state: tauri::State<'_, ApprovalWorkflowState>,
    workflow_instance_id: String,
    step_id: String,
    approver_id: String,
    comment: Option<String>,
) -> Result<serde_json::Value, String> {
    let service = state.read().await;
    let result = service.approve_step(&workflow_instance_id, &step_id, &approver_id, comment).await?;
    Ok(serde_json::to_value(&result).map_err(|e| e.to_string())?)
}

/// Reject a workflow step
#[tauri::command]
pub async fn reject_workflow_step(
    state: tauri::State<'_, ApprovalWorkflowState>,
    workflow_instance_id: String,
    step_id: String,
    approver_id: String,
    comment: Option<String>,
) -> Result<serde_json::Value, String> {
    let service = state.read().await;
    match service.reject_step(&workflow_instance_id, &step_id, &approver_id, comment).await {
        Ok(result) => Ok(serde_json::to_value(&result).map_err(|e| e.to_string())?),
        Err(e) => Err(e),
    }
}

/// Quick create a sample approval workflow
#[tauri::command]
pub fn create_sample_approval_workflow(tenant_id: String) -> ApprovalFlow {
    let mut form_schema = std::collections::HashMap::new();
    form_schema.insert("applicant".to_string(), serde_json::json!({"type": "string", "label": "申请人"}));
    form_schema.insert("amount".to_string(), serde_json::json!({"type": "number", "label": "金额"}));
    form_schema.insert("reason".to_string(), serde_json::json!({"type": "textarea", "label": "申请原因"}));

    ApprovalFlow {
        id: format!("sample-approval-{}", &tenant_id[..8.min(tenant_id.len())]),
        name: "样品采购审批".to_string(),
        description: "样品采购审批流程".to_string(),
        steps: vec![
            ApprovalStep {
                id: "step1".to_string(),
                order: 1,
                step_type: StepType::Sequential,
                approvers: vec![
                    Approver {
                        id: "manager".to_string(),
                        name: "部门经理".to_string(),
                        employee_id: "EMP001".to_string(),
                    }
                ],
                condition: Some(crate::approval::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: ">".to_string(),
                    value: serde_json::json!(10000),
                }),
            },
            ApprovalStep {
                id: "step2".to_string(),
                order: 2,
                step_type: StepType::Sequential,
                approvers: vec![
                    Approver {
                        id: "director".to_string(),
                        name: "总监".to_string(),
                        employee_id: "EMP002".to_string(),
                    }
                ],
                condition: Some(crate::approval::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: ">".to_string(),
                    value: serde_json::json!(50000),
                }),
            },
        ],
        form_schema,
        status: crate::approval::types::FlowStatus::Active,
        created_by: "system".to_string(),
        created_at: chrono::Utc::now().timestamp(),
        updated_at: chrono::Utc::now().timestamp(),
    }
}
