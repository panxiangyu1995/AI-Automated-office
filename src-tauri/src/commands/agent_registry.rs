//! Agent Registry and Permission Tauri Commands
//!
//! Provides Tauri commands for:
//! - Agent registry management (CRUD operations)
//! - Permission checking
//! - Config loading and merging
//!
//! See spec: openspec/changes/subagent-architecture-alignment/

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;
use tokio::sync::RwLock;

use crate::agent::config::AgentConfig;
use crate::agent::mode::{AgentInfo, AgentMode};
use crate::agent::permission::{
    default_office_ruleset, PermissionAction, PermissionChecker, PermissionRule, Ruleset,
};
use crate::agent::template::{self};

// ==================== Agent Registry State ====================

#[derive(Debug, Clone, Default)]
pub struct AgentRegistryState {
    agents: HashMap<String, AgentInfo>,
    configs: HashMap<String, AgentConfig>,
}

impl AgentRegistryState {
    pub fn new() -> Self {
        let mut state = Self::default();

        // Register default office templates
        let general_config = template::create_office_general_config();
        let specialist_config = template::create_office_specialist_config();

        // Create AgentInfo for each template
        let general_info = AgentInfo {
            name: general_config.name.clone(),
            mode: AgentMode::Primary,
            native: true,
            hidden: false,
            description: general_config.description.clone(),
            skills: general_config.skills.clone(),
            tools: general_config.tools.clone(),
        };

        let specialist_info = AgentInfo {
            name: specialist_config.name.clone(),
            mode: AgentMode::Subagent,
            native: true,
            hidden: false,
            description: specialist_config.description.clone(),
            skills: specialist_config.skills.clone(),
            tools: specialist_config.tools.clone(),
        };

        state.agents.insert(general_info.name.clone(), general_info);
        state.configs.insert(general_config.name.clone(), general_config);

        state.agents.insert(specialist_info.name.clone(), specialist_info);
        state.configs.insert(specialist_config.name.clone(), specialist_config);

        state
    }
}

