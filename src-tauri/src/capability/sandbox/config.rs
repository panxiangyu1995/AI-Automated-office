//! Sandbox configuration module.

use std::collections::HashMap;

/// Sandbox type
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SandboxType {
    /// No sandbox (not recommended)
    None,
    /// Process-level isolation
    Process,
    /// WebAssembly sandbox
    Wasm,
    /// Container-based isolation
    Container,
}

impl std::fmt::Display for SandboxType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SandboxType::None => write!(f, "none"),
            SandboxType::Process => write!(f, "process"),
            SandboxType::Wasm => write!(f, "wasm"),
            SandboxType::Container => write!(f, "container"),
        }
    }
}

/// Unified sandbox configuration
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SandboxConfig {
    /// Sandbox type
    pub sandbox_type: SandboxType,
    /// Maximum memory in MB
    pub max_memory_mb: u64,
    /// Maximum CPU percentage (0-100)
    pub max_cpu_percent: u32,
    /// Maximum execution time in seconds
    pub max_duration_secs: u64,
    /// Allow network access
    pub network_allowed: bool,
    /// File system read-only
    pub filesystem_readonly: bool,
    /// Environment variables to set
    pub environment_vars: HashMap<String, String>,
    /// Allowed system calls
    pub allowed_syscalls: Vec<String>,
    /// Denied system calls
    pub denied_syscalls: Vec<String>,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            sandbox_type: SandboxType::Process,
            max_memory_mb: 512,
            max_cpu_percent: 50,
            max_duration_secs: 300,
            network_allowed: false,
            filesystem_readonly: true,
            environment_vars: HashMap::new(),
            allowed_syscalls: vec![],
            denied_syscalls: vec![
                "execve".to_string(),
                "fork".to_string(),
                "kill".to_string(),
            ],
        }
    }
}

impl SandboxConfig {
    /// Create a strict sandbox configuration
    pub fn strict() -> Self {
        Self {
            sandbox_type: SandboxType::Wasm,
            max_memory_mb: 128,
            max_cpu_percent: 25,
            max_duration_secs: 60,
            network_allowed: false,
            filesystem_readonly: true,
            ..Default::default()
        }
    }

    /// Create a permissive sandbox configuration
    pub fn permissive() -> Self {
        Self {
            sandbox_type: SandboxType::Process,
            max_memory_mb: 1024,
            max_cpu_percent: 100,
            max_duration_secs: 600,
            network_allowed: true,
            filesystem_readonly: false,
            ..Default::default()
        }
    }
}
