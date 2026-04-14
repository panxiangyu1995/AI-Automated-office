//! Marketplace installer implementation.

use super::{DependencyChecker, InstallOptions, InstallResult};
use crate::capability::{CloudMarketClient, MarketplaceConfig};
use anyhow::{Context, Result};

/// Marketplace installer
pub struct MarketplaceInstaller {
    client: CloudMarketClient,
    dependency_checker: DependencyChecker,
}

impl MarketplaceInstaller {
    /// Create a new marketplace installer
    pub fn new() -> Self {
        Self {
            client: CloudMarketClient::new(&MarketplaceConfig::default()),
            dependency_checker: DependencyChecker::new(),
        }
    }

    /// Install from marketplace
    pub async fn install(
        &self,
        resource_id: String,
        version: Option<String>,
        options: InstallOptions,
    ) -> Result<InstallResult> {
        // Search for the resource in marketplace
        let result = self
            .client
            .search_marketplace(&resource_id, 1)
            .await
            .context("Failed to search marketplace")?;

        if result.packages.is_empty() {
            return Ok(InstallResult::Error {
                code: "RESOURCE_NOT_FOUND".to_string(),
                message: format!("Resource '{}' not found in marketplace", resource_id),
            });
        }

        let package = &result.packages[0];
        let target_version = version.unwrap_or_else(|| package.latest_version.clone());

        // Find the specific version
        let version_info = package
            .versions
            .iter()
            .find(|v| v.version == target_version)
            .ok_or_else(|| {
                anyhow::anyhow!("Version '{}' not found for resource '{}'", target_version, resource_id)
            })?;

        // Download the package
        let data = self
            .client
            .download_package(&resource_id, &target_version)
            .await
            .context("Failed to download package")?;

        // For now, just return success
        // In full implementation, would extract and install

        let install_path = options
            .install_path
            .unwrap_or_else(|| format!("~/.ao/capabilities/{}", resource_id));

        Ok(InstallResult::Success {
            capability_id: resource_id,
            installed_path: install_path,
            version: target_version,
        })
    }
}

impl Default for MarketplaceInstaller {
    fn default() -> Self {
        Self::new()
    }
}
