//! Dependency checker implementation.

use crate::capability::types::CapabilityPackageManifest;
use anyhow::Result;
use std::collections::HashMap;

/// Dependency information
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DependencyInfo {
    /// Package ID
    pub id: String,
    /// Package name
    pub name: String,
    /// Required version
    pub required_version: String,
    /// Current installed version (if any)
    pub current_version: Option<String>,
}

/// Dependency checker
pub struct DependencyChecker {
    /// Installed packages cache
    installed: HashMap<String, String>,
}

impl DependencyChecker {
    /// Create a new dependency checker
    pub fn new() -> Self {
        Self {
            installed: HashMap::new(),
        }
    }

    /// Check dependencies for a package
    pub async fn check(
        &self,
        manifest: &CapabilityPackageManifest,
    ) -> Result<Vec<DependencyInfo>> {
        let mut missing = Vec::new();

        for dep in &manifest.dependencies {
            let current_version = self.installed.get(&dep.package_id).cloned();

            if current_version.is_none() {
                missing.push(DependencyInfo {
                    id: dep.package_id.clone(),
                    name: dep.package_id.clone(),
                    required_version: dep.version_constraint.clone(),
                    current_version: None,
                });
            }
        }

        Ok(missing)
    }

    /// Add a known installed package
    pub fn add_installed(&mut self, package_id: &str, version: &str) {
        self.installed.insert(package_id.to_string(), version.to_string());
    }
}

impl Default for DependencyChecker {
    fn default() -> Self {
        Self::new()
    }
}
