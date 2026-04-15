//! Marketplace client implementation.

use std::sync::Arc;

use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;

use crate::capability::types::*;

/// Marketplace client trait
#[async_trait]
pub trait MarketplaceClient: Send + Sync {
    fn marketplace_type(&self) -> MarketplaceType;
    async fn search(
        &self,
        query: &str,
        options: SearchOptions,
    ) -> Result<MarketplaceSearchResult>;
    async fn get_package(&self, package_id: &str) -> Result<MarketplacePackage>;
    async fn get_version(
        &self,
        package_id: &str,
        version: &str,
    ) -> Result<PackageVersion>;
    async fn download(&self, package_id: &str, version: &str) -> Result<Vec<u8>>;
}

/// Cloud market client
pub struct CloudMarketClient {
    endpoint: String,
    http_client: Client,
    cache: PackageCache,
    clawhub_compatible: bool,
}

impl CloudMarketClient {
    /// Create a new cloud market client
    pub fn new(config: &MarketplaceConfig) -> Self {
        Self {
            endpoint: config.endpoint.clone(),
            http_client: Client::new(),
            cache: PackageCache::new(config.cache_ttl_seconds),
            clawhub_compatible: config.clawhub_compatible,
        }
    }

    /// Search marketplace for packages
    pub async fn search_marketplace(
        &self,
        query: &str,
        marketplace: MarketplaceType,
        page: usize,
    ) -> Result<MarketplaceSearchResult> {
        let options = SearchOptions {
            page,
            ..Default::default()
        };
        self.search(query, options).await
    }

    /// Download a package from marketplace
    pub async fn download_package(
        &self,
        package_id: &str,
        version: &str,
    ) -> Result<Vec<u8>> {
        self.download(package_id, version).await
    }

    /// Check if ClawHub compatibility is enabled
    pub fn is_clawhub_compatible(&self) -> bool {
        self.clawhub_compatible
    }
}

#[async_trait]
impl MarketplaceClient for CloudMarketClient {
    fn marketplace_type(&self) -> MarketplaceType {
        MarketplaceType::CloudMarket
    }

    async fn search(
        &self,
        query: &str,
        options: SearchOptions,
    ) -> Result<MarketplaceSearchResult> {
        let cache_key = format!("search:{}:{:?}", query, options);
        if let Some(cached) = self.cache.get_search(&cache_key) {
            return Ok(cached);
        }

        let url = format!("{}/api/v1/packages/search", self.endpoint);
        let mut req = self.http_client.get(&url);
        req = req.query(&[
            ("q", query),
            ("page", &options.page.to_string()),
            ("page_size", &options.page_size.to_string()),
        ]);

        if let Some(ref cat) = options.category {
            req = req.query(&[("category", cat)]);
        }

        let response = req.send().await?;
        let result: MarketplaceSearchResult = response.json().await?;

        self.cache.set_search(cache_key, result.clone());
        Ok(result)
    }

    async fn get_package(&self, package_id: &str) -> Result<MarketplacePackage> {
        let cache_key = format!("package:{}", package_id);
        if let Some(cached) = self.cache.get_package(&cache_key) {
            return Ok(cached);
        }

        let url = format!("{}/api/v1/packages/{}", self.endpoint, package_id);
        let response = self.http_client.get(&url).send().await?;
        let result: MarketplacePackage = response.json().await?;

        self.cache.set_package(cache_key, result.clone());
        Ok(result)
    }

    async fn get_version(
        &self,
        package_id: &str,
        version: &str,
    ) -> Result<PackageVersion> {
        let cache_key = format!("version:{}:{}", package_id, version);
        if let Some(cached) = self.cache.get_version(&cache_key) {
            return Ok(cached);
        }

        let url = format!(
            "{}/api/v1/packages/{}/versions/{}",
            self.endpoint, package_id, version
        );
        let response = self.http_client.get(&url).send().await?;
        let result: PackageVersion = response.json().await?;

        self.cache.set_version(cache_key, result.clone());
        Ok(result)
    }

    async fn download(&self, package_id: &str, version: &str) -> Result<Vec<u8>> {
        let url = format!(
            "{}/api/v1/packages/{}/{}/download",
            self.endpoint, package_id, version
        );
        let response = self.http_client.get(&url).send().await?;
        let bytes = response.bytes().await?;
        Ok(bytes.to_vec())
    }
}

/// Local marketplace client (file-based)
pub struct LocalMarketplaceClient {
    packages_dir: std::path::PathBuf,
}

impl LocalMarketplaceClient {
    /// Create a new local marketplace client
    pub fn new(packages_dir: std::path::PathBuf) -> Self {
        Self { packages_dir }
    }
}

#[async_trait]
impl MarketplaceClient for LocalMarketplaceClient {
    fn marketplace_type(&self) -> MarketplaceType {
        MarketplaceType::Local
    }

    async fn search(
        &self,
        query: &str,
        options: SearchOptions,
    ) -> Result<MarketplaceSearchResult> {
        let mut all_packages = Vec::new();

        // Read all packages from directory
        if let Ok(entries) = std::fs::read_dir(&self.packages_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "json").unwrap_or(false) {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        if let Ok(pkg) = serde_json::from_str::<MarketplacePackage>(&content) {
                            // Filter by query
                            if query.is_empty()
                                || pkg.meta.name.contains(query)
                                || pkg.meta.description.contains(query)
                            {
                                // Filter by category
                                if let Some(ref cat) = options.category {
                                    if !pkg.meta.categories.contains(cat) {
                                        continue;
                                    }
                                }
                                all_packages.push(pkg);
                            }
                        }
                    }
                }
            }
        }

        let total_count = all_packages.len();
        let start = (options.page - 1) * options.page_size;
        let end = (start + options.page_size).min(total_count);

        Ok(MarketplaceSearchResult {
            packages: all_packages.drain(start..end).collect(),
            total_count,
            page: options.page,
            page_size: options.page_size,
        })
    }

    async fn get_package(&self, package_id: &str) -> Result<MarketplacePackage> {
        let path = self.packages_dir.join(format!("{}.json", package_id));
        let content = std::fs::read_to_string(&path)?;
        let result: MarketplacePackage = serde_json::from_str(&content)?;
        Ok(result)
    }

    async fn get_version(
        &self,
        package_id: &str,
        version: &str,
    ) -> Result<PackageVersion> {
        let package = self.get_package(package_id).await?;
        package
            .versions
            .into_iter()
            .find(|v| v.version == version)
            .ok_or_else(|| anyhow::anyhow!("Version {} not found", version))
    }

    async fn download(&self, package_id: &str, version: &str) -> Result<Vec<u8>> {
        let path = self
            .packages_dir
            .join(format!("{}-{}.zip", package_id, version));
        let bytes = std::fs::read(&path)?;
        Ok(bytes)
    }
}

/// Package cache for different types
struct PackageCache {
    search_cache: std::sync::RwLock<lru::LruCache<String, MarketplaceSearchResult>>,
    package_cache: std::sync::RwLock<lru::LruCache<String, MarketplacePackage>>,
    version_cache: std::sync::RwLock<lru::LruCache<String, PackageVersion>>,
    ttl_seconds: u64,
}

impl PackageCache {
    fn new(ttl_seconds: u64) -> Self {
        Self {
            search_cache: std::sync::RwLock::new(lru::LruCache::new(
                std::num::NonZeroUsize::new(100).unwrap(),
            )),
            package_cache: std::sync::RwLock::new(lru::LruCache::new(
                std::num::NonZeroUsize::new(100).unwrap(),
            )),
            version_cache: std::sync::RwLock::new(lru::LruCache::new(
                std::num::NonZeroUsize::new(100).unwrap(),
            )),
            ttl_seconds,
        }
    }

    fn get_search(&self, key: &str) -> Option<MarketplaceSearchResult> {
        self.search_cache.write().unwrap().get(key).cloned()
    }

    fn set_search(&self, key: String, value: MarketplaceSearchResult) {
        self.search_cache.write().unwrap().put(key, value);
    }

    fn get_package(&self, key: &str) -> Option<MarketplacePackage> {
        self.package_cache.write().unwrap().get(key).cloned()
    }

    fn set_package(&self, key: String, value: MarketplacePackage) {
        self.package_cache.write().unwrap().put(key, value);
    }

    fn get_version(&self, key: &str) -> Option<PackageVersion> {
        self.version_cache.write().unwrap().get(key).cloned()
    }

    fn set_version(&self, key: String, value: PackageVersion) {
        self.version_cache.write().unwrap().put(key, value);
    }
}
