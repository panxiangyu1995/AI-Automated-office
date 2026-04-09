//! Capability Version Commands
//!
//! Tauri commands for capability package version management (FR800-FR802)

use tauri::State;
use std::sync::Arc;
use std::collections::HashMap;
use crate::capability::version_manager::{
    VersionManagerService, VersionInfo, VersionUpdate, RollbackPoint,
    CompatibilityResult, UpdateStatus,
};

/// Check version for a package
#[tauri::command]
pub async fn check_package_version(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    current_version: String,
) -> Result<VersionInfo, String> {
    Ok(service.check_version(&package_id, &current_version).await)
}

/// Check version with marketplace lookup
#[tauri::command]
pub async fn check_package_version_with_marketplace(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    current_version: String,
    latest_version: Option<String>,
) -> Result<VersionInfo, String> {
    Ok(service.check_version_with_marketplace(&package_id, &current_version, latest_version).await)
}

/// Start an update
#[tauri::command]
pub async fn start_package_update(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    from_version: String,
    to_version: String,
) -> Result<VersionUpdate, String> {
    Ok(service.start_update(package_id, from_version, to_version).await)
}

/// Complete an update
#[tauri::command]
pub async fn complete_package_update(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    update_id: String,
    changes: Vec<crate::capability::version_manager::VersionChange>,
) -> Result<bool, String> {
    Ok(service.complete_update(&package_id, &update_id, changes).await)
}

/// Fail an update
#[tauri::command]
pub async fn fail_package_update(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    update_id: String,
    error: String,
) -> Result<bool, String> {
    Ok(service.fail_update(&package_id, &update_id, error).await)
}

/// Get update history
#[tauri::command]
pub async fn get_package_update_history(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
) -> Result<Vec<VersionUpdate>, String> {
    Ok(service.get_update_history(&package_id).await)
}

/// Create rollback point
#[tauri::command]
pub async fn create_rollback_point(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    version: String,
    snapshot_path: String,
    description: String,
) -> Result<RollbackPoint, String> {
    Ok(service.create_rollback_point(package_id, version, snapshot_path, description).await)
}

/// Get rollback points
#[tauri::command]
pub async fn get_rollback_points(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
) -> Result<Vec<RollbackPoint>, String> {
    Ok(service.get_rollback_points(&package_id).await)
}

/// Rollback to a specific version
#[tauri::command]
pub async fn rollback_package(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    rollback_id: String,
) -> Result<RollbackPoint, String> {
    service.rollback(&package_id, &rollback_id).await
}

/// Check version compatibility
#[tauri::command]
pub async fn check_package_compatibility(
    service: State<'_, Arc<VersionManagerService>>,
    package_id: String,
    current_version: String,
    target_version: String,
    dependencies: HashMap<String, String>,
) -> Result<CompatibilityResult, String> {
    Ok(service.check_compatibility(&package_id, &current_version, &target_version, &dependencies).await)
}

/// Get all version infos
#[tauri::command]
pub async fn get_all_version_infos(
    service: State<'_, Arc<VersionManagerService>>,
) -> Result<Vec<VersionInfo>, String> {
    Ok(service.get_all_version_infos().await)
}

/// Clear version cache
#[tauri::command]
pub async fn clear_version_cache(
    service: State<'_, Arc<VersionManagerService>>,
) -> Result<(), String> {
    service.clear_cache().await;
    Ok(())
}

/// Get update status enum values
#[tauri::command]
pub fn get_update_status_values() -> Vec<String> {
    vec![
        "available".to_string(),
        "in_progress".to_string(),
        "completed".to_string(),
        "failed".to_string(),
        "rolled_back".to_string(),
    ]
}
