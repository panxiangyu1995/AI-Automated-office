//! Skill system Tauri commands.

use std::sync::Arc;
use tokio::sync::RwLock;

use tauri::State;

use crate::agent::skill::{
    Skill, SkillError, SkillExecutionContext, SkillExecutionResult,
    SkillRegistry, SkillDiscoveryService, SkillLoader, SkillConverter,
};
use crate::agent::skill::types::ParametersSchema;
use crate::agent::skill::parser::SkillParserTrait;

/// Global skill registry instance
static SKILL_REGISTRY: once_cell::sync::Lazy<Arc<RwLock<SkillRegistry>>> =
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(SkillRegistry::new())));

/// Global discovery service instance
static DISCOVERY_SERVICE: once_cell::sync::Lazy<Arc<RwLock<SkillDiscoveryService>>> =
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(SkillDiscoveryService::new())));

/// Global loader instance
static SKILL_LOADER: once_cell::sync::Lazy<Arc<RwLock<SkillLoader>>> =
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(SkillLoader::new())));

/// Global converter instance
static SKILL_CONVERTER: once_cell::sync::Lazy<Arc<SkillConverter>> =
    once_cell::sync::Lazy::new(|| Arc::new(SkillConverter::new()));

/// Response wrapper for skill operations
#[derive(serde::Serialize)]
pub struct SkillResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> SkillResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

/// Skill info for frontend display
#[derive(serde::Serialize, Clone)]
pub struct SkillInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub category: String,
    pub enabled: bool,
    pub load_priority: String,
    pub author: String,
    pub tags: Vec<String>,
    pub capability_count: usize,
}

impl From<Skill> for SkillInfo {
    fn from(skill: Skill) -> Self {
        Self {
            id: skill.id.clone(),
            name: skill.name.clone(),
            version: skill.version.clone(),
            description: skill.description.clone(),
            category: format!("{:?}", skill.category),
            enabled: true,
            load_priority: "normal".to_string(),
            author: skill.metadata.author.clone(),
            tags: skill.metadata.tags.clone(),
            capability_count: skill.endpoints.len(),
        }
    }
}

/// Discovery result for frontend
#[derive(serde::Serialize)]
pub struct DiscoveryResult {
    pub skills: Vec<SkillInfo>,
    pub total: usize,
    pub source: String,
}

/// Loading progress for frontend
#[derive(serde::Serialize)]
pub struct LoadingProgress {
    pub skill_id: String,
    pub skill_name: String,
    pub progress: f32,
    pub status: String,
    pub dependencies_loaded: usize,
    pub dependencies_total: usize,
}

/// Execution context for frontend
#[derive(serde::Deserialize)]
pub struct ExecuteRequest {
    pub skill_id: String,
    pub endpoint: String,
    pub parameters: serde_json::Value,
    pub user_id: Option<String>,
    pub tenant_id: Option<String>,
}

/// Register a skill from SKILL.md content
pub async fn skill_register(content: String) -> Result<SkillResponse<SkillInfo>, String> {
    let parser = crate::agent::skill::parser::SkillParser::new();

    match parser.parse(&content).await {
        Ok(skill) => {
            let registry = SKILL_REGISTRY.read().await;
            match registry.register(skill.clone()).await {
                Ok(_) => Ok(SkillResponse::ok(skill.into())),
                Err(e) => Ok(SkillResponse::err(e.to_string())),
            }
        }
        Err(e) => Ok(SkillResponse::err(e.to_string())),
    }
}

/// Unregister a skill
pub async fn skill_unregister(skill_id: String) -> Result<SkillResponse<()>, String> {
    let registry = SKILL_REGISTRY.read().await;
    match registry.unregister(&skill_id).await {
        Ok(_) => Ok(SkillResponse::ok(())),
        Err(e) => Ok(SkillResponse::err(e.to_string())),
    }
}

/// List all registered skills
pub async fn skill_list() -> Result<SkillResponse<Vec<SkillInfo>>, String> {
    let registry = SKILL_REGISTRY.read().await;
    let skills = registry.list().await;
    let skill_infos: Vec<SkillInfo> = skills.into_iter().map(|s| s.into()).collect();
    Ok(SkillResponse::ok(skill_infos))
}

/// Get a skill by ID
pub async fn skill_get(skill_id: String) -> Result<SkillResponse<Option<SkillInfo>>, String> {
    let registry = SKILL_REGISTRY.read().await;
    let skill = registry.get(&skill_id).await;
    Ok(SkillResponse::ok(skill.map(|s| s.into())))
}

