//! Unified configuration manager for tool modules
//!
//! This module provides a centralized configuration manager to replace the
//! scattered `RwLock<Option<T>>` pattern used across tool modules.

use std::sync::RwLock;
use std::collections::HashMap;

/// Web search configuration
#[derive(Debug, Clone)]
pub struct WebSearchConfig {
    pub default_provider: String,
    pub providers: HashMap<String, SearchProviderConfig>,
    pub allowed_domains: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct SearchProviderConfig {
    pub provider_id: String,
    pub api_key: Option<String>,
    pub api_url: Option<String>,
}

impl Default for WebSearchConfig {
    fn default() -> Self {
        Self {
            default_provider: "brave".to_string(),
            providers: HashMap::new(),
            allowed_domains: vec![
                "google.com".to_string(),
                "bing.com".to_string(),
                "brave.com".to_string(),
                "github.com".to_string(),
                "stackoverflow.com".to_string(),
                "reddit.com".to_string(),
            ],
        }
    }
}

/// Shell tool configuration
#[derive(Debug, Clone)]
pub struct ShellConfig {
    pub allowed_commands: Vec<String>,
    pub max_output_size: usize,
}

impl Default for ShellConfig {
    fn default() -> Self {
        Self {
            allowed_commands: vec![
                "echo".to_string(),
                "pwd".to_string(),
                "ls".to_string(),
                "dir".to_string(),
                "cat".to_string(),
                "type".to_string(),
                "find".to_string(),
                "grep".to_string(),
                "rg".to_string(),
                "head".to_string(),
                "tail".to_string(),
                "wc".to_string(),
                "mkdir".to_string(),
                "rmdir".to_string(),
                "copy".to_string(),
                "cp".to_string(),
                "move".to_string(),
                "mv".to_string(),
                "del".to_string(),
                "rm".to_string(),
                "date".to_string(),
                "time".to_string(),
                "hostname".to_string(),
                "whoami".to_string(),
                "git".to_string(),
                "npm".to_string(),
                "node".to_string(),
                "pnpm".to_string(),
                "cargo".to_string(),
                "rustc".to_string(),
                "python".to_string(),
                "pip".to_string(),
            ],
            max_output_size: 1024 * 1024, // 1MB
        }
    }
}

/// Filesystem tool configuration
#[derive(Debug, Clone)]
pub struct FilesystemConfig {
    pub allowed_dirs: Vec<std::path::PathBuf>,
    pub max_file_size: u64,
    pub read_only_by_default: bool,
}

impl Default for FilesystemConfig {
    fn default() -> Self {
        Self {
            allowed_dirs: vec![
                dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from(".")),
                std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")),
            ],
            max_file_size: 10 * 1024 * 1024, // 10MB
            read_only_by_default: false,
        }
    }
}

impl FilesystemConfig {
    /// Check if a path is within allowed directories
    pub fn is_allowed(&self, path: &std::path::Path) -> bool {
        let canonical_path = match path.canonicalize() {
            Ok(p) => p,
            Err(_) => {
                if let Some(parent) = path.parent() {
                    return self.is_allowed(parent);
                }
                return false;
            }
        };
        self.allowed_dirs.iter().any(|allowed| canonical_path.starts_with(allowed))
    }
}

/// Browser tool configuration
#[derive(Clone)]
pub struct BrowserConfig {
    pub default_profile: String,
    pub cdp_endpoint: Option<String>,
    pub timeout_ms: u64,
}

impl Default for BrowserConfig {
    fn default() -> Self {
        Self {
            default_profile: "default".to_string(),
            cdp_endpoint: Some("http://localhost:9222".to_string()),
            timeout_ms: 30000,
        }
    }
}

/// Unified tool configuration manager
///
/// This struct provides a single point of access for all tool configurations,
/// replacing the scattered `RwLock<Option<T>>` pattern.
pub struct ToolConfigManager {
    web: RwLock<Option<WebSearchConfig>>,
    shell: RwLock<Option<ShellConfig>>,
    filesystem: RwLock<Option<FilesystemConfig>>,
    browser: RwLock<Option<BrowserConfig>>,
}

impl Default for ToolConfigManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ToolConfigManager {
    /// Create a new configuration manager with default values
    pub fn new() -> Self {
        Self {
            web: RwLock::new(None),
            shell: RwLock::new(None),
            filesystem: RwLock::new(None),
            browser: RwLock::new(None),
        }
    }

