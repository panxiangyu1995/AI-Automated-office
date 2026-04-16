//! Local file installer implementation.

use super::{DependencyChecker, InstallOptions, InstallResult};
use crate::capability::{CapabilityPackageManifest, ClawHubFormatAdapter, CloudMarketClient, MarketplaceConfig};
use anyhow::{Context, Result};
use std::io::Cursor;
use zip::ZipArchive;

/// Local file installer
pub struct LocalInstaller {
    clawhub_adapter: ClawHubFormatAdapter,
    dependency_checker: DependencyChecker,
}

impl LocalInstaller {
    /// Create a new local installer
    pub fn new() -> Self {
        let client = CloudMarketClient::new(&MarketplaceConfig::default());
        Self {
            clawhub_adapter: ClawHubFormatAdapter::new(client),
            dependency_checker: DependencyChecker::new(),
        }
    }

    /// Install from local file data
    pub async fn install(
        &self,
        data: Vec<u8>,
        file_name: &str,
        options: InstallOptions,
        _tenant_id: &str,
        _requested_by: &str,
    ) -> Result<InstallResult> {
        // Validate file extension
        if !file_name.ends_with(".zip") {
            return Ok(InstallResult::Error {
                code: "INVALID_FORMAT".to_string(),
                message: "Only ZIP files are supported".to_string(),
            });
        }

        // Parse ZIP archive
        let cursor = Cursor::new(&data);
        let mut archive = ZipArchive::new(cursor)
            .context("Failed to read ZIP archive")?;

        // Check for manifest file
        let manifest_exists = archive.by_name("manifest.json").is_ok();
        let skill_exists = archive.by_name("SKILL.md").is_ok();

        if !manifest_exists && !skill_exists {
            return Ok(InstallResult::Error {
                code: "PARSE_ERROR".to_string(),
                message: "Invalid package: no manifest.json or SKILL.md found".to_string(),
            });
        }

        // Parse manifest
        let manifest = if manifest_exists {
            let content = {
                let mut manifest_file = archive.by_name("manifest.json")?;
                let mut content = Vec::new();
                manifest_file.read_to_end(&mut content)?;
                content
            };
            
            let clawhub_manifest: serde_json::Value =
                serde_json::from_slice(&content).context("Failed to parse manifest.json")?;
            self.clawhub_adapter
                .convert_json_manifest(clawhub_manifest)
                .await?
        } else {
            // Parse SKILL.md format
            self.parse_skill_format(&mut archive).await?
        };

        // Check dependencies
        let missing_deps = self.dependency_checker.check(&manifest).await?;
        if !missing_deps.is_empty() {
            return Ok(InstallResult::DependencyMissing { missing: missing_deps });
        }

        // Validate options
        if options.skip_approve {
            // Direct installation
            let install_path = options
                .install_path
                .unwrap_or_else(|| format!("~/.ao/capabilities/{}", manifest.meta.package_id));

            Ok(InstallResult::Success {
                capability_id: manifest.meta.package_id.clone(),
                installed_path: install_path,
                version: manifest.meta.version.clone(),
            })
        } else {
            // Would need approval
            Ok(InstallResult::PendingApproval {
                request_id: uuid::Uuid::new_v4().to_string(),
                estimated_wait: 30,
            })
        }
    }

    /// Parse SKILL.md format package
    async fn parse_skill_format(
        &self,
        archive: &mut ZipArchive<Cursor<&Vec<u8>>>,
    ) -> Result<CapabilityPackageManifest> {
        let skill_content = if let Ok(skill_file) = archive.by_name("SKILL.md") {
            use std::io::Read;
            let mut content = String::new();
            let mut file = skill_file;
            file.read_to_string(&mut content)?;
            content
        } else {
            String::new()
        };

        // Basic manifest from SKILL.md
        let package_id = extract_package_id_from_skill(&skill_content)
            .unwrap_or_else(|| "unknown-skill".to_string());

        Ok(CapabilityPackageManifest {
            meta: crate::capability::types::CapabilityPackageMeta {
                package_id: package_id.clone(),
                name: package_id.clone(),
                display_name: package_id.clone(),
                version: "1.0.0".to_string(),
                description: "Parsed from SKILL.md".to_string(),
                package_type: crate::capability::types::CapabilityPackageType::Extension,
                department: "custom".to_string(),
                author: "unknown".to_string(),
                publisher: None,
                homepage: None,
                repository: None,
                license: "MIT".to_string(),
                keywords: vec![],
                categories: vec![],
                icon: None,
                screenshots: vec![],
                status: crate::capability::types::CapabilityPackageStatus::Draft,
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
                published_at: None,
                download_count: 0,
                rating: None,
                rating_count: 0,
            },
            entry_points: vec![],
            tools: vec![],
            skills: vec![],
            triggers: vec![],
            permissions: vec![],
            dependencies: vec![],
            configurations: vec![],
            resources: vec![],
        })
    }
}

impl Default for LocalInstaller {
    fn default() -> Self {
        Self::new()
    }
}

/// Extract package ID from SKILL.md content
fn extract_package_id_from_skill(content: &str) -> Option<String> {
    // Look for YAML frontmatter
    if content.starts_with("---") {
        let end = content[3..].find("---")?;
        let frontmatter = &content[3..3 + end];
        for line in frontmatter.lines() {
            if line.starts_with("name:") {
                return Some(line[5..].trim().to_string());
            }
        }
    }
    None
}

use std::io::Read;
