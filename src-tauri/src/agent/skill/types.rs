//! Skill system type definitions.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Skill definition parsed from SKILL.md
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    /// Unique skill identifier
    pub id: String,
    /// Human-readable skill name
    pub name: String,
    /// Skill version (semver)
    pub version: String,
    /// Skill description
    pub description: String,
    /// Category for grouping skills
    pub category: SkillCategory,
    /// Permissions required by this skill
    pub permissions: Vec<Permission>,
    /// Input parameters schema
    pub parameters: ParametersSchema,
    /// Skill capabilities and endpoints
    pub endpoints: Vec<SkillEndpoint>,
    /// Dependencies on other skills
    pub dependencies: Vec<SkillDependency>,
    /// Metadata
    pub metadata: SkillMetadata,
}

/// Skill category
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SkillCategory {
    /// Core system skill
    Core,
    /// Department-specific skill
    Department(String),
    /// Plugin-provided skill
    Plugin(String),
    /// Custom user-defined skill
    Custom,
    /// Integration skill (external services)
    Integration,
}

/// Permission requirement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    /// Permission type
    pub permission_type: PermissionType,
    /// Resource being accessed
    pub resource: String,
    /// Access level
    pub level: AccessLevel,
}

/// Permission types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionType {
    /// Read access
    Read,
    /// Write access
    Write,
    /// Execute access
    Execute,
    /// Admin access
    Admin,
}

/// Access levels
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccessLevel {
    /// No access
    None,
    /// Read-only access
    ReadOnly,
    /// Read and write access
    ReadWrite,
    /// Full access
    Full,
}

/// Parameters schema for skill inputs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParametersSchema {
    /// Required parameters
    pub required: Vec<Parameter>,
    /// Optional parameters
    pub optional: Vec<Parameter>,
    /// JSON Schema definition
    pub schema: serde_json::Value,
}

/// Single parameter definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parameter {
    /// Parameter name
    pub name: String,
    /// Parameter type
    pub param_type: String,
    /// Description
    pub description: String,
    /// Default value (if optional)
    pub default: Option<serde_json::Value>,
}

/// Skill endpoint (capability)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillEndpoint {
    /// Endpoint name
    pub name: String,
    /// HTTP method or action type
    pub method: String,
    /// Endpoint path or identifier
    pub path: String,
    /// Handler function name
    pub handler: String,
    /// Description
    pub description: String,
}

/// Skill dependency
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillDependency {
    /// Dependency skill ID
    pub skill_id: String,
    /// Required version range
    pub version_range: String,
    /// Is optional
    pub optional: bool,
}

/// Skill metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillMetadata {
    /// Author information
    pub author: String,
    /// Tags for search
    pub tags: Vec<String>,
    /// Icon identifier
    pub icon: Option<String>,
    /// Configuration template
    pub config_template: Option<serde_json::Value>,
}

/// Skill execution context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillExecutionContext {
    /// Skill ID being executed
    pub skill_id: String,
    /// Endpoint being called
    pub endpoint: String,
    /// Tenant ID
    pub tenant_id: String,
    /// User ID
    pub user_id: Option<String>,
    /// Execution parameters
    pub parameters: HashMap<String, serde_json::Value>,
    /// Session ID for tracking
    pub session_id: Option<String>,
    /// Timestamp (ISO 8601 format)
    pub timestamp: String,
}

/// Skill execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillExecutionResult {
    /// Whether execution was successful
    pub success: bool,
    /// Result data
    pub data: Option<serde_json::Value>,
    /// Error message if failed
    pub error: Option<String>,
    /// Execution time in milliseconds
    pub execution_time_ms: u64,
    /// Logs from execution
    pub logs: Vec<String>,
}

/// Skill discovery result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillDiscoveryResult {
    /// Available skills
    pub skills: Vec<Skill>,
    /// Total count
    pub total: usize,
    /// Discovery source
    pub source: String,
}

/// Skill load status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLoadResult {
    /// Skill ID
    pub skill_id: String,
    /// Whether loading succeeded
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
    /// Load time in milliseconds
    pub load_time_ms: u64,
}

/// Progressive loading stage
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum LoadingStage {
    /// Initial discovery
    Discovery,
    /// Parsing skill definition
    Parsing,
    /// Resolving dependencies
    Dependencies,
    /// Loading resources
    Resources,
    /// Loading skill in progress
    Loading,
    /// Ready for execution
    Ready,
}

/// Progressive loading progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadingProgress {
    /// Current stage
    pub stage: LoadingStage,
    /// Overall progress (0-100)
    pub progress: u8,
    /// Status message
    pub message: String,
    /// Skills loaded so far
    pub skills_loaded: usize,
    /// Total skills to load
    pub total_skills: usize,
}

/// Skill version constraint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionConstraint {
    /// Constraint type
    pub constraint_type: VersionConstraintType,
    /// Version string
    pub version: String,
}

/// Version constraint types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum VersionConstraintType {
    /// Exact match
    Exact,
    /// Greater than
    GreaterThan,
    /// Less than
    LessThan,
    /// Compatible range
    Compatible,
    /// Range
    Range,
}

impl Default for SkillExecutionContext {
    fn default() -> Self {
        Self {
            skill_id: String::new(),
            endpoint: String::new(),
            tenant_id: String::new(),
            user_id: None,
            parameters: HashMap::new(),
            session_id: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

impl Default for SkillExecutionResult {
    fn default() -> Self {
        Self {
            success: false,
            data: None,
            error: None,
            execution_time_ms: 0,
            logs: Vec::new(),
        }
    }
}
