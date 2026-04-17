//! Workflow Commands Module
//!
//! Provides Tauri commands for workflow operations.

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::workflow::{WorkflowEngine, WorkflowDefinition, WorkflowInstance};
use crate::workflow::types::*;

/// Create a new workflow definition
#[tauri::command]
pub async fn workflow_create_definition(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    definition: WorkflowDefinition,
) -> Result<String, String> {
    tracing::info!(
        "[Workflow] Creating definition: {} ({})", 
        definition.name, definition.id
    );

    let engine = engine.read().await;
    engine.register(definition)
        .await
        .map_err(|e| e.to_string())?;

    Ok("Definition created successfully".to_string())
}

/// Execute a workflow
#[tauri::command]
pub async fn workflow_execute(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    tenant_id: String,
    request: WorkflowExecuteRequest,
) -> Result<WorkflowInstance, String> {
    tracing::info!(
        "[Workflow] Executing workflow: {} for tenant: {}", 
        request.definition_id, tenant_id
    );

    let engine = engine.read().await;
    
    // Start the workflow
    let instance = engine.start(request, tenant_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(instance)
}

/// Continue workflow execution (resume after approval, etc.)
#[tauri::command]
pub async fn workflow_continue(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    instance_id: String,
) -> Result<WorkflowInstance, String> {
    tracing::info!("[Workflow] Continuing workflow: {}", instance_id);

    let engine = engine.read().await;
    engine.execute(&instance_id)
        .await
        .map_err(|e| e.to_string())
}

/// Approve a workflow step
#[tauri::command]
pub async fn workflow_approve(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    request: WorkflowApprovalRequest,
) -> Result<WorkflowInstance, String> {
    tracing::info!(
        "[Workflow] Approval for instance: {}, step: {}, approved: {}", 
        request.instance_id, request.step_id, request.approved
    );

    let engine = engine.read().await;
    engine.approve(request)
        .await
        .map_err(|e| e.to_string())
}

/// Pause a workflow
#[tauri::command]
pub async fn workflow_pause(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    instance_id: String,
) -> Result<WorkflowInstance, String> {
    tracing::info!("[Workflow] Pausing workflow: {}", instance_id);

    let engine = engine.read().await;
    engine.pause(&instance_id)
        .await
        .map_err(|e| e.to_string())
}

/// Resume a paused workflow
#[tauri::command]
pub async fn workflow_resume(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    instance_id: String,
) -> Result<WorkflowInstance, String> {
    tracing::info!("[Workflow] Resuming workflow: {}", instance_id);

    let engine = engine.read().await;
    engine.resume(&instance_id)
        .await
        .map_err(|e| e.to_string())
}

/// Cancel a workflow
#[tauri::command]
pub async fn workflow_cancel(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    instance_id: String,
) -> Result<WorkflowInstance, String> {
    tracing::info!("[Workflow] Cancelling workflow: {}", instance_id);

    let engine = engine.read().await;
    engine.cancel(&instance_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get workflow instance details
#[tauri::command]
pub async fn workflow_get(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    instance_id: String,
) -> Result<Option<WorkflowInstance>, String> {
    tracing::info!("[Workflow] Getting workflow: {}", instance_id);

    let engine = engine.read().await;
    Ok(engine.get(&instance_id).await)
}

/// List workflows for a tenant
#[tauri::command]
pub async fn workflow_list(
    engine: tauri::State<'_, Arc<RwLock<WorkflowEngine>>>,
    tenant_id: String,
) -> Result<Vec<WorkflowInstance>, String> {
    tracing::info!("[Workflow] Listing workflows for tenant: {}", tenant_id);

    let engine = engine.read().await;
    Ok(engine.list_by_tenant(&tenant_id).await)
}

/// Create a sample workflow definition (for testing)
#[tauri::command]
pub fn workflow_create_sample() -> WorkflowDefinition {
    WorkflowDefinition {
        id: "sample-employee-onboarding".to_string(),
        name: "员工入职流程".to_string(),
        description: Some("示例：员工入职流程".to_string()),
        steps: vec![
            WorkflowStep::Action {
                id: "check_department".to_string(),
                name: "检查部门".to_string(),
                tool: "hr_check_department".to_string(),
                params: serde_json::json!({}),
                on_success: Some("create_resources".to_string()),
                on_failure: Some("notify_admin".to_string()),
            },
            WorkflowStep::Action {
                id: "create_resources".to_string(),
                name: "创建资源".to_string(),
                tool: "hr_create_resources".to_string(),
                params: serde_json::json!({}),
                on_success: Some("approval_step".to_string()),
                on_failure: Some("notify_admin".to_string()),
            },
            WorkflowStep::Approval {
                id: "approval_step".to_string(),
                name: "主管审批".to_string(),
                approvers: vec!["manager".to_string()],
                timeout_minutes: Some(1440), // 24 hours
                on_approved: Some("notify_complete".to_string()),
                on_rejected: Some("notify_admin".to_string()),
            },
            WorkflowStep::Action {
                id: "notify_complete".to_string(),
                name: "通知完成".to_string(),
                tool: "notify_user".to_string(),
                params: serde_json::json!({
                    "message": "员工入职流程已完成"
                }),
                on_success: None,
                on_failure: None,
            },
            WorkflowStep::End {
                result: serde_json::json!({
                    "status": "completed",
                    "message": "流程已完成"
                }),
            },
        ],
        timeout_minutes: Some(1440), // 24 hours
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    }
}
