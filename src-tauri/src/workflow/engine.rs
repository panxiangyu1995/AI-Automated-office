//! Workflow Engine Module
//!
//! Core workflow execution engine.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;

use chrono::Utc;
use tokio::sync::RwLock;

use super::types::*;
use crate::storage::workflow_store::WorkflowStore;

/// Workflow execution engine with persistence
pub struct WorkflowEngine {
    /// Active workflow instances (in-memory cache)
    instances: Arc<RwLock<HashMap<String, WorkflowInstance>>>,
    /// Workflow definitions cache (in-memory)
    definitions: Arc<RwLock<HashMap<String, WorkflowDefinition>>>,
    /// Database storage
    store: Option<Arc<WorkflowStore>>,
}

impl WorkflowEngine {
    /// Create a new workflow engine without persistence (in-memory only)
    pub fn new() -> Self {
        Self {
            instances: Arc::new(RwLock::new(HashMap::new())),
            definitions: Arc::new(RwLock::new(HashMap::new())),
            store: None,
        }
    }

    /// Create a new workflow engine with persistence
    pub fn with_store(store: Arc<WorkflowStore>) -> Self {
        Self {
            instances: Arc::new(RwLock::new(HashMap::new())),
            definitions: Arc::new(RwLock::new(HashMap::new())),
            store: Some(store),
        }
    }

    /// Initialize from database (load all data on startup)
    pub async fn init_from_store(&self) -> Result<(), WorkflowError> {
        let store = self.store.as_ref()
            .ok_or_else(|| WorkflowError::StoreNotConfigured)?;

        // Load all definitions
        // Note: We'd need tenant_id to load definitions - this is a simplified version
        // In production, you'd track which tenants to load

        Ok(())
    }

    /// Register a workflow definition (in-memory)
    pub async fn register(&self, definition: WorkflowDefinition) -> Result<(), WorkflowError> {
        let mut defs = self.definitions.write().await;
        defs.insert(definition.id.clone(), definition.clone());

        // Persist to store if configured
        if let Some(store) = &self.store {
            store.save_definition(&definition)
                .await
                .map_err(|e| WorkflowError::StorageError(e.to_string()))?;
        }

        Ok(())
    }

    /// Create and start a new workflow instance
    pub async fn start(
        &self,
        request: WorkflowExecuteRequest,
        tenant_id: String,
    ) -> Result<WorkflowInstance, WorkflowError> {
        // Get definition from cache or store
        let definition = self.get_definition(&request.definition_id).await?;

        // Create instance
        let instance_id = format!("wf-{}", uuid::Uuid::new_v4());
        let now = Utc::now();
        
        let instance = WorkflowInstance {
            id: instance_id.clone(),
            definition_id: request.definition_id,
            state: WorkflowState::Running,
            current_step_id: definition.steps.first().map(|s| s.id()),
            context: request.context.unwrap_or(serde_json::json!({})),
            history: Vec::new(),
            tenant_id,
            created_at: now,
            updated_at: now,
        };

        // Store in memory
        let mut instances = self.instances.write().await;
        instances.insert(instance.id.clone(), instance.clone());

        // Persist to database if configured
        if let Some(store) = &self.store {
            store.save_instance(&instance)
                .await
                .map_err(|e| WorkflowError::StorageError(e.to_string()))?;
        }

        Ok(instance)
    }

    /// Get definition from cache or store
    async fn get_definition(&self, id: &str) -> Result<WorkflowDefinition, WorkflowError> {
        // Try cache first
        {
            let defs = self.definitions.read().await;
            if let Some(def) = defs.get(id) {
                return Ok(def.clone());
            }
        }

        // Try store
        if let Some(store) = &self.store {
            if let Ok(Some(def)) = store.get_definition(id).await {
                // Cache it
                let mut defs = self.definitions.write().await;
                defs.insert(id.to_string(), def.clone());
                return Ok(def);
            }
        }

        Err(WorkflowError::DefinitionNotFound(id.to_string()))
    }