/// Execute a skill endpoint
pub async fn skill_execute(
    skill_id: String,
    endpoint: String,
    parameters: serde_json::Value,
) -> Result<SkillResponse<SkillExecutionResult>, String> {
    // Convert serde_json::Value to HashMap
    let parameters_map: std::collections::HashMap<String, serde_json::Value> =
        parameters.as_object()
            .map(|m| m.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
            .unwrap_or_default();

    let ctx = SkillExecutionContext {
        skill_id: skill_id.clone(),
        endpoint: endpoint.clone(),
        parameters: parameters_map,
        user_id: None,
        tenant_id: String::new(), // Default empty tenant
        session_id: None,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };

    let registry = SKILL_REGISTRY.read().await;
    match registry.execute(&ctx).await {
        Ok(result) => Ok(SkillResponse::ok(result)),
        Err(e) => Ok(SkillResponse::err(e.to_string())),
    }
}

/// Discover skills from all sources
pub async fn skill_discover() -> Result<SkillResponse<DiscoveryResult>, String> {
    let service = DISCOVERY_SERVICE.read().await;
    match service.discover_all().await {
        Ok(result) => {
            let skill_infos: Vec<SkillInfo> = result.skills.into_iter().map(|s| s.into()).collect();
            Ok(SkillResponse::ok(DiscoveryResult {
                skills: skill_infos,
                total: result.total,
                source: result.source,
            }))
        }
        Err(e) => Ok(SkillResponse::err(e.to_string())),
    }
}

/// Search skills by query
pub async fn skill_search(query: String) -> Result<SkillResponse<Vec<SkillInfo>>, String> {
    let service = DISCOVERY_SERVICE.read().await;
    let skills = service.search(&query).await;
    let skill_infos: Vec<SkillInfo> = skills.into_iter().map(|s| s.into()).collect();
    Ok(SkillResponse::ok(skill_infos))
}

/// Get loading progress for a skill
pub async fn skill_loading_progress(skill_id: String) -> Result<SkillResponse<LoadingProgress>, String> {
    let loader = SKILL_LOADER.read().await;
    match loader.get_progress(&skill_id).await {
        Some(progress) => Ok(SkillResponse::ok(LoadingProgress {
            skill_id: skill_id.clone(),
            skill_name: String::new(), // Not available from progress
            progress: progress.progress as f32 / 100.0, // Convert 0-100 to 0.0-1.0
            status: format!("{:?}", progress.stage),
            dependencies_loaded: progress.skills_loaded,
            dependencies_total: progress.total_skills,
        })),
        None => Ok(SkillResponse::err(format!("Skill {} not found or not loading", skill_id))),
    }
}

/// Load skills progressively
pub async fn skill_load_all() -> Result<SkillResponse<Vec<SkillInfo>>, String> {
    let discovery = DISCOVERY_SERVICE.read().await;
    let result = discovery.discover_all().await;
    drop(discovery);

    match result {
        Ok(discovery_result) => {
            let loader = SKILL_LOADER.read().await;
            let loaded = loader.load_skills(discovery_result.skills).await;
            let skill_infos: Vec<SkillInfo> = loaded.into_iter().map(|s| s.into()).collect();
            Ok(SkillResponse::ok(skill_infos))
        }
        Err(e) => Ok(SkillResponse::err(e.to_string())),
    }
}

/// Convert a skill to tool descriptor
pub async fn skill_to_tool(skill_id: String) -> Result<SkillResponse<serde_json::Value>, String> {
    let registry = SKILL_REGISTRY.read().await;
    match registry.get(&skill_id).await {
        Some(skill) => {
            let tool = SKILL_CONVERTER.skill_to_tool(&skill);
            Ok(SkillResponse::ok(tool))
        }
        None => Ok(SkillResponse::err(format!("Skill {} not found", skill_id))),
    }
}

/// Get skill count
pub async fn skill_count() -> Result<SkillResponse<usize>, String> {
    let registry = SKILL_REGISTRY.read().await;
    let count = registry.count().await;
    Ok(SkillResponse::ok(count))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_skill_register_and_list() {
        let content = r#"---
id: test-skill
name: Test Skill
version: 1.0.0
description: A test skill
category: custom
author: test
tags:
  - test
---
# Test Skill"#;

        let result = skill_register(content.to_string()).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.success);
        assert!(response.data.is_some());

        let list_result = skill_list().await;
        assert!(list_result.is_ok());
        let list_response = list_result.unwrap();
        assert!(list_response.success);
    }
}