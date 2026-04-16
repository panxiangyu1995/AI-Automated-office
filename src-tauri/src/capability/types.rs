//! Capability package system types.

use serde::{Deserialize, Serialize};
use std::fmt;

// ============================================================================
// Enums
// ============================================================================

/// 能力包状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum CapabilityPackageStatus {
    Draft,
    Published,
    Deprecated,
    Archived,
}

/// 能力包类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum CapabilityPackageType {
    Core,
    Extension,
    Custom,
}

/// 入口点类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EntryPointType {
    Command,
    Menu,
    Panel,
    Workflow,
    Agent,
}

/// 市场类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum MarketplaceType {
    CloudMarket,
    Local,
}

impl fmt::Display for MarketplaceType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MarketplaceType::CloudMarket => write!(f, "CloudMarket"),
            MarketplaceType::Local => write!(f, "Local"),
        }
    }
}

/// 冲突类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConflictType {
    VersionMismatch,
    ResourceConflict,
    PermissionConflict,
    DependencyCycle,
}

/// 冲突解决方案
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConflictResolution {
    UseVersion { package: String, version: String },
    Disable { package: String },
    Manual,
}

/// 版本比较操作符
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ComparatorOp {
    Exact,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Compatible,
    Range,
    Wildcard,
}

// ============================================================================
// Structs
// ============================================================================

/// 能力包元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityPackageMeta {
    pub package_id: String,
    pub name: String,
    pub display_name: String,
    pub version: String,
    pub description: String,
    pub package_type: CapabilityPackageType,
    pub department: String,
    pub author: String,
    pub publisher: Option<String>,
    pub homepage: Option<String>,
    pub repository: Option<String>,
    pub license: String,
    pub keywords: Vec<String>,
    pub categories: Vec<String>,
    pub icon: Option<String>,
    pub screenshots: Vec<String>,
    pub status: CapabilityPackageStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub published_at: Option<i64>,
    pub download_count: u64,
    pub rating: Option<f32>,
    pub rating_count: u32,
}

/// 入口点定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntryPoint {
    pub id: String,
    pub name: String,
    pub entry_type: EntryPointType,
    pub handler: String,
    pub description: String,
    pub enabled: bool,
}

/// 工具定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub tool_id: String,
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
    pub handler: String,
    pub timeout_ms: u64,
    pub requires_confirmation: bool,
    pub sensitive_operations: Vec<String>,
}

/// 技能定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillDefinition {
    pub skill_id: String,
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
    pub handler: String,
}

/// 触发器定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerDefinition {
    pub trigger_id: String,
    pub name: String,
    pub trigger_type: String,
    pub handler: String,
    pub conditions: serde_json::Value,
}

/// 权限要求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequirement {
    pub permission: String,
    pub reason: String,
    pub required: bool,
}

/// 包依赖
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageDependency {
    pub package_id: String,
    pub version_constraint: String,
    pub optional: bool,
}

/// 配置schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigurationSchema {
    pub key: String,
    pub value_type: String,
    pub description: String,
    pub default_value: Option<serde_json::Value>,
    pub required: bool,
}

/// 资源定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceDefinition {
    pub resource_id: String,
    pub name: String,
    pub resource_type: String,
    pub capacity: Option<u64>,
}

/// 能力包清单
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityPackageManifest {
    pub meta: CapabilityPackageMeta,
    pub entry_points: Vec<EntryPoint>,
    pub tools: Vec<ToolDefinition>,
    pub skills: Vec<SkillDefinition>,
    pub triggers: Vec<TriggerDefinition>,
    pub permissions: Vec<PermissionRequirement>,
    pub dependencies: Vec<PackageDependency>,
    pub configurations: Vec<ConfigurationSchema>,
    pub resources: Vec<ResourceDefinition>,
}

/// 注册表条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryEntry {
    pub package_id: String,
    pub installed_version: String,
    pub installed_at: i64,
    pub installed_by: String,
    pub tenant_id: String,
    pub department_id: Option<String>,
    pub enabled: bool,
    pub auto_update: bool,
    pub installation_path: String,
    pub checksum: String,
    pub signature: Option<String>,
}

/// 注册表过滤器
#[derive(Debug, Clone)]
pub struct RegistryFilter {
    pub department_id: Option<String>,
    pub package_type: Option<CapabilityPackageType>,
    pub enabled_only: bool,
}

/// 注册表状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryState {
    pub entries: Vec<RegistryEntry>,
    pub last_sync: Option<i64>,
    pub pending_updates: Vec<String>,
    pub conflicts: Vec<DependencyConflict>,
}

/// 依赖冲突
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyConflict {
    pub package_a: String,
    pub package_b: String,
    pub conflict_type: ConflictType,
    pub description: String,
    pub resolution: Option<ConflictResolution>,
}

/// 市场配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceConfig {
    pub marketplace_type: MarketplaceType,
    pub endpoint: String,
    pub api_key: Option<String>,
    pub cache_ttl_seconds: u64,
    pub verify_signature: bool,
    pub trusted_publishers: Vec<String>,
    pub clawhub_compatible: bool,
}

impl Default for MarketplaceConfig {
    fn default() -> Self {
        Self {
            marketplace_type: MarketplaceType::Local,
            endpoint: String::new(),
            api_key: None,
            cache_ttl_seconds: 3600,
            verify_signature: true,
            trusted_publishers: Vec::new(),
            clawhub_compatible: true,
        }
    }
}

/// 市场包信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplacePackage {
    pub meta: CapabilityPackageMeta,
    pub latest_version: String,
    pub versions: Vec<PackageVersion>,
    pub readme: Option<String>,
    pub changelog: Option<String>,
    pub installation_instructions: Option<String>,
}

/// 包版本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageVersion {
    pub version: String,
    pub published_at: i64,
    pub changelog: Option<String>,
    pub compatibility: CompatibilityInfo,
    pub download_url: String,
    pub checksum: String,
    pub signature: Option<String>,
}

/// 兼容性信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityInfo {
    pub min_platform_version: String,
    pub max_platform_version: Option<String>,
    pub required_features: Vec<String>,
    pub incompatible_packages: Vec<String>,
}

/// 搜索结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceSearchResult {
    pub packages: Vec<MarketplacePackage>,
    pub total_count: usize,
    pub page: usize,
    pub page_size: usize,
}

/// 包更新信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageUpdate {
    pub package_id: String,
    pub current_version: String,
    pub latest_version: String,
}

/// 版本号
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct SemanticVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub pre_release: Option<String>,
    pub build: Option<String>,
}

impl fmt::Display for SemanticVersion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut result = format!("{}.{}.{}", self.major, self.minor, self.patch);
        if let Some(ref pre) = self.pre_release {
            result.push('-');
            result.push_str(pre);
        }
        if let Some(ref build) = self.build {
            result.push('+');
            result.push_str(build);
        }
        write!(f, "{}", result)
    }
}

/// 版本比较器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionComparator {
    pub op: ComparatorOp,
    pub version: SemanticVersion,
}

/// 版本约束
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionConstraint {
    pub raw: String,
    pub comparators: Vec<VersionComparator>,
}

/// 已解析的依赖
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedDependencies {
    pub packages: std::collections::HashMap<String, String>,
    pub resolution_order: Vec<String>,
}

/// 搜索选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchOptions {
    pub page: usize,
    pub page_size: usize,
    pub category: Option<String>,
    pub department: Option<String>,
}

impl Default for SearchOptions {
    fn default() -> Self {
        Self {
            page: 1,
            page_size: 20,
            category: None,
            department: None,
        }
    }
}
