//! Dependency resolver implementation.

use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use anyhow::Result;

use super::super::types::*;
use super::super::types::{SemanticVersion, VersionConstraint};

/// Dependency resolver
pub struct DependencyResolver {
    registry: Arc<dyn PackageRegistryProvider>,
}

impl DependencyResolver {
    /// Create a new dependency resolver
    pub fn new(registry: Arc<dyn PackageRegistryProvider>) -> Self {
        Self { registry }
    }

    /// Resolve dependencies for a package
    pub async fn resolve(
        &self,
        package: &CapabilityPackageManifest,
    ) -> Result<ResolvedDependencies> {
        let mut resolved: HashMap<String, String> = HashMap::new();
        let mut pending = vec![(package.meta.package_id.clone(), package.meta.version.clone())];
        let mut visited: HashSet<String> = HashSet::new();

        while let Some((pkg_id, version)) = pending.pop() {
            if visited.contains(&pkg_id) {
                continue;
            }
            visited.insert(pkg_id.clone());

            // Get package manifest from registry
            if let Some(pkg) = self.registry.get_package(&pkg_id, &version).await? {
                for dep in &pkg.dependencies {
                    let resolved_version =
                        self.find_compatible_version(&dep.package_id, &dep.version_constraint)
                            .await?;

                    if let Some(existing) = resolved.get(&dep.package_id) {
                        if existing != &resolved_version {
                            return Err(anyhow::anyhow!(
                                "dependency conflict: {} requires {} but {} is already resolved",
                                pkg_id,
                                resolved_version,
                                existing
                            ));
                        }
                    } else {
                        resolved.insert(dep.package_id.clone(), resolved_version.clone());
                        pending.push((dep.package_id.clone(), resolved_version));
                    }
                }
            }
        }

        Ok(ResolvedDependencies {
            packages: resolved,
            resolution_order: visited.into_iter().collect(),
        })
    }

    /// Find a compatible version for a package
    async fn find_compatible_version(
        &self,
        package_id: &str,
        constraint: &str,
    ) -> Result<String> {
        let version_constraint = VersionConstraint::parse(constraint)
            .map_err(|e| anyhow::anyhow!("Invalid constraint: {}", e))?;

        // Get all available versions from registry
        let versions = self.registry.get_available_versions(package_id).await?;

        // Find the best matching version
        let mut best_version: Option<SemanticVersion> = None;

        for version_str in versions {
            if let Ok(version) = SemanticVersion::parse(&version_str) {
                if version.is_compatible(&version_constraint) {
                    if let Some(best) = &best_version {
                        if version > *best {
                            best_version = Some(version);
                        }
                    } else {
                        best_version = Some(version);
                    }
                }
            }
        }

        best_version
            .map(|v| v.to_string())
            .ok_or_else(|| anyhow::anyhow!("No compatible version found for {}", package_id))
    }

    /// Check for conflicts between packages
    pub async fn check_conflicts(
        &self,
        packages: &[String],
    ) -> Result<Vec<DependencyConflict>> {
        let mut conflicts = Vec::new();

        for i in 0..packages.len() {
            for j in (i + 1)..packages.len() {
                if let Some(conflict) = self
                    .check_pair_conflict(&packages[i], &packages[j])
                    .await?
                {
                    conflicts.push(conflict);
                }
            }
        }

        Ok(conflicts)
    }

    /// Check conflict between two packages
    async fn check_pair_conflict(
        &self,
        package_a: &str,
        package_b: &str,
    ) -> Result<Option<DependencyConflict>> {
        // Get both packages
        let pkg_a = self.registry.get_latest_package(package_a).await?;
        let pkg_b = self.registry.get_latest_package(package_b).await?;

        if let (Some(a), Some(b)) = (pkg_a, pkg_b) {
            // Check for version mismatch conflicts
            for dep_a in &a.dependencies {
                if dep_a.package_id == package_b {
                    let constraint = VersionConstraint::parse(&dep_a.version_constraint)?;
                    let version_b = SemanticVersion::parse(&b.meta.version)?;

                    if !version_b.is_compatible(&constraint) {
                        return Ok(Some(DependencyConflict {
                            package_a: package_a.to_string(),
                            package_b: package_b.to_string(),
                            conflict_type: ConflictType::VersionMismatch,
                            description: format!(
                                "{} requires {} but available version is {}",
                                package_a, dep_a.version_constraint, version_b
                            ),
                            resolution: None,
                        }));
                    }
                }
            }

            // Check for resource conflicts
            for res_a in &a.resources {
                for res_b in &b.resources {
                    if res_a.resource_id == res_b.resource_id
                        && res_a.resource_type == res_b.resource_type
                    {
                        return Ok(Some(DependencyConflict {
                            package_a: package_a.to_string(),
                            package_b: package_b.to_string(),
                            conflict_type: ConflictType::ResourceConflict,
                            description: format!(
                                "Both {} and {} require resource {}",
                                package_a, package_b, res_a.resource_id
                            ),
                            resolution: None,
                        }));
                    }
                }
            }
        }

        Ok(None)
    }
}

/// Trait for providing package registry access to the resolver
#[async_trait::async_trait]
pub trait PackageRegistryProvider: Send + Sync {
    async fn get_package(
        &self,
        package_id: &str,
        version: &str,
    ) -> Result<Option<CapabilityPackageManifest>>;

    async fn get_latest_package(
        &self,
        package_id: &str,
    ) -> Result<Option<CapabilityPackageManifest>>;

    async fn get_available_versions(&self, package_id: &str) -> Result<Vec<String>>;
}
