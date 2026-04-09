//! Capability Package Version Manager
//!
//! Implements FR800-FR802: Version management and update mechanism
//! - Version detection API
//! - Incremental update mechanism
//! - Rollback capability
//! - Version compatibility checking
//!
//! Story 40.1 - 部门能力包版本管理

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use super::types::*;

/// Version update status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UpdateStatus {
    Available,
    InProgress,
    Completed,
    Failed,
    RolledBack,
}

/// Version update entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionUpdate {
    pub update_id: String,
    pub package_id: String,
    pub from_version: String,
    pub to_version: String,
    pub status: UpdateStatus,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub error_message: Option<String>,
    pub changes: Vec<VersionChange>,
}

/// Version change entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionChange {
    pub change_type: String,
    pub file_path: Option<String>,
    pub description: String,
}

/// Rollback point
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RollbackPoint {
    pub rollback_id: String,
    pub package_id: String,
    pub version: String,
    pub created_at: i64,
    pub snapshot_path: String,
    pub description: String,
}

/// Version compatibility result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityResult {
    pub is_compatible: bool,
    pub issues: Vec<CompatibilityIssue>,
    pub warnings: Vec<String>,
}

/// Compatibility issue
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityIssue {
    pub severity: String,
    pub issue_type: String,
    pub description: String,
    pub affected_component: Option<String>,
}

/// Version info response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionInfo {
    pub package_id: String,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub update_available: bool,
    pub auto_update_enabled: bool,
    pub last_checked: Option<i64>,
}

/// Version manager service
pub struct VersionManagerService {
    updates: Arc<RwLock<HashMap<String, Vec<VersionUpdate>>>>,
    rollback_points: Arc<RwLock<HashMap<String, Vec<RollbackPoint>>>>,
    version_cache: Arc<RwLock<HashMap<String, VersionInfo>>>,
}

