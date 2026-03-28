//! Capability package registry implementation.

use std::collections::HashMap;
use std::sync::Arc;

use anyhow::Result;
use sha2::Digest;
use tokio::sync::RwLock;

use super::super::types::*;
use super::super::dependency::{DependencyResolver, PackageRegistryProvider};
use super::super::marketplace::MarketplaceClient;
use super::super::permission::PackagePermissionController;

/// Registry configuration
#[derive(Debug, Clone)]
pub struct RegistryConfig {
    pub current_user: String,
    pub tenant_id: String,
    pub department_id: Option<String>,
    pub packages_dir: std::path::PathBuf,
}

impl Default for RegistryConfig {
    fn default() -> Self {
        Self {
            current_user: "system".to_string(),
            tenant_id: "default".to_string(),
            department_id: None,
            packages_dir: std::path::PathBuf::from("./packages"),
        }
    }
}

/// Capability package registry
pub struct CapabilityPackageRegistry {
    entries: RwLock<HashMap<String, RegistryEntry>>,
    marketplace_clients: HashMap<MarketplaceType, Arc<dyn MarketplaceClient>>,
    dependency_resolver: Arc<DependencyResolver>,
    permission_controller: Arc<PackagePermissionController>,
    storage: Arc<dyn PackageStorage>,
    config: RegistryConfig,
}

impl CapabilityPackageRegistry {
    /// Create a new registry
    pub fn new(
        config: RegistryConfig,
        storage: Arc<dyn PackageStorage>,
        dependency_resolver: Arc<DependencyResolver>,
        permission_controller: Arc<PackagePermissionController>,
    ) -> Self {
        Self {
            entries: RwLock::new(HashMap::new()),
            marketplace_clients: HashMap::new(),
            dependency_resolver,
            permission_controller,
            storage,
            config,
        }
    }

    /// Register a marketplace client
    pub fn register_marketplace_client(&mut self, client: Arc<dyn MarketplaceClient>) {
        let marketplace_type = client.marketplace_type();
        self.marketplace_clients.insert(marketplace_type, client);
    }

    /// Register a new package
    pub async fn register(
        &self,
        package: &CapabilityPackageManifest,
    ) -> Result<RegistryEntry> {
        // Validate package
        self.validate_package(package).await?;

        // Check permissions
        let has_permission = self
            .permission_controller
            .check_install_permission(package, &self.config.current_user)
            .await?;

        if !has_permission {
            return Err(anyhow::anyhow!("Permission denied to install package"));
        }

        // Resolve dependencies
        let resolved = self.dependency_resolver.resolve(package).await?;

        // Create registry entry
        let entry = RegistryEntry {
            package_id: package.meta.package_id.clone(),
            installed_version: package.meta.version.clone(),
            installed_at: chrono::Utc::now().timestamp(),
            installed_by: self.config.current_user.clone(),
            tenant_id: self.config.tenant_id.clone(),
            department_id: self.config.department_id.clone(),
            enabled: true,
            auto_update: true,
            installation_path: self.get_installation_path(&package.meta.package_id),
            checksum: self.calculate_checksum(package).await?,
            signature: None,
        };

        // Save to storage
        self.storage.save_package(package).await?;
        self.storage.save_entry(&entry).await?;

        // Grant permissions
        self.permission_controller
            .grant_package_permissions(package, &self.config.current_user)
            .await?;

        // Update in-memory entries
        let mut entries = self.entries.write().await;
        entries.insert(entry.package_id.clone(), entry.clone());

        Ok(entry)
    }

    /// Unregister a package
    pub async fn unregister(&self, package_id: &str) -> Result<()> {
        // Check if package exists
        let entry = self.get_entry(package_id).await?;

        // Check for dependents
        self.check_dependents(package_id).await?;

        // Unload package
        self.unload_package(package_id).await?;

        // Remove from storage
        self.storage.delete_entry(package_id).await?;

        // Revoke permissions
        if let Some(pkg) = self.storage.load_package(package_id).await? {
            self.permission_controller
                .revoke_package_permissions(&pkg, &self.config.current_user)
                .await?;
        }

        // Update in-memory entries
        let mut entries = self.entries.write().await;
        entries.remove(package_id);

        Ok(())
    }

    /// List registered packages
    pub async fn list(&self, filter: Option<RegistryFilter>) -> Result<Vec<RegistryEntry>> {
        let entries = self.entries.read().await;
        let mut result: Vec<_> = entries.values().cloned().collect();

        if let Some(f) = filter {
            result.retain(|e| {
                if f.enabled_only && !e.enabled {
                    return false;
                }
                if let Some(ref dept) = f.department_id {
                    if e.department_id.as_deref() != Some(dept) {
                        return false;
                    }
                }
                true
            });
        }

        Ok(result)
    }

    /// Get a single entry
    pub async fn get_entry(&self, package_id: &str) -> Result<RegistryEntry> {
        let entries = self.entries.read().await;
        entries
            .get(package_id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Package {} not found", package_id))
    }

    /// Check for updates
    pub async fn check_updates(&self) -> Result<Vec<PackageUpdate>> {
        let entries = self.entries.read().await;
        let mut updates = Vec::new();

        for entry in entries.values() {
            if !entry.auto_update {
                continue;
            }

            // Try to get latest version from marketplace
            for client in self.marketplace_clients.values() {
                if let Ok(pkg) = client.get_package(&entry.package_id).await {
                    if pkg.latest_version != entry.installed_version {
                        updates.push(PackageUpdate {
                            package_id: entry.package_id.clone(),
                            current_version: entry.installed_version.clone(),
                            latest_version: pkg.latest_version,
                        });
                    }
                    break;
                }
            }
        }

        Ok(updates)
    }

    /// Set package enabled state
    pub async fn set_enabled(&self, package_id: &str, enabled: bool) -> Result<()> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(package_id) {
            entry.enabled = enabled;
            self.storage.save_entry(entry).await?;
        }
        Ok(())
    }

    /// Search marketplace
    pub async fn search_marketplace(
        &self,
        query: &str,
        marketplace: MarketplaceType,
        page: usize,
    ) -> Result<MarketplaceSearchResult> {
        let client = self
            .marketplace_clients
            .get(&marketplace)
            .ok_or_else(|| anyhow::anyhow!("Marketplace {} not registered", marketplace))?;

        let options = SearchOptions {
            page,
            ..Default::default()
        };

        client.search(query, options).await
    }

    /// Install from marketplace
    pub async fn install_from_marketplace(
        &self,
        package_id: &str,
        version: Option<&str>,
        marketplace: MarketplaceType,
    ) -> Result<RegistryEntry> {
        let client = self
            .marketplace_clients
            .get(&marketplace)
            .ok_or_else(|| anyhow::anyhow!("Marketplace {} not registered", marketplace))?;

        // Get package info
        let marketplace_pkg = client.get_package(package_id).await?;
        let target_version = version.unwrap_or(&marketplace_pkg.latest_version);

        // Get specific version
        let package_version = client.get_version(package_id, target_version).await?;

        // Download package
        let archive = client.download(package_id, target_version).await?;

        // Parse manifest (assuming it's a zip with manifest)
        let manifest = self.parse_package_archive(&archive).await?;

        // Register
        self.register(&manifest).await
    }

    /// Validate package
    async fn validate_package(&self, package: &CapabilityPackageManifest) -> Result<()> {
        // Check required fields
        if package.meta.package_id.is_empty() {
            return Err(anyhow::anyhow!("Package ID is required"));
        }
        if package.meta.version.is_empty() {
            return Err(anyhow::anyhow!("Version is required"));
        }
        if package.meta.name.is_empty() {
            return Err(anyhow::anyhow!("Package name is required"));
        }

        // Validate version format
        super::super::types::SemanticVersion::parse(&package.meta.version)
            .map_err(|e| anyhow::anyhow!("Invalid version: {}", e))?;

        Ok(())
    }

    /// Check if package has dependents
    async fn check_dependents(&self, package_id: &str) -> Result<()> {
        let entries = self.entries.read().await;

        for entry in entries.values() {
            // Load package manifest to check dependencies
            if let Ok(pkg) = self.storage.load_package(&entry.package_id).await {
                if let Some(pkg) = pkg {
                    for dep in &pkg.dependencies {
                        if dep.package_id == package_id {
                            return Err(anyhow::anyhow!(
                                "Package {} depends on {}",
                                entry.package_id,
                                package_id
                            ));
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Unload a package
    async fn unload_package(&self, _package_id: &str) -> Result<()> {
        // TODO: Unload entry points, tools, skills, etc.
        Ok(())
    }

    /// Get installation path for a package
    fn get_installation_path(&self, package_id: &str) -> String {
        self.config
            .packages_dir
            .join(package_id)
            .to_string_lossy()
            .to_string()
    }

    /// Calculate checksum for a package
    async fn calculate_checksum(&self, package: &CapabilityPackageManifest) -> Result<String> {
        let serialized = serde_json::to_vec(package)?;
        let hash = sha2::Sha256::digest(&serialized);
        Ok(format!("{:x}", hash))
    }

    /// Parse package archive
    async fn parse_package_archive(&self, _archive: &[u8]) -> Result<CapabilityPackageManifest> {
        // TODO: Implement proper ZIP parsing
        Err(anyhow::anyhow!("Not implemented"))
    }
}

/// Package storage trait
#[async_trait::async_trait]
pub trait PackageStorage: Send + Sync {
    async fn save_package(&self, package: &CapabilityPackageManifest) -> Result<()>;
    async fn load_package(&self, package_id: &str) -> Result<Option<CapabilityPackageManifest>>;
    async fn delete_package(&self, package_id: &str) -> Result<()>;
    async fn save_entry(&self, entry: &RegistryEntry) -> Result<()>;
    async fn load_entry(&self, package_id: &str) -> Result<Option<RegistryEntry>>;
    async fn delete_entry(&self, package_id: &str) -> Result<()>;
    async fn load_all_entries(&self) -> Result<Vec<RegistryEntry>>;
}

/// Simple file-based package storage
pub struct FilePackageStorage {
    base_dir: std::path::PathBuf,
}

impl FilePackageStorage {
    pub fn new(base_dir: std::path::PathBuf) -> Self {
        Self { base_dir }
    }
}

#[async_trait::async_trait]
impl PackageStorage for FilePackageStorage {
    async fn save_package(&self, package: &CapabilityPackageManifest) -> Result<()> {
        let path = self
            .base_dir
            .join("packages")
            .join(format!("{}.json", package.meta.package_id));
        tokio::fs::create_dir_all(path.parent().unwrap()).await?;
        let content = serde_json::to_string_pretty(package)?;
        tokio::fs::write(&path, content).await?;
        Ok(())
    }

    async fn load_package(&self, package_id: &str) -> Result<Option<CapabilityPackageManifest>> {
        let path = self
            .base_dir
            .join("packages")
            .join(format!("{}.json", package_id));
        if !path.exists() {
            return Ok(None);
        }
        let content = tokio::fs::read_to_string(&path).await?;
        let package = serde_json::from_str(&content)?;
        Ok(Some(package))
    }

    async fn delete_package(&self, package_id: &str) -> Result<()> {
        let path = self
            .base_dir
            .join("packages")
            .join(format!("{}.json", package_id));
        if path.exists() {
            tokio::fs::remove_file(&path).await?;
        }
        Ok(())
    }

    async fn save_entry(&self, entry: &RegistryEntry) -> Result<()> {
        let path = self
            .base_dir
            .join("registry")
            .join(format!("{}.json", entry.package_id));
        tokio::fs::create_dir_all(path.parent().unwrap()).await?;
        let content = serde_json::to_string_pretty(entry)?;
        tokio::fs::write(&path, content).await?;
        Ok(())
    }

    async fn load_entry(&self, package_id: &str) -> Result<Option<RegistryEntry>> {
        let path = self
            .base_dir
            .join("registry")
            .join(format!("{}.json", package_id));
        if !path.exists() {
            return Ok(None);
        }
        let content = tokio::fs::read_to_string(&path).await?;
        let entry = serde_json::from_str(&content)?;
        Ok(Some(entry))
    }

    async fn delete_entry(&self, package_id: &str) -> Result<()> {
        let path = self
            .base_dir
            .join("registry")
            .join(format!("{}.json", package_id));
        if path.exists() {
            tokio::fs::remove_file(&path).await?;
        }
        Ok(())
    }

    async fn load_all_entries(&self) -> Result<Vec<RegistryEntry>> {
        let registry_dir = self.base_dir.join("registry");
        if !registry_dir.exists() {
            return Ok(Vec::new());
        }

        let mut entries = Vec::new();
        let mut dir = tokio::fs::read_dir(&registry_dir).await?;
        while let Some(entry) = dir.next_entry().await? {
            let path = entry.path();
            if path.extension().map(|e| e == "json").unwrap_or(false) {
                let content = tokio::fs::read_to_string(&path).await?;
                let registry_entry: RegistryEntry = serde_json::from_str(&content)?;
                entries.push(registry_entry);
            }
        }
        Ok(entries)
    }
}

#[async_trait::async_trait]
impl PackageRegistryProvider for FilePackageStorage {
    async fn get_package(
        &self,
        package_id: &str,
        _version: &str,
    ) -> Result<Option<CapabilityPackageManifest>> {
        self.load_package(package_id).await
    }

    async fn get_latest_package(
        &self,
        package_id: &str,
    ) -> Result<Option<CapabilityPackageManifest>> {
        self.load_package(package_id).await
    }

    async fn get_available_versions(&self, _package_id: &str) -> Result<Vec<String>> {
        Ok(Vec::new())
    }
}
