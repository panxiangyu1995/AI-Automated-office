//! Subagent Tauri Commands
//!
//! 提供前端调用的 Subagent 相关命令

use std::sync::Arc;
use tauri::State;

use crate::agent::subagent::{
    get_subagent_manager, init_subagent_manager,
    types::{AgentConfig, SubagentResult},
    CreatePersonalSubagentRequest, PersonalLoader, UpdatePersonalSubagentRequest,
};
use crate::agent::subagent::manager::SubagentStats;
use crate::agent::subagent::types::{ModelProvider, TriggerConfig, ToolPermissions, LimitsConfig};

/// 获取当前用户 ID（临时实现，后续从认证系统获取）
fn get_current_user_id() -> String {
    // TODO: 从认证系统获取当前用户 ID
    "default-user".to_string()
}

/// 获取所有可用的 Subagent 列表
#[tauri::command]
pub async fn get_available_subagents() -> Result<Vec<AgentConfig>, String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();
    manager.list_available(&user_id)
        .await
        .map_err(|e| e.to_string())
}

/// 获取单个 Subagent 配置
#[tauri::command]
pub async fn get_subagent_config(name: String) -> Result<Option<AgentConfig>, String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();
    manager.get(&user_id, &name)
        .await
        .map_err(|e| e.to_string())
}

/// 获取 Subagent 统计信息
#[tauri::command]
pub async fn get_subagent_stats() -> Result<SubagentStats, String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();
    manager.get_stats(&user_id)
        .await
        .map_err(|e| e.to_string())
}

/// 根据关键词匹配 Subagent
#[tauri::command]
pub async fn match_subagents_by_keywords(keywords: Vec<String>) -> Result<Vec<AgentConfig>, String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();
    manager.match_by_keywords(&user_id, &keywords)
        .await
        .map_err(|e| e.to_string())
}

/// 创建 Personal Subagent
#[tauri::command]
pub async fn create_personal_subagent(
    name: String,
    display_name: String,
    description: Option<String>,
    model_provider: String,
    model_id: String,
    temperature: f32,
    max_tokens: u32,
    prompt: String,
    trigger_mode: String,
    trigger_keywords: Vec<String>,
    allowed_tools: Vec<String>,
) -> Result<AgentConfig, String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();

    let loader = manager.get_personal_loader(&user_id)
        .await
        .map_err(|e| e.to_string())?;

    let loader = loader
        .downcast_ref::<PersonalLoader>()
        .ok_or("Failed to get PersonalLoader")?;

    let trigger = TriggerConfig {
        mode: match trigger_mode.as_str() {
            "auto" => crate::agent::subagent::types::TriggerMode::Auto,
            "hybrid" => crate::agent::subagent::types::TriggerMode::Hybrid,
            _ => crate::agent::subagent::types::TriggerMode::Manual,
        },
        keywords: trigger_keywords,
        conditions: Vec::new(),
        priority: 5,
    };

    let request = CreatePersonalSubagentRequest {
        name,
        display_name,
        description,
        model: ModelProvider {
            provider: model_provider,
            model_id,
            temperature,
            max_tokens,
        },
        prompt,
        trigger,
        tools: ToolPermissions {
            allowed: allowed_tools,
            denied: Vec::new(),
            constraints: Default::default(),
        },
        knowledge_sources: Vec::new(),
        limits: LimitsConfig {
            max_steps: 20,
            max_concurrent: 1,
            timeout_seconds: 300,
        },
    };

    loader.create(&request)
        .await
        .map_err(|e| e.to_string())
}

/// 更新 Personal Subagent
#[tauri::command]
pub async fn update_personal_subagent(
    name: String,
    display_name: Option<String>,
    description: Option<String>,
    prompt: Option<String>,
    enabled: Option<bool>,
) -> Result<AgentConfig, String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();

    let loader = manager.get_personal_loader(&user_id)
        .await
        .map_err(|e| e.to_string())?;

    let loader = loader
        .downcast_ref::<PersonalLoader>()
        .ok_or("Failed to get PersonalLoader")?;

    let request = UpdatePersonalSubagentRequest {
        display_name,
        description,
        model: None,
        prompt,
        trigger: None,
        tools: None,
        enabled,
    };

    loader.update(&name, &request)
        .await
        .map_err(|e| e.to_string())
}

/// 删除 Personal Subagent
#[tauri::command]
pub async fn delete_personal_subagent(name: String) -> Result<(), String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();

    let loader = manager.get_personal_loader(&user_id)
        .await
        .map_err(|e| e.to_string())?;

    let loader = loader
        .downcast_ref::<PersonalLoader>()
        .ok_or("Failed to get PersonalLoader")?;

    loader.delete(&name)
        .await
        .map_err(|e| e.to_string())
}

/// 获取 Personal Subagent 列表
#[tauri::command]
pub async fn list_personal_subagents() -> Result<Vec<AgentConfig>, String> {
    let user_id = get_current_user_id();
    let manager = get_subagent_manager();

    let loader = manager.get_personal_loader(&user_id)
        .await
        .map_err(|e| e.to_string())?;

    loader.load_all()
        .map_err(|e| e.to_string())
}

/// 获取 Department Subagent 列表
#[tauri::command]
pub fn list_department_subagents() -> Result<Vec<AgentConfig>, String> {
    let manager = get_subagent_manager();
    manager.department_loader()
        .load_all()
        .map_err(|e| e.to_string())
}

/// 获取 Hidden Subagent 列表
#[tauri::command]
pub async fn list_hidden_subagents() -> Result<Vec<AgentConfig>, String> {
    let manager = get_subagent_manager();
    let configs = manager.list_available(&get_current_user_id())
        .await
        .map_err(|e| e.to_string())?;

    Ok(configs
        .into_iter()
        .filter(|c| c.agent_type == crate::agent::subagent::types::AgentType::Hidden)
        .collect())
}

/// 初始化 Subagent 系统
pub fn init_subagent_commands() {
    // 使用默认模型初始化全局管理器
    let _ = init_subagent_manager(Some(ModelProvider {
        provider: "openai".to_string(),
        model_id: "gpt-4o".to_string(),
        temperature: 0.7,
        max_tokens: 4096,
    }));
}