impl VersionManagerService {
    /// Create a new version manager service
    pub fn new() -> Self {
        Self {
            updates: Arc::new(RwLock::new(HashMap::new())),
            rollback_points: Arc::new(RwLock::new(HashMap::new())),
            version_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Check version for a package
    pub async fn check_version(&self, package_id: &str, current_version: &str) -> VersionInfo {
        let mut cache = self.version_cache.write().await;
        let info = VersionInfo {
            package_id: package_id.to_string(),
            current_version: current_version.to_string(),
            latest_version: None,
            update_available: false,
            auto_update_enabled: true,
            last_checked: Some(Utc::now().timestamp()),
        };
        cache.insert(package_id.to_string(), info.clone());
        info
    }

    /// Check version with marketplace lookup
    pub async fn check_version_with_marketplace(
        &self,
        package_id: &str,
        current_version: &str,
        latest_version: Option<String>,
    ) -> VersionInfo {
        let has_update = latest_version
            .as_ref()
            .map(|v| v != current_version)
            .unwrap_or(false);

        let mut cache = self.version_cache.write().await;
        let info = VersionInfo {
            package_id: package_id.to_string(),
            current_version: current_version.to_string(),
            latest_version,
            update_available: has_update,
            auto_update_enabled: true,
            last_checked: Some(Utc::now().timestamp()),
        };
        cache.insert(package_id.to_string(), info.clone());
        info
    }

    /// Start an update process
    pub async fn start_update(
        &self,
        package_id: String,
        from_version: String,
        to_version: String,
    ) -> VersionUpdate {
        let update = VersionUpdate {
            update_id: format!("update_{}", uuid::Uuid::new_v4()),
            package_id: package_id.clone(),
            from_version,
            to_version,
            status: UpdateStatus::InProgress,
            started_at: Utc::now().timestamp(),
            completed_at: None,
            error_message: None,
            changes: Vec::new(),
        };

        let mut updates = self.updates.write().await;
        let package_updates = updates.entry(package_id.clone()).or_insert_with(Vec::new);
        package_updates.push(update.clone());
        update
    }

    /// Complete an update
    pub async fn complete_update(
        &self,
        package_id: &str,
        update_id: &str,
        changes: Vec<VersionChange>,
    ) -> bool {
        let mut updates = self.updates.write().await;
        if let Some(package_updates) = updates.get_mut(package_id) {
            if let Some(update) = package_updates.iter_mut().find(|u| u.update_id == update_id) {
                update.status = UpdateStatus::Completed;
                update.completed_at = Some(Utc::now().timestamp());
                update.changes = changes;
                return true;
            }
        }
        false
    }

    /// Fail an update
    pub async fn fail_update(&self, package_id: &str, update_id: &str, error: String) -> bool {
        let mut updates = self.updates.write().await;
        if let Some(package_updates) = updates.get_mut(package_id) {
            if let Some(update) = package_updates.iter_mut().find(|u| u.update_id == update_id) {
                update.status = UpdateStatus::Failed;
                update.completed_at = Some(Utc::now().timestamp());
                update.error_message = Some(error);
                return true;
            }
        }
        false
    }

    /// Get update history for a package
    pub async fn get_update_history(&self, package_id: &str) -> Vec<VersionUpdate> {
        let updates = self.updates.read().await;
        updates.get(package_id).cloned().unwrap_or_default()
    }

    /// Create a rollback point
    pub async fn create_rollback_point(
        &self,
        package_id: String,
        version: String,
        snapshot_path: String,
        description: String,
    ) -> RollbackPoint {
        let rollback = RollbackPoint {
            rollback_id: format!("rb_{}", uuid::Uuid::new_v4()),
            package_id: package_id.clone(),
            version: version.clone(),
            created_at: Utc::now().timestamp(),
            snapshot_path,
            description,
        };

        let mut points = self.rollback_points.write().await;
        let package_points = points.entry(package_id.clone()).or_insert_with(Vec::new);

        // Keep only last 5 rollback points per package
        if package_points.len() >= 5 {
            package_points.remove(0);
        }
        package_points.push(rollback.clone());
        rollback
    }

    /// Get rollback points for a package
    pub async fn get_rollback_points(&self, package_id: &str) -> Vec<RollbackPoint> {
        let points = self.rollback_points.read().await;
        points.get(package_id).cloned().unwrap_or_default()
    }

    /// Rollback to a specific version
    pub async fn rollback(
        &self,
        package_id: &str,
        rollback_id: &str,
    ) -> Result<RollbackPoint, String> {
        let points = self.rollback_points.read().await;
        let package_points = points.get(package_id).ok_or("Package not found")?;

        let rollback = package_points
            .iter()
            .find(|p| p.rollback_id == rollback_id)
            .ok_or("Rollback point not found")?
            .clone();

        // Mark rollback as in progress
        drop(points);

        let mut updates = self.updates.write().await;
        let update = VersionUpdate {
            update_id: format!("update_{}", uuid::Uuid::new_v4()),
            package_id: package_id.to_string(),
            from_version: "current".to_string(),
            to_version: rollback.version.clone(),
            status: UpdateStatus::InProgress,
            started_at: Utc::now().timestamp(),
            completed_at: None,
            error_message: None,
            changes: vec![VersionChange {
                change_type: "rollback".to_string(),
                file_path: None,
                description: format!("Rollback to version {}", rollback.version),
            }],
        };

        let package_updates = updates.entry(package_id.to_string()).or_insert_with(Vec::new);
        package_updates.push(update);

        Ok(rollback)
    }

    /// Check version compatibility
    pub async fn check_compatibility(
        &self,
        package_id: &str,
        current_version: &str,
        target_version: &str,
        dependencies: &HashMap<String, String>,
    ) -> CompatibilityResult {
        let mut issues = Vec::new();
        let mut warnings = Vec::new();

        // Parse versions
        let current = match SemanticVersion::parse(current_version) {
            Ok(v) => v,
            Err(_) => {
                warnings.push(format!("Could not parse current version: {}", current_version));
                return CompatibilityResult {
                    is_compatible: false,
                    issues,
                    warnings,
                };
            }
        };

        let target = match SemanticVersion::parse(target_version) {
            Ok(v) => v,
            Err(_) => {
                warnings.push(format!("Could not parse target version: {}", target_version));
                return CompatibilityResult {
                    is_compatible: false,
                    issues,
                    warnings,
                };
            }
        };

        // Check major version change
        if target.major > current.major {
            issues.push(CompatibilityIssue {
                severity: "error".to_string(),
                issue_type: "major_version_change".to_string(),
                description: "Major version change may introduce breaking changes".to_string(),
                affected_component: Some(package_id.to_string()),
            });
        } else if target.major < current.major {
            warnings.push("Downgrading major version".to_string());
        }

        // Check minor version change
        if target.minor > current.minor && target.major == current.major {
            warnings.push(format!(
                "Minor version upgrade from {}.{}.{} to {}.{}.{}",
                current.major, current.minor, current.patch,
                target.major, target.minor, target.patch
            ));
        }

        // Check patch version
        if target.patch > current.patch && target.major == current.major && target.minor == current.minor {
            // Patch update is usually safe
        }

        // Check dependencies compatibility
        for (dep_id, dep_version) in dependencies {
            if dep_id == package_id {
                continue;
            }
            // In a real implementation, we would check if the dependency version is compatible
            warnings.push(format!("Dependency {} version {} compatibility not verified", dep_id, dep_version));
        }

        let is_compatible = issues.iter().all(|i| i.severity != "error");

        CompatibilityResult {
            is_compatible,
            issues,
            warnings,
        }
    }

    /// Get all version infos from cache
    pub async fn get_all_version_infos(&self) -> Vec<VersionInfo> {
        let cache = self.version_cache.read().await;
        cache.values().cloned().collect()
    }

    /// Clear version cache
    pub async fn clear_cache(&self) {
        let mut cache = self.version_cache.write().await;
        cache.clear();
    }
}

impl Default for VersionManagerService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_version_check() {
        let service = VersionManagerService::new();
        let info = service.check_version("test-package", "1.0.0").await;
        assert_eq!(info.package_id, "test-package");
        assert_eq!(info.current_version, "1.0.0");
        assert!(!info.update_available);
    }

    #[tokio::test]
    async fn test_update_history() {
        let service = VersionManagerService::new();

        let update = service.start_update(
            "test-package".to_string(),
            "1.0.0".to_string(),
            "1.1.0".to_string(),
        ).await;

        let history = service.get_update_history("test-package").await;
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].status, UpdateStatus::InProgress);
    }

    #[tokio::test]
    async fn test_rollback_points() {
        let service = VersionManagerService::new();

        let rollback = service.create_rollback_point(
            "test-package".to_string(),
            "1.0.0".to_string(),
            "/snapshots/test-package-1.0.0".to_string(),
            "Before update".to_string(),
        ).await;

        let points = service.get_rollback_points("test-package").await;
        assert_eq!(points.len(), 1);
        assert_eq!(points[0].version, "1.0.0");
    }

    #[tokio::test]
    async fn test_compatibility_check() {
        let service = VersionManagerService::new();
        let deps = HashMap::new();

        let result = service
            .check_compatibility("test-package", "1.0.0", "2.0.0", &deps)
            .await;

        assert!(!result.is_compatible);
        assert!(!result.issues.is_empty());
    }
}
