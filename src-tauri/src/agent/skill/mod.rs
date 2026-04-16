//! Skill system for progressive loading and execution.
//!
//! # Architecture
//!
//! - `discovery/`: Discover skills from files, plugins, registry
//! - `parser/`: Parse SKILL.md files (YAML frontmatter)
//! - `loader/`: Progressive skill loader
//! - `registry/`: Skill registry with executor management
//! - `executor/`: Skill execution service
//! - `converter/`: Format converter (JSON/YAML)
//! - `version/`: Version compatibility management
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::agent::skill::{SkillRegistry, SkillExecutorService};
//!
//! let registry = SkillRegistry::new();
//! let executor = SkillExecutorService::new();
//! ```

pub mod types;
pub mod config;
pub mod discovery;
pub mod parser;
pub mod loader;
pub mod registry;
pub mod executor;
pub mod converter;
pub mod version;

// Re-exports
pub use types::{
    Skill, SkillCategory, SkillEndpoint, SkillDependency, SkillMetadata,
    SkillExecutionContext, SkillExecutionResult, SkillDiscoveryResult,
    SkillLoadResult, LoadingStage, LoadingProgress,
    Permission, PermissionType, AccessLevel,
    ParametersSchema,
};
pub use config::{SkillError, SkillErrorCode, ValidationResult};
pub use discovery::SkillDiscoveryService;
pub use loader::SkillLoader;
pub use loader::SkillLoaderTrait;
pub use registry::{SkillRegistry, SkillExecutor};
pub use converter::SkillConverter;

use std::sync::Arc;
use tauri::State;
use semver::Version;

// ============================================================================
// Tauri Commands
// ============================================================================

/// List all registered skills
#[tauri::command]
pub async fn skill_list(
    state: State<'_, Arc<SkillRegistry>>,
) -> Result<Vec<Skill>, String> {
    Ok(state.list().await)
}

/// Get a skill by ID
#[tauri::command]
pub async fn skill_get(
    skill_id: String,
    state: State<'_, Arc<SkillRegistry>>,
) -> Result<Option<Skill>, String> {
    Ok(state.get(&skill_id).await)
}

/// Execute a skill
#[tauri::command]
pub async fn skill_execute(
    ctx: SkillExecutionContext,
    state: State<'_, Arc<SkillRegistry>>,
) -> Result<SkillExecutionResult, String> {
    state.execute(&ctx).await.map_err(|e| e.to_string())
}

/// Discover skills
#[tauri::command]
pub async fn skill_discover(
    state: State<'_, Arc<SkillDiscoveryService>>,
) -> Result<SkillDiscoveryResult, String> {
    state.discover_all().await.map_err(|e| e.to_string())
}

/// Get loading progress
#[tauri::command]
pub async fn skill_loading_progress(
    state: State<'_, Arc<SkillLoader>>,
) -> Result<LoadingProgress, String> {
    Ok(state.progress().await)
}

/// Search skills
#[tauri::command]
pub async fn skill_search(
    query: String,
    state: State<'_, Arc<SkillDiscoveryService>>,
) -> Result<Vec<Skill>, String> {
    Ok(state.search(&query).await)
}

/// Validate a skill
#[tauri::command]
pub async fn skill_validate(
    skill: Skill,
) -> Result<ValidationResult, String> {
    // Basic validation
    let mut errors = Vec::new();
    let warnings = Vec::new();

    if skill.id.is_empty() {
        errors.push("Skill ID cannot be empty".to_string());
    }

    if skill.name.is_empty() {
        errors.push("Skill name cannot be empty".to_string());
    }

    if Version::parse(&skill.version).is_err() {
        errors.push(format!("Invalid version format: {}", skill.version));
    }

    Ok(ValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
    })
}
