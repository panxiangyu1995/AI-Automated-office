//! Skill system configuration.

use serde::{Deserialize, Serialize};

/// Skill system configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillConfig {
    /// Whether skill system is enabled
    pub enabled: bool,
    /// Skill directories to scan
    pub skill_directories: Vec<String>,
    /// Enable progressive loading
    pub progressive_loading: bool,
    /// Maximum concurrent loads
    pub max_concurrent_loads: usize,
    /// Enable skill caching
    pub caching_enabled: bool,
    /// Cache TTL in seconds
    pub cache_ttl_secs: u64,
    /// Enable skill auto-discovery
    pub auto_discovery: bool,
    /// Permission check mode
    pub permission_mode: PermissionMode,
    /// Logging level
    pub log_level: String,
}

/// Permission checking mode
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionMode {
    /// Strict mode - deny on missing permission
    Strict,
    /// Permissive mode - warn on missing permission
    Warn,
    /// Disabled - no permission checking
    Disabled,
}

impl Default for SkillConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            skill_directories: vec![
                "plugins/".to_string(),
                "skills/".to_string(),
            ],
            progressive_loading: true,
            max_concurrent_loads: 4,
            caching_enabled: true,
            cache_ttl_secs: 3600,
            auto_discovery: true,
            permission_mode: PermissionMode::Strict,
            log_level: "info".to_string(),
        }
    }
}

/// Skill loading error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillError {
    /// Error code
    pub code: SkillErrorCode,
    /// Error message
    pub message: String,
    /// Related skill ID if applicable
    pub skill_id: Option<String>,
    /// Source file if applicable
    pub source: Option<String>,
}

/// Skill error codes
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SkillErrorCode {
    /// Skill not found
    NotFound,
    /// Parse error
    ParseError,
    /// Dependency error
    DependencyError,
    /// Permission denied
    PermissionDenied,
    /// Version mismatch
    VersionMismatch,
    /// Execution error
    ExecutionError,
    /// Configuration error
    ConfigError,
    /// Loading error
    LoadingError,
    /// Unknown error
    Unknown,
}

impl std::fmt::Display for SkillError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{:?}] {}", self.code, self.message)
    }
}

impl std::error::Error for SkillError {}

impl SkillError {
    /// Create a not found error
    pub fn not_found(skill_id: &str) -> Self {
        Self {
            code: SkillErrorCode::NotFound,
            message: format!("Skill not found: {}", skill_id),
            skill_id: Some(skill_id.to_string()),
            source: None,
        }
    }

    /// Create a parse error
    pub fn parse_error(msg: &str, source: &str) -> Self {
        Self {
            code: SkillErrorCode::ParseError,
            message: msg.to_string(),
            skill_id: None,
            source: Some(source.to_string()),
        }
    }

    /// Create a dependency error
    pub fn dependency_error(skill_id: &str, reason: &str) -> Self {
        Self {
            code: SkillErrorCode::DependencyError,
            message: format!("Dependency error for {}: {}", skill_id, reason),
            skill_id: Some(skill_id.to_string()),
            source: None,
        }
    }

    /// Create a permission denied error
    pub fn permission_denied(skill_id: &str, permission: &str) -> Self {
        Self {
            code: SkillErrorCode::PermissionDenied,
            message: format!(
                "Permission denied for skill {}: {}",
                skill_id, permission
            ),
            skill_id: Some(skill_id.to_string()),
            source: None,
        }
    }
}

/// Skill validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    /// Whether validation passed
    pub valid: bool,
    /// Validation errors
    pub errors: Vec<String>,
    /// Validation warnings
    pub warnings: Vec<String>,
}