    /// Get the global instance (using once_cell for efficiency)
    pub fn global() -> &'static ToolConfigManager {
        use std::sync::OnceLock;
        static MANAGER: OnceLock<ToolConfigManager> = OnceLock::new();
        MANAGER.get_or_init(|| ToolConfigManager::new())
    }

    // ===== Web Config =====

    /// Get or initialize web search configuration
    pub fn web(&self) -> WebSearchConfig {
        let read = self.web.read().expect("web config poison");
        if let Some(ref config) = *read {
            return config.clone();
        }
        drop(read);
        let mut write = self.web.write().expect("web config poison");
        if write.is_none() {
            *write = Some(WebSearchConfig::default());
        }
        write.clone().expect("web config should be initialized")
    }

    /// Set web search configuration
    pub fn set_web(&self, config: WebSearchConfig) {
        let mut write = self.web.write().expect("web config poison");
        *write = Some(config);
    }

    // ===== Shell Config =====

    /// Get or initialize shell configuration
    pub fn shell(&self) -> ShellConfig {
        let read = self.shell.read().expect("shell config poison");
        if let Some(ref config) = *read {
            return config.clone();
        }
        drop(read);
        let mut write = self.shell.write().expect("shell config poison");
        if write.is_none() {
            *write = Some(ShellConfig::default());
        }
        write.clone().expect("shell config should be initialized")
    }

    /// Set shell configuration
    pub fn set_shell(&self, config: ShellConfig) {
        let mut write = self.shell.write().expect("shell config poison");
        *write = Some(config);
    }

    // ===== Filesystem Config =====

    /// Get or initialize filesystem configuration
    pub fn filesystem(&self) -> FilesystemConfig {
        let read = self.filesystem.read().expect("filesystem config poison");
        if let Some(ref config) = *read {
            return config.clone();
        }
        drop(read);
        let mut write = self.filesystem.write().expect("filesystem config poison");
        if write.is_none() {
            *write = Some(FilesystemConfig::default());
        }
        write.clone().expect("filesystem config should be initialized")
    }

    /// Set filesystem configuration
    pub fn set_filesystem(&self, config: FilesystemConfig) {
        let mut write = self.filesystem.write().expect("filesystem config poison");
        *write = Some(config);
    }

    // ===== Browser Config =====

    /// Get or initialize browser configuration
    pub fn browser(&self) -> BrowserConfig {
        let mut write = self.browser.write().expect("browser config poison");
        if write.is_none() {
            *write = Some(BrowserConfig::default());
        }
        write.clone().unwrap_or_default()
    }

    /// Set browser configuration
    pub fn set_browser(&self, config: BrowserConfig) {
        let mut write = self.browser.write().expect("browser config poison");
        *write = Some(config);
    }
}

// Legacy compatibility wrappers for each tool module


/// Legacy wrapper for web config - returns existing or default
pub fn get_web_config() -> WebSearchConfig {
    ToolConfigManager::global().web()
}

/// Legacy wrapper for setting web config
pub fn set_web_config(config: WebSearchConfig) {
    ToolConfigManager::global().set_web(config);
}

/// Legacy wrapper for shell config
pub fn get_shell_config() -> ShellConfig {
    ToolConfigManager::global().shell()
}

/// Legacy wrapper for setting shell config
pub fn set_shell_config(config: ShellConfig) {
    ToolConfigManager::global().set_shell(config);
}

/// Legacy wrapper for filesystem config
pub fn get_filesystem_config() -> FilesystemConfig {
    ToolConfigManager::global().filesystem()
}

/// Legacy wrapper for setting filesystem config
pub fn set_filesystem_config(config: FilesystemConfig) {
    ToolConfigManager::global().set_filesystem(config);
}

/// Legacy wrapper for browser config
pub fn get_browser_config() -> BrowserConfig {
    ToolConfigManager::global().browser()
}

/// Legacy wrapper for setting browser config
pub fn set_browser_config(config: BrowserConfig) {
    ToolConfigManager::global().set_browser(config);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_web_config_default() {
        let config = WebSearchConfig::default();
        assert_eq!(config.default_provider, "brave");
        assert!(!config.allowed_domains.is_empty());
    }

    #[test]
    fn test_shell_config_default() {
        let config = ShellConfig::default();
        assert!(config.allowed_commands.contains(&"echo".to_string()));
        assert_eq!(config.max_output_size, 1024 * 1024);
    }

    #[test]
    fn test_config_manager_global() {
        let manager = ToolConfigManager::global();
        let web_config = manager.web();
        assert_eq!(web_config.default_provider, "brave");
    }
}
