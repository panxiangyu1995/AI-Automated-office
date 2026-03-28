//! Package loader implementation.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Result;
use tokio::sync::RwLock;

use super::super::types::*;

/// Package loader state
pub struct PackageLoaderState {
    pub loaded_packages: HashMap<String, LoadedPackage>,
    pub entry_points: HashMap<String, EntryPoint>,
    pub tools: HashMap<String, ToolDefinition>,
    pub skills: HashMap<String, SkillDefinition>,
    pub triggers: HashMap<String, TriggerDefinition>,
}

/// Loaded package info
#[derive(Debug, Clone)]
pub struct LoadedPackage {
    pub package_id: String,
    pub version: String,
    pub enabled: bool,
    pub entry_points: Vec<EntryPoint>,
    pub tools: Vec<ToolDefinition>,
    pub skills: Vec<SkillDefinition>,
    pub triggers: Vec<TriggerDefinition>,
}

/// Package loader
pub struct PackageLoader {
    state: RwLock<PackageLoaderState>,
}

impl PackageLoader {
    /// Create a new package loader
    pub fn new() -> Self {
        Self {
            state: RwLock::new(PackageLoaderState {
                loaded_packages: HashMap::new(),
                entry_points: HashMap::new(),
                tools: HashMap::new(),
                skills: HashMap::new(),
                triggers: HashMap::new(),
            }),
        }
    }

    /// Load a package
    pub async fn load_package(&self, package: &CapabilityPackageManifest) -> Result<()> {
        let mut state = self.state.write().await;

        // Create loaded package info
        let loaded = LoadedPackage {
            package_id: package.meta.package_id.clone(),
            version: package.meta.version.clone(),
            enabled: true,
            entry_points: package.entry_points.clone(),
            tools: package.tools.clone(),
            skills: package.skills.clone(),
            triggers: package.triggers.clone(),
        };

        // Register entry points
        for ep in &package.entry_points {
            if ep.enabled {
                state.entry_points.insert(ep.id.clone(), ep.clone());
            }
        }

        // Register tools
        for tool in &package.tools {
            state.tools.insert(tool.tool_id.clone(), tool.clone());
        }

        // Register skills
        for skill in &package.skills {
            state.skills.insert(skill.skill_id.clone(), skill.clone());
        }

        // Register triggers
        for trigger in &package.triggers {
            state.triggers.insert(trigger.trigger_id.clone(), trigger.clone());
        }

        // Store loaded package
        state
            .loaded_packages
            .insert(package.meta.package_id.clone(), loaded);

        Ok(())
    }

    /// Unload a package
    pub async fn unload_package(&self, package_id: &str) -> Result<()> {
        let mut state = self.state.write().await;

        if let Some(loaded) = state.loaded_packages.remove(package_id) {
            // Remove entry points
            for ep in &loaded.entry_points {
                state.entry_points.remove(&ep.id);
            }

            // Remove tools
            for tool in &loaded.tools {
                state.tools.remove(&tool.tool_id);
            }

            // Remove skills
            for skill in &loaded.skills {
                state.skills.remove(&skill.skill_id);
            }

            // Remove triggers
            for trigger in &loaded.triggers {
                state.triggers.remove(&trigger.trigger_id);
            }
        }

        Ok(())
    }

    /// Enable a package
    pub async fn enable_package(&self, package_id: &str) -> Result<()> {
        let mut state = self.state.write().await;
        if let Some(loaded) = state.loaded_packages.get_mut(package_id) {
            loaded.enabled = true;
        }
        Ok(())
    }

    /// Disable a package
    pub async fn disable_package(&self, package_id: &str) -> Result<()> {
        let mut state = self.state.write().await;
        if let Some(loaded) = state.loaded_packages.get_mut(package_id) {
            loaded.enabled = false;
        }
        Ok(())
    }

    /// Get entry point by ID
    pub async fn get_entry_point(&self, id: &str) -> Option<EntryPoint> {
        let state = self.state.read().await;
        state.entry_points.get(id).cloned()
    }

    /// Get tool by ID
    pub async fn get_tool(&self, id: &str) -> Option<ToolDefinition> {
        let state = self.state.read().await;
        state.tools.get(id).cloned()
    }

    /// Get skill by ID
    pub async fn get_skill(&self, id: &str) -> Option<SkillDefinition> {
        let state = self.state.read().await;
        state.skills.get(id).cloned()
    }

    /// List all loaded packages
    pub async fn list_loaded_packages(&self) -> Vec<LoadedPackage> {
        let state = self.state.read().await;
        state.loaded_packages.values().cloned().collect()
    }

    /// List all enabled packages
    pub async fn list_enabled_packages(&self) -> Vec<LoadedPackage> {
        let state = self.state.read().await;
        state
            .loaded_packages
            .values()
            .filter(|p| p.enabled)
            .cloned()
            .collect()
    }
}

impl Default for PackageLoader {
    fn default() -> Self {
        Self::new()
    }
}
