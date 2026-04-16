//! Capability package installer module.
//!
//! This module implements:
//! - Local file installation
//! - Marketplace installation
//! - URL-based installation
//! - Dependency resolution
//! - Security scanning integration
//! - Approval workflow integration

mod local;
mod marketplace;
mod url;
mod dependency;

pub use local::LocalInstaller;
pub use marketplace::MarketplaceInstaller;
pub use url::UrlInstaller;
pub use dependency::{DependencyChecker, DependencyInfo};

use crate::capability::types::*;
use anyhow::Result;

/// Installation result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InstallResult {
    /// Installation successful
    Success {
        capability_id: String,
        installed_path: String,
        version: String,
    },
    /// Waiting for approval
    PendingApproval {
        request_id: String,
        estimated_wait: u32, // minutes
    },
    /// Blocked by security scan
    SecurityBlocked {
        reason: String,
        details: String,
    },
    /// Missing dependencies
    DependencyMissing {
        missing: Vec<DependencyInfo>,
    },
    /// Installation error
    Error {
        code: String,
        message: String,
    },
}

/// Installation options
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InstallOptions {
    /// Skip approval process
    pub skip_approve: bool,
    /// Force install even if already installed
    pub force_install: bool,
    /// Use sandbox mode
    pub sandbox_mode: bool,
    /// Custom install path
    pub install_path: Option<String>,
}

impl Default for InstallOptions {
    fn default() -> Self {
        Self {
            skip_approve: false,
            force_install: false,
            sandbox_mode: true,
            install_path: None,
        }
    }
}

/// Installation request
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InstallRequest {
    /// Installation source
    pub source: InstallSource,
    /// Resource identifier
    pub resource_id: String,
    /// Target version (None = latest)
    pub version: Option<String>,
    /// Installation options
    pub options: InstallOptions,
    /// Tenant ID
    pub tenant_id: String,
    /// Requested by user
    pub requested_by: String,
}

/// Installation source
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InstallSource {
    /// Local file upload
    Local,
    /// Official marketplace
    Marketplace,
    /// Private marketplace
    PrivateMarket,
    /// URL download
    Url,
}

impl std::fmt::Display for InstallSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InstallSource::Local => write!(f, "local"),
            InstallSource::Marketplace => write!(f, "marketplace"),
            InstallSource::PrivateMarket => write!(f, "private_market"),
            InstallSource::Url => write!(f, "url"),
        }
    }
}

/// Security block reason
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SecurityBlockReason {
    MaliciousCode,
    InvalidSignature,
    MissingSignature,
    UnknownSource,
    ExcessivePermissions,
    ScanTimeout,
}

/// Package installer trait
#[async_trait::async_trait]
pub trait PackageInstaller: Send + Sync {
    /// Validate the package before installation
    async fn validate(&self, data: &[u8]) -> Result<CapabilityPackageManifest>;

    /// Perform the installation
    async fn install(
        &self,
        manifest: CapabilityPackageManifest,
        options: InstallOptions,
    ) -> Result<InstallResult>;

    /// Check dependencies
    async fn check_dependencies(
        &self,
        manifest: &CapabilityPackageManifest,
    ) -> Result<Vec<DependencyInfo>>;
}

/// Unified installer that can handle different sources
pub struct CapabilityInstaller {
    local: LocalInstaller,
    marketplace: MarketplaceInstaller,
    url: UrlInstaller,
}

impl CapabilityInstaller {
    /// Create a new installer
    pub fn new() -> Self {
        Self {
            local: LocalInstaller::new(),
            marketplace: MarketplaceInstaller::new(),
            url: UrlInstaller::new(),
        }
    }

    /// Install from any source
    pub async fn install(
        &self,
        request: InstallRequest,
    ) -> Result<InstallResult> {
        match request.source {
            InstallSource::Local => {
                // For local installation, we need file data which is passed differently
                // This is handled by the Tauri command directly
                Err(anyhow::anyhow!("Use install_local_from_data for local files"))
            }
            InstallSource::Marketplace | InstallSource::PrivateMarket => {
                self.marketplace
                    .install(request.resource_id, request.version, request.options)
                    .await
            }
            InstallSource::Url => {
                self.url
                    .install(&request.resource_id, request.version, request.options)
                    .await
            }
        }
    }

    /// Install from local file data
    pub async fn install_from_data(
        &self,
        data: Vec<u8>,
        file_name: &str,
        options: InstallOptions,
        tenant_id: &str,
        requested_by: &str,
    ) -> Result<InstallResult> {
        self.local
            .install(data, file_name, options, tenant_id, requested_by)
            .await
    }
}

impl Default for CapabilityInstaller {
    fn default() -> Self {
        Self::new()
    }
}