    /// Get instance from cache or store
    async fn get_instance_internal(&self, id: &str) -> Result<Option<WorkflowInstance>, WorkflowError> {
        // Try cache first
        {
            let instances = self.instances.read().await;
            if let Some(inst) = instances.get(id) {
                return Ok(Some(inst.clone()));
            }
        }

        // Try store
        if let Some(store) = &self.store {
            match store.get_instance(id).await {
                Ok(Some(inst)) => {
                    // Cache it
                    let mut instances = self.instances.write().await;
                    instances.insert(id.to_string(), inst.clone());
                    return Ok(Some(inst));
                }
                Ok(None) => return Ok(None),
                Err(e) => return Err(WorkflowError::StorageError(e.to_string())),
            }
        }

        Ok(None)
    }

    /// Persist instance to store
    async fn save_instance(&self, instance: &WorkflowInstance) -> Result<(), WorkflowError> {
        if let Some(store) = &self.store {
            store.save_instance(instance)
                .await
                .map_err(|e| WorkflowError::StorageError(e.to_string()))?;
        }
        Ok(())
    }

    /// Execute workflow until next pause point (approval, completion, or error)
    pub async fn execute(&self, instance_id: &str) -> Result<WorkflowInstance, WorkflowError> {
        let mut instances = self.instances.write().await;
        let instance = instances.get_mut(instance_id)
            .ok_or_else(|| WorkflowError::InstanceNotFound(instance_id.to_string()))?;

        // Get definition
        let definition = self.get_definition(&instance.definition_id).await?;

        // Main execution loop
        while instance.state == WorkflowState::Running {
            let current_step_id = match &instance.current_step_id {
                Some(id) => id.clone(),
                None => {
                    instance.state = WorkflowState::Completed;
                    break;
                }
            };

            // Find current step
            let step = definition.steps.iter()
                .find(|s| s.id() == current_step_id)
                .ok_or_else(|| WorkflowError::StepNotFound(current_step_id.clone()))?;

            // Execute step
            let result = self.execute_step(instance, step).await?;
            
            // Record history
            instance.history.push(result.clone());
            
            // Determine next step
            if let Some(next_id) = self.determine_next_step(instance, step) {
                instance.current_step_id = Some(next_id);
            } else {
                instance.state = WorkflowState::Completed;
            }

            instance.updated_at = Utc::now();
        }

        // Persist to store
        drop(instances);
        let mut instances = self.instances.write().await;
        if let Some(inst) = instances.get_mut(instance_id) {
            inst.updated_at = Utc::now();
            if let Some(store) = &self.store {
                let _ = store.save_instance(inst).await;
            }
        }

        Ok(instances.get(instance_id).cloned().unwrap())
    }

    /// Execute a single step
    async fn execute_step(
        &self,
        instance: &mut WorkflowInstance,
        step: &WorkflowStep,
    ) -> Result<StepResult, WorkflowError> {
        let start = Instant::now();
        let step_type = step.type_name().to_string();

        match step {
            WorkflowStep::Action { id, name, tool, params, on_success, on_failure } => {
                tracing::info!(
                    "[Workflow] Executing action step: {} ({})", 
                    name, id
                );
                
                // In production, this would call the actual tool
                // For now, we simulate execution
                let result = serde_json::json!({
                    "step_id": id,
                    "step_type": "action",
                    "tool": tool,
                    "status": "executed",
                    "message": format!("Tool '{}' would be executed here", tool),
                });

                Ok(StepResult {
                    step_id: id.clone(),
                    step_type,
                    result,
                    success: true,
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                    executed_at: Utc::now(),
                })
            }

            WorkflowStep::Approval { id, name, approvers, timeout_minutes, on_approved, on_rejected } => {
                tracing::info!(
                    "[Workflow] Approval step: {} ({}) - waiting for approval from: {:?}", 
                    name, id, approvers
                );
                
                instance.state = WorkflowState::AwaitingApproval(id.clone());
                
                let result = serde_json::json!({
                    "step_id": id,
                    "step_type": "approval",
                    "approvers": approvers,
                    "timeout_minutes": timeout_minutes,
                    "status": "awaiting",
                });

                Ok(StepResult {
                    step_id: id.clone(),
                    step_type,
                    result,
                    success: true,
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                    executed_at: Utc::now(),
                })
            }

            WorkflowStep::Condition { id, name, expression, on_true, on_false } => {
                tracing::info!(
                    "[Workflow] Evaluating condition: {} ({}) - {}", 
                    name, id, expression
                );
                
                // Evaluate condition (simplified)
                // In production, this would parse and evaluate the DSL expression
                let condition_met = self.evaluate_condition(&instance.context, expression);
                let next_id = if condition_met { on_true.clone() } else { on_false.clone() };

                let result = serde_json::json!({
                    "step_id": id,
                    "step_type": "condition",
                    "expression": expression,
                    "condition_met": condition_met,
                    "next_step": next_id,
                });

                Ok(StepResult {
                    step_id: id.clone(),
                    step_type,
                    result,
                    success: true,
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                    executed_at: Utc::now(),
                })
            }

            WorkflowStep::End { result } => {
                tracing::info!("[Workflow] Workflow ending");
                
                instance.state = WorkflowState::Completed;
                instance.current_step_id = None;

                Ok(StepResult {
                    step_id: "end".to_string(),
                    step_type,
                    result: result.clone(),
                    success: true,
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                    executed_at: Utc::now(),
                })
            }
        }
    }

