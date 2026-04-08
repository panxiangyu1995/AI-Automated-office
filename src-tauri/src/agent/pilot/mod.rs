//! Pilot module - Department integration binding and execution
//!
//! This module provides pilot binding functionality for Finance, Approval, and Sales departments.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

/// Pilot department type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PilotDepartment {
    Finance,
    Approval,
    Sales,
}

impl std::fmt::Display for PilotDepartment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PilotDepartment::Finance => write!(f, "finance"),
            PilotDepartment::Approval => write!(f, "approval"),
            PilotDepartment::Sales => write!(f, "sales"),
        }
    }
}

/// Binding status for pilot tools
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum BindingStatus {
    Pending,
    Bound,
    Failed,
    Released,
}

/// Tool binding information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolBinding {
    pub tool_id: String,
    pub tool_name: String,
    pub status: BindingStatus,
    pub permission: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_used: Option<u64>,
    pub usage_count: u32,
}

/// Pilot execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PilotResult {
    pub success: bool,
    pub department: String,
    pub action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub duration_ms: u64,
}

/// Execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    Idle,
    Running,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

/// State for pilot bindings
pub struct PilotState {
    bindings: RwLock<Vec<ToolBinding>>,
    execution_history: RwLock<Vec<PilotResult>>,
}

impl PilotState {
    pub fn new() -> Self {
        Self {
            bindings: RwLock::new(Vec::new()),
            execution_history: RwLock::new(Vec::new()),
        }
    }

    /// Bind tools to a pilot department
    pub async fn bind_tools(&self, department: PilotDepartment, tools: Vec<String>) -> Result<Vec<ToolBinding>, String> {
        info!("Binding {} tools to pilot: {}", tools.len(), department);

        let mut bindings = Vec::new();
        for tool_id in tools {
            let binding = ToolBinding {
                tool_id: tool_id.clone(),
                tool_name: tool_id.clone(),
                status: BindingStatus::Bound,
                permission: "read".to_string(),
                last_used: None,
                usage_count: 0,
            };
            bindings.push(binding);
        }

        let mut state = self.bindings.write().await;
        state.extend(bindings.clone());

        Ok(bindings)
    }

    /// Execute a pilot action
    pub async fn execute(&self, department: PilotDepartment, action: String, _params: serde_json::Value) -> Result<PilotResult, String> {
        info!("Executing pilot action: {} for department: {}", action, department);

        let start = std::time::Instant::now();
        let result = PilotResult {
            success: true,
            department: department.to_string(),
            action: action.clone(),
            result: Some(format!("Action '{}' executed successfully", action)),
            error: None,
            duration_ms: start.elapsed().as_millis() as u64,
        };

        let mut history = self.execution_history.write().await;
        history.push(result.clone());

        Ok(result)
    }

    /// Get all bindings for a department
    pub async fn get_bindings(&self) -> Vec<ToolBinding> {
        self.bindings.read().await.clone()
    }

    /// Release bindings for a department
    pub async fn release_bindings(&self, department: PilotDepartment) -> Result<(), String> {
        info!("Releasing bindings for pilot: {}", department);
        let mut bindings = self.bindings.write().await;
        bindings.retain(|b| !b.department_matches(&department.to_string()));
        Ok(())
    }
}

impl Default for PilotState {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub async fn bind_pilot_tools(
    department: String,
    tools: Vec<String>,
    state: tauri::State<'_, Arc<PilotState>>,
) -> Result<Vec<ToolBinding>, String> {
    let dept = match department.as_str() {
        "finance" => PilotDepartment::Finance,
        "approval" => PilotDepartment::Approval,
        "sales" => PilotDepartment::Sales,
        _ => return Err(format!("Unknown department: {}", department)),
    };

    state.bind_tools(dept, tools).await
}

#[tauri::command]
pub async fn execute_pilot(
    department: String,
    action: String,
    params: serde_json::Value,
    state: tauri::State<'_, Arc<PilotState>>,
) -> Result<PilotResult, String> {
    let dept = match department.as_str() {
        "finance" => PilotDepartment::Finance,
        "approval" => PilotDepartment::Approval,
        "sales" => PilotDepartment::Sales,
        _ => return Err(format!("Unknown department: {}", department)),
    };

    state.execute(dept, action, params).await
}

#[tauri::command]
pub async fn get_pilot_bindings(
    state: tauri::State<'_, Arc<PilotState>>,
) -> Result<Vec<ToolBinding>, String> {
    Ok(state.get_bindings().await)
}

#[tauri::command]
pub async fn release_pilot_bindings(
    department: String,
    state: tauri::State<'_, Arc<PilotState>>,
) -> Result<(), String> {
    let dept = match department.as_str() {
        "finance" => PilotDepartment::Finance,
        "approval" => PilotDepartment::Approval,
        "sales" => PilotDepartment::Sales,
        _ => return Err(format!("Unknown department: {}", department)),
    };

    state.release_bindings(dept).await
}
