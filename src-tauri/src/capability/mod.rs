//! Department Capability Package System module.
//!
//! This module implements:
//! - Capability package registry with SQLite persistence
//! - Enterprise cloud marketplace client
//! - ClawHub format compatibility adapter
//! - Semantic version management
//! - Dependency resolution with conflict detection
//! - Package permission control with audit logging
//! - Package loader for entry points, tools, skills, and triggers
//! - Version manager for update and rollback
//!
//! # Architecture
//!
//! - `registry/`: Package registry and storage
//! - `marketplace/`: Marketplace clients
//! - `clawhub_adapter/`: ClawHub format adapter
//! - `version/`: Semantic version management
//! - `version_manager/`: Version update and rollback management
//! - `dependency/`: Dependency resolver
//! - `permission/`: Permission controller
//! - `loader/`: Package loader

pub mod types;
pub mod registry;
pub mod marketplace;
pub mod clawhub_adapter;
pub mod version;
pub mod version_manager;
pub mod dependency;
pub mod permission;
pub mod loader;
pub mod installer;
pub mod sandbox;
pub mod security;
pub mod approval;

pub use types::*;
pub use registry::{CapabilityPackageRegistry, FilePackageStorage, RegistryConfig};
pub use marketplace::{CloudMarketClient, LocalMarketplaceClient, MarketplaceClient};
pub use clawhub_adapter::ClawHubFormatAdapter;
pub use version::VersionError;
pub use version_manager::VersionManagerService;
pub use dependency::{DependencyResolver, PackageRegistryProvider};
pub use permission::{PackagePermissionController, PermissionService, AuditLogger, SimplePermissionService, SimpleAuditLogger};
pub use loader::PackageLoader;
pub use installer::{CapabilityInstaller, InstallRequest, InstallSource, InstallOptions, InstallResult};
pub use sandbox::{SandboxConfig, SandboxType, SandboxResult, Sandbox};
pub use security::{SecurityScanner, SecurityScanResult, SecurityConfig, SecurityWarning, SecurityError};
pub use approval::{ApprovalRequest, ApprovalDecision, ApprovalStatus, ApprovalUrgency, ApprovalRequester, ApprovalProcessor};

use std::sync::Arc;
use tauri::State;

// ============================================================================
// Tauri Commands
// ============================================================================

/// Install a capability package
#[tauri::command]
pub async fn install_capability_package(
    package_id: String,
    version: Option<String>,
    marketplace: Option<MarketplaceType>,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<RegistryEntry, String> {
    let marketplace = marketplace.unwrap_or(MarketplaceType::CloudMarket);
    registry
        .install_from_marketplace(&package_id, version.as_deref(), marketplace)
        .await
        .map_err(|e| e.to_string())
}

/// Uninstall a capability package
#[tauri::command]
pub async fn uninstall_capability_package(
    package_id: String,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<(), String> {
    registry
        .unregister(&package_id)
        .await
        .map_err(|e| e.to_string())
}

/// List installed packages
#[tauri::command]
pub async fn list_installed_packages(
    department_id: Option<String>,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<Vec<RegistryEntry>, String> {
    let filter = department_id.map(|d| RegistryFilter {
        department_id: Some(d),
        package_type: None,
        enabled_only: false,
    });
    registry.list(filter).await.map_err(|e| e.to_string())
}

/// Search marketplace
#[tauri::command]
pub async fn search_marketplace(
    query: String,
    marketplace: MarketplaceType,
    page: usize,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<MarketplaceSearchResult, String> {
    registry
        .search_marketplace(&query, marketplace, page)
        .await
        .map_err(|e| e.to_string())
}

/// Check for package updates
#[tauri::command]
pub async fn check_package_updates(
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<Vec<PackageUpdate>, String> {
    registry.check_updates().await.map_err(|e| e.to_string())
}

/// Update a capability package
#[tauri::command]
pub async fn update_capability_package(
    package_id: String,
    target_version: Option<String>,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<RegistryEntry, String> {
    // For now, just reinstall with new version
    registry
        .install_from_marketplace(&package_id, target_version.as_deref(), MarketplaceType::CloudMarket)
        .await
        .map_err(|e| e.to_string())
}

/// Enable a capability package
#[tauri::command]
pub async fn enable_capability_package(
    package_id: String,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<(), String> {
    registry
        .set_enabled(&package_id, true)
        .await
        .map_err(|e| e.to_string())
}

/// Disable a capability package
#[tauri::command]
pub async fn disable_capability_package(
    package_id: String,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<(), String> {
    registry
        .set_enabled(&package_id, false)
        .await
        .map_err(|e| e.to_string())
}

/// Import ClawHub package
#[tauri::command]
pub async fn import_clawhub_package(
    archive: Vec<u8>,
    registry: State<'_, Arc<CapabilityPackageRegistry>>,
) -> Result<RegistryEntry, String> {
    let adapter = ClawHubFormatAdapter::new(CloudMarketClient::new(&MarketplaceConfig::default()));
    let manifest = adapter
        .import_clawhub_package(&archive)
        .await
        .map_err(|e| e.to_string())?;
    registry
        .register(&manifest)
        .await
        .map_err(|e| e.to_string())
}
