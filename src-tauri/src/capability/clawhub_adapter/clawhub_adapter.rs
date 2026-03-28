//! ClawHub format adapter implementation.

use std::collections::HashMap;
use std::io::{Cursor, Read};
use zip::ZipArchive;

use anyhow::{Context, Result};

use super::super::marketplace::CloudMarketClient;
use super::super::types::*;

/// ClawHub manifest format
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ClawHubManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub dependencies: Vec<ClawHubDependency>,
    pub resources: Vec<ClawHubResource>,
    pub permissions: Vec<String>,
    pub entry_points: Vec<ClawHubEntryPoint>,
    pub settings: HashMap<String, serde_json::Value>,
}

/// ClawHub dependency
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ClawHubDependency {
    pub id: String,
    pub version: String,
}

/// ClawHub resource
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ClawHubResource {
    pub id: String,
    pub resource_type: String,
    pub capacity: Option<u64>,
}

/// ClawHub entry point
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ClawHubEntryPoint {
    pub id: String,
    pub name: String,
    pub entry_type: String,
    pub handler: String,
}

/// ClawHub format adapter
pub struct ClawHubFormatAdapter {
    inner: CloudMarketClient,
}

impl ClawHubFormatAdapter {
    /// Create a new ClawHub adapter
    pub fn new(client: CloudMarketClient) -> Self {
        Self { inner: client }
    }

    /// Import a ClawHub package
    pub async fn import_clawhub_package(&self, archive: &[u8]) -> Result<CapabilityPackageManifest> {
        let clawhub_manifest = self.parse_clawhub_manifest(archive).await?;
        self.convert_to_capability_manifest(clawhub_manifest).await
    }

    /// Parse ClawHub manifest from archive
    async fn parse_clawhub_manifest(&self, archive: &[u8]) -> Result<ClawHubManifest> {
        let cursor = Cursor::new(archive);
        let mut zip = ZipArchive::new(cursor)
            .context("Failed to read ZIP archive")?;

        // Look for manifest.json
        let mut manifest_file = zip
            .by_name("manifest.json")
            .context("manifest.json not found in archive")?;

        let mut manifest_content = Vec::new();
        manifest_file.read_to_end(&mut manifest_content)?;
        let manifest: ClawHubManifest = serde_json::from_slice(&manifest_content)
            .context("Failed to parse manifest.json")?;

        Ok(manifest)
    }

    /// Convert ClawHub manifest to Capability package manifest
    async fn convert_to_capability_manifest(
        &self,
        clawhub: ClawHubManifest,
    ) -> Result<CapabilityPackageManifest> {
        let now = chrono::Utc::now().timestamp();

        let meta = CapabilityPackageMeta {
            package_id: format!("clawhub-{}", clawhub.id),
            name: clawhub.id.clone(),
            display_name: clawhub.name.clone(),
            version: clawhub.version.clone(),
            description: clawhub.description.unwrap_or_default(),
            package_type: CapabilityPackageType::Extension,
            department: "clawhub".to_string(),
            author: clawhub.author.unwrap_or_else(|| "unknown".to_string()),
            publisher: Some("ClawHub".to_string()),
            homepage: None,
            repository: None,
            license: "MIT".to_string(),
            keywords: Vec::new(),
            categories: vec!["clawhub".to_string()],
            icon: None,
            screenshots: Vec::new(),
            status: CapabilityPackageStatus::Published,
            created_at: now,
            updated_at: now,
            published_at: Some(now),
            download_count: 0,
            rating: None,
            rating_count: 0,
        };

        let entry_points = clawhub
            .entry_points
            .iter()
            .map(|ep| EntryPoint {
                id: ep.id.clone(),
                name: ep.name.clone(),
                entry_type: match ep.entry_type.as_str() {
                    "command" => EntryPointType::Command,
                    "menu" => EntryPointType::Menu,
                    "panel" => EntryPointType::Panel,
                    "workflow" => EntryPointType::Workflow,
                    "agent" => EntryPointType::Agent,
                    _ => EntryPointType::Command,
                },
                handler: ep.handler.clone(),
                description: String::new(),
                enabled: true,
            })
            .collect();

        let tools = Vec::new();
        let skills = Vec::new();
        let triggers = Vec::new();

        let permissions = clawhub
            .permissions
            .iter()
            .map(|p| PermissionRequirement {
                permission: p.clone(),
                reason: "Required by ClawHub package".to_string(),
                required: true,
            })
            .collect();

        let dependencies = clawhub
            .dependencies
            .iter()
            .map(|d| PackageDependency {
                package_id: format!("clawhub-{}", d.id),
                version_constraint: d.version.clone(),
                optional: false,
            })
            .collect();

        let configurations = clawhub
            .settings
            .iter()
            .map(|(k, v)| ConfigurationSchema {
                key: k.clone(),
                value_type: match v {
                    serde_json::Value::String(_) => "string".to_string(),
                    serde_json::Value::Number(_) => "number".to_string(),
                    serde_json::Value::Bool(_) => "boolean".to_string(),
                    _ => "any".to_string(),
                },
                description: String::new(),
                default_value: Some(v.clone()),
                required: false,
            })
            .collect();

        let resources = clawhub
            .resources
            .iter()
            .map(|r| ResourceDefinition {
                resource_id: r.id.clone(),
                name: r.id.clone(),
                resource_type: r.resource_type.clone(),
                capacity: r.capacity,
            })
            .collect();

        Ok(CapabilityPackageManifest {
            meta,
            entry_points,
            tools,
            skills,
            triggers,
            permissions,
            dependencies,
            configurations,
            resources,
        })
    }
}