// ==================== Request/Response Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListAgentsResponse {
    pub agents: Vec<AgentInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetAgentResponse {
    pub agent: Option<AgentInfo>,
    pub config: Option<AgentConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckPermissionRequest {
    pub agent_name: String,
    pub operation: String,
    pub resource: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckPermissionResponse {
    pub allowed: bool,
    pub action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAgentRequest {
    pub name: String,
    pub mode: String,
    pub description: String,
    pub skills: Vec<String>,
    pub tools: Vec<String>,
    pub permissions: HashMap<String, HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAgentRequest {
    pub name: String,
    pub description: Option<String>,
    pub skills: Option<Vec<String>>,
    pub tools: Option<Vec<String>>,
    pub permissions: Option<HashMap<String, HashMap<String, String>>>,
    pub enabled: Option<bool>,
}

// ==================== Tauri Commands ====================

/// List all agents
#[tauri::command]
pub async fn list_agents(
    state: State<'_, RwLock<AgentRegistryState>>,
) -> Result<ListAgentsResponse, String> {
    let state = state.read().await;
    let agents: Vec<AgentInfo> = state.agents.values().cloned().collect();
    Ok(ListAgentsResponse { agents })
}

/// Get agent by name
#[tauri::command]
pub async fn get_agent(
    name: String,
    state: State<'_, RwLock<AgentRegistryState>>,
) -> Result<GetAgentResponse, String> {
    let state = state.read().await;
    let agent = state.agents.get(&name).cloned();
    let config = state.configs.get(&name).cloned();
    Ok(GetAgentResponse { agent, config })
}

/// Create a new agent
#[tauri::command]
pub async fn create_agent(
    request: CreateAgentRequest,
    state: State<'_, RwLock<AgentRegistryState>>,
) -> Result<AgentInfo, String> {
    let mut state = state.write().await;

    // Check if agent already exists
    if state.agents.contains_key(&request.name) {
        return Err(format!("Agent '{}' already exists", request.name));
    }

    // Validate mode
    let mode = match request.mode.to_lowercase().as_str() {
        "primary" => AgentMode::Primary,
        "subagent" => AgentMode::Subagent,
        _ => return Err(format!("Invalid mode '{}'", request.mode)),
    };

    let agent_info = AgentInfo {
        name: request.name.clone(),
        mode,
        native: false,
        hidden: false,
        description: request.description.clone(),
        skills: request.skills.clone(),
        tools: request.tools.clone(),
    };

    let config = AgentConfig {
        name: request.name.clone(),
        mode: request.mode.clone(),
        description: request.description,
        prompt: String::new(),
        skills: request.skills,
        tools: request.tools,
        mcp_tools: vec![],
        permissions: request.permissions,
        options: Default::default(),
    };

    state.agents.insert(request.name.clone(), agent_info.clone());
    state.configs.insert(request.name, config);

    Ok(agent_info)
}

/// Update an agent
#[tauri::command]
pub async fn update_agent(
    request: UpdateAgentRequest,
    state: State<'_, RwLock<AgentRegistryState>>,
) -> Result<AgentInfo, String> {
    // First check if agent exists and is not native
    {
        let state_read = state.read().await;
        let agent = state_read
            .agents
            .get(&request.name)
            .ok_or_else(|| format!("Agent '{}' not found", request.name))?;
        if agent.native {
            return Err("Cannot update native agents".to_string());
        }
    }

    // Now do the update
    let mut state = state.write().await;

    // Update agent info
    let agent_result = {
        let agent = state
            .agents
            .get_mut(&request.name)
            .ok_or_else(|| format!("Agent '{}' not found", request.name))?;

        if let Some(desc) = request.description.clone() {
            agent.description = desc;
        }
        if let Some(skills) = request.skills.clone() {
            agent.skills = skills;
        }
        if let Some(tools) = request.tools.clone() {
            agent.tools = tools;
        }

        agent.clone()
    };

    // Update config if permissions changed
    if let Some(perms) = request.permissions {
        if let Some(config) = state.configs.get_mut(&request.name) {
            config.permissions = perms;
        }
    }

    Ok(agent_result)
}

/// Delete an agent
#[tauri::command]
pub async fn delete_agent(
    name: String,
    state: State<'_, RwLock<AgentRegistryState>>,
) -> Result<bool, String> {
    let mut state = state.write().await;

    // Check if agent exists
    let agent = state
        .agents
        .get(&name)
        .ok_or_else(|| format!("Agent '{}' not found", name))?;

    // Don't allow deleting native agents
    if agent.native {
        return Err("Cannot delete native agents".to_string());
    }

    state.agents.remove(&name);
    state.configs.remove(&name);

    Ok(true)
}

/// Check permission for an operation
#[tauri::command]
pub async fn check_permission(
    request: CheckPermissionRequest,
    state: State<'_, RwLock<AgentRegistryState>>,
) -> Result<CheckPermissionResponse, String> {
    let state = state.read().await;

    // Get agent config
    let config = state
        .configs
        .get(&request.agent_name)
        .ok_or_else(|| format!("Agent '{}' not found", request.agent_name))?;

    // Build ruleset from config permissions
    let mut rules: Ruleset = config
        .permissions
        .iter()
        .flat_map(|(op, patterns)| {
            patterns.iter().map(|(pattern, action)| {
                let perm_action = match action.to_lowercase().as_str() {
                    "allow" => PermissionAction::Allow,
                    "deny" => PermissionAction::Deny,
                    _ => PermissionAction::Ask,
                };
                PermissionRule::new(op, pattern, perm_action)
            }).collect::<Vec<_>>()
        })
        .collect();

    // Add default rules
    rules.extend(default_office_ruleset());

    let checker = PermissionChecker::with_defaults(rules);
    let action = checker.check(&request.operation, &request.resource);

    Ok(CheckPermissionResponse {
        allowed: matches!(action, PermissionAction::Allow),
        action: format!("{:?}", action).to_lowercase(),
    })
}

/// Get default agent (respects mode constraints)
#[tauri::command]
pub async fn get_default_agent(
    state: State<'_, RwLock<AgentRegistryState>>,
) -> Result<Option<AgentInfo>, String> {
    let state = state.read().await;

    let default_agent = state
        .agents
        .values()
        .find(|a| a.can_be_default() && a.is_visible())
        .cloned();

    Ok(default_agent)
}

/// Initialize agent registry state
pub fn create_agent_registry_state() -> RwLock<AgentRegistryState> {
    RwLock::new(AgentRegistryState::new())
}