    /// Determine the next step based on current step result
    fn determine_next_step(
        &self,
        instance: &WorkflowInstance,
        step: &WorkflowStep,
    ) -> Option<String> {
        // Check if last step was approval and not yet approved
        if matches!(instance.state, WorkflowState::AwaitingApproval(_)) {
            return None; // Wait for approval
        }

        match step {
            WorkflowStep::Action { on_success, on_failure, .. } => {
                // Check context for last execution result
                let success = instance.context.get("last_success")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(true);
                
                if success {
                    on_success.clone()
                } else {
                    on_failure.clone()
                }
            }
            WorkflowStep::Condition { on_true, on_false, .. } => {
                let condition_met = self.evaluate_condition(&instance.context, "");
                if condition_met { Some(on_true.clone()) } else { Some(on_false.clone()) }
            }
            WorkflowStep::End { .. } => None,
            WorkflowStep::Approval { .. } => None, // Wait for external approval
        }
    }

    /// Evaluate a condition expression
    fn evaluate_condition(&self, context: &serde_json::Value, expression: &str) -> bool {
        // Simplified condition evaluation
        // In production, this would parse and evaluate a proper DSL
        // Supports patterns like: ${var} == "value", ${var} > 0, etc.
        
        if expression.is_empty() {
            return true;
        }
        
        // Check if expression references a context variable
        if expression.contains("${") {
            // Extract variable name
            if let Some(start) = expression.find("${") {
                if let Some(end) = expression.find('}') {
                    let var_name = &expression[start+2..end];
                    // Check if variable exists and is truthy
                    return context.get(var_name)
                        .map(|v| v.as_bool().unwrap_or(v.as_str().is_some()))
                        .unwrap_or(false);
                }
            }
        }
        
        // Default to true for simple expressions
        true
    }

    /// Handle approval for an awaiting step
    pub async fn approve(
        &self,
        request: WorkflowApprovalRequest,
    ) -> Result<WorkflowInstance, WorkflowError> {
        let mut instances = self.instances.write().await;
        let instance = instances.get_mut(&request.instance_id)
            .ok_or_else(|| WorkflowError::InstanceNotFound(request.instance_id.clone()))?;

        // Update context with approval result
        instance.context["last_approval"] = serde_json::json!({
            "step_id": request.step_id,
            "approved": request.approved,
            "comment": request.comment,
            "approver_id": request.approver_id,
            "approved_at": Utc::now().to_rfc3339(),
        });
        instance.context["last_success"] = serde_json::json!(request.approved);

        // Resume execution
        instance.state = WorkflowState::Running;
        instance.updated_at = Utc::now();

        let result = instance.clone();
        
        // Persist to store
        drop(instances);
        if let Some(store) = &self.store {
            let _ = store.save_instance(&result).await;
        }

        Ok(result)
    }

    /// Pause a workflow
    pub async fn pause(&self, instance_id: &str) -> Result<WorkflowInstance, WorkflowError> {
        let mut instances = self.instances.write().await;
        let instance = instances.get_mut(instance_id)
            .ok_or_else(|| WorkflowError::InstanceNotFound(instance_id.to_string()))?;

        if instance.state == WorkflowState::Running {
            instance.state = WorkflowState::Paused;
            instance.updated_at = Utc::now();
        }

        let result = instance.clone();
        
        // Persist to store
        drop(instances);
        if let Some(store) = &self.store {
            let _ = store.save_instance(&result).await;
        }

        Ok(result)
    }

    /// Resume a paused workflow
    pub async fn resume(&self, instance_id: &str) -> Result<WorkflowInstance, WorkflowError> {
        let mut instances = self.instances.write().await;
        let instance = instances.get_mut(instance_id)
            .ok_or_else(|| WorkflowError::InstanceNotFound(instance_id.to_string()))?;

        if instance.state == WorkflowState::Paused {
            instance.state = WorkflowState::Running;
            instance.updated_at = Utc::now();
        }

        let result = instance.clone();
        
        // Persist to store
        drop(instances);
        if let Some(store) = &self.store {
            let _ = store.save_instance(&result).await;
        }

        Ok(result)
    }

    /// Cancel a workflow
    pub async fn cancel(&self, instance_id: &str) -> Result<WorkflowInstance, WorkflowError> {
        let mut instances = self.instances.write().await;
        let instance = instances.get_mut(instance_id)
            .ok_or_else(|| WorkflowError::InstanceNotFound(instance_id.to_string()))?;

        instance.state = WorkflowState::Cancelled;
        instance.updated_at = Utc::now();

        let result = instance.clone();
        
        // Persist to store
        drop(instances);
        if let Some(store) = &self.store {
            let _ = store.save_instance(&result).await;
        }

        Ok(result)
    }

    /// Get instance by ID
    pub async fn get(&self, instance_id: &str) -> Option<WorkflowInstance> {
        let instances = self.instances.read().await;
        instances.get(instance_id).cloned()
    }

    /// List all instances for a tenant
    pub async fn list_by_tenant(&self, tenant_id: &str) -> Vec<WorkflowInstance> {
        // First get from store
        if let Some(store) = &self.store {
            if let Ok(instances) = store.list_instances(tenant_id).await {
                return instances;
            }
        }

        // Fallback to in-memory
        let instances = self.instances.read().await;
        instances.values()
            .filter(|i| i.tenant_id == tenant_id)
            .cloned()
            .collect()
    }

    /// List definitions for a tenant
    pub async fn list_definitions_by_tenant(&self, tenant_id: &str) -> Vec<WorkflowDefinition> {
        if let Some(store) = &self.store {
            if let Ok(definitions) = store.list_definitions(tenant_id).await {
                return definitions;
            }
        }

        let defs = self.definitions.read().await;
        defs.values()
            .filter(|d| d.tenant_id == tenant_id)
            .cloned()
            .collect()
    }
}

impl Default for WorkflowEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// Workflow errors
#[derive(Debug, thiserror::Error)]
pub enum WorkflowError {
    #[error("Definition not found: {0}")]
    DefinitionNotFound(String),

    #[error("Instance not found: {0}")]
    InstanceNotFound(String),

    #[error("Step not found: {0}")]
    StepNotFound(String),

    #[error("Execution error: {0}")]
    ExecutionError(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Store not configured")]
    StoreNotConfigured,
}

// Extend WorkflowStep with helper methods
impl WorkflowStep {
    pub fn id(&self) -> String {
        match self {
            WorkflowStep::Action { id, .. } => id.clone(),
            WorkflowStep::Approval { id, .. } => id.clone(),
            WorkflowStep::Condition { id, .. } => id.clone(),
            WorkflowStep::End { .. } => "end".to_string(),
        }
    }

    pub fn type_name(&self) -> &'static str {
        match self {
            WorkflowStep::Action { .. } => "action",
            WorkflowStep::Approval { .. } => "approval",
            WorkflowStep::Condition { .. } => "condition",
            WorkflowStep::End { .. } => "end",
        }
    }
}
