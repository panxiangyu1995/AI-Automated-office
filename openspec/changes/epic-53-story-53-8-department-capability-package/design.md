# 部门能力包系统 - 技术设计

## 1. 数据结构设计

### 1.1 能力包模型

```rust
/// 能力包状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CapabilityPackageStatus {
    Draft,
    Published,
    Deprecated,
    Archived,
}

/// 能力包类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CapabilityPackageType {
    Core,
    Extension,
    Custom,
}

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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EntryPointType {
    Command,
    Menu,
    Panel,
    Workflow,
    Agent,
}

/// 工具定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub tool_id: String,
    pub name: String,
    pub description: String,
    pub parameters: JsonSchema,
    pub handler: String,
    pub timeout_ms: u64,
    pub requires_confirmation: bool,
    pub sensitive_operations: Vec<String>,
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
```

### 1.2 注册表模型

```rust
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConflictType {
    VersionMismatch,
    ResourceConflict,
    PermissionConflict,
    DependencyCycle,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConflictResolution {
    UseVersion { package: String, version: String },
    Disable { package: String },
    Manual,
}
```

### 1.3 市场模型

```rust
/// 市场类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MarketplaceType {
    CloudMarket,
    Local,
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
```

### 1.4 版本管理

```rust
/// 版本号
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct SemanticVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub pre_release: Option<String>,
    pub build: Option<String>,
}

impl SemanticVersion {
    pub fn parse(version: &str) -> Result<Self>;
    
    pub fn is_compatible(&self, constraint: &str) -> bool;
    
    pub fn bump_major(&self) -> Self;
    pub fn bump_minor(&self) -> Self;
    pub fn bump_patch(&self) -> Self;
}

/// 版本约束
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionConstraint {
    pub raw: String,
    pub comparators: Vec<VersionComparator>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionComparator {
    pub op: ComparatorOp,
    pub version: SemanticVersion,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ComparatorOp {
    Exact,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Compatible,  // ^
    Range,       // -
    Wildcard,    // *
}
```

## 2. 核心组件设计

### 2.1 能力包注册表

```rust
/// 能力包注册表
pub struct CapabilityPackageRegistry {
    entries: RwLock<HashMap<String, RegistryEntry>>,
    marketplace_clients: HashMap<MarketplaceType, Arc<dyn MarketplaceClient>>,
    dependency_resolver: DependencyResolver,
    storage: Arc<dyn PackageStorage>,
    config: RegistryConfig,
}

impl CapabilityPackageRegistry {
    pub async fn register(&self, package: &CapabilityPackageManifest) -> Result<RegistryEntry> {
        self.validate_package(package).await?;
        self.check_permissions(package).await?;
        self.resolve_dependencies(package).await?;
        
        let entry = RegistryEntry {
            package_id: package.meta.package_id.clone(),
            installed_version: package.meta.version.clone(),
            installed_at: Utc::now().timestamp(),
            installed_by: self.config.current_user.clone(),
            tenant_id: self.config.tenant_id.clone(),
            department_id: self.config.department_id.clone(),
            enabled: true,
            auto_update: true,
            installation_path: self.get_installation_path(&package.meta.package_id),
            checksum: self.calculate_checksum(package).await?,
            signature: None,
        };
        
        let mut entries = self.entries.write().await;
        entries.insert(entry.package_id.clone(), entry.clone());
        
        self.persist_registry().await?;
        self.notify_change(&entry).await?;
        
        Ok(entry)
    }
    
    pub async fn unregister(&self, package_id: &str) -> Result<()> {
        let entry = self.get_entry(package_id).await?;
        
        self.check_dependents(package_id).await?;
        self.unload_package(package_id).await?;
        
        let mut entries = self.entries.write().await;
        entries.remove(package_id);
        
        self.persist_registry().await?;
        self.notify_removal(package_id).await?;
        
        Ok(())
    }
    
    pub async fn list(&self, filter: Option<RegistryFilter>) -> Result<Vec<RegistryEntry>> {
        let entries = self.entries.read().await;
        let mut result: Vec<_> = entries.values().cloned().collect();
        
        if let Some(f) = filter {
            result.retain(|e| {
                if let Some(ref dept) = f.department_id {
                    e.department_id.as_deref() == Some(dept)
                } else {
                    true
                }
            });
        }
        
        Ok(result)
    }
    
    pub async fn check_updates(&self) -> Result<Vec<PackageUpdate>> {
        let entries = self.entries.read().await;
        let mut updates = Vec::new();
        
        for entry in entries.values() {
            if let Some(latest) = self.get_latest_version(&entry.package_id).await? {
                if latest != entry.installed_version {
                    updates.push(PackageUpdate {
                        package_id: entry.package_id.clone(),
                        current_version: entry.installed_version.clone(),
                        latest_version: latest,
                    });
                }
            }
        }
        
        Ok(updates)
    }
}
```

### 2.2 市场客户端

```rust
/// 市场客户端trait
#[async_trait]
pub trait MarketplaceClient: Send + Sync {
    fn marketplace_type(&self) -> MarketplaceType;
    async fn search(&self, query: &str, options: SearchOptions) -> Result<MarketplaceSearchResult>;
    async fn get_package(&self, package_id: &str) -> Result<MarketplacePackage>;
    async fn get_version(&self, package_id: &str, version: &str) -> Result<PackageVersion>;
    async fn download(&self, package_id: &str, version: &str) -> Result<Vec<u8>>;
    async fn publish(&self, package: &CapabilityPackageManifest, archive: &[u8]) -> Result<()>;
    async fn unpublish(&self, package_id: &str, version: &str) -> Result<()>;
}

/// 企业云端市场客户端
pub struct CloudMarketClient {
    endpoint: String,
    http_client: reqwest::Client,
    cache: PackageCache,
    clawhub_compatible: bool,
}

impl CloudMarketClient {
    pub fn new(config: &MarketplaceConfig) -> Self {
        Self {
            endpoint: config.endpoint.clone(),
            http_client: reqwest::Client::new(),
            cache: PackageCache::new(config.cache_ttl_seconds),
            clawhub_compatible: config.clawhub_compatible,
        }
    }
    
    pub fn is_clawhub_compatible(&self) -> bool {
        self.clawhub_compatible
    }
}

#[async_trait]
impl MarketplaceClient for CloudMarketClient {
    fn marketplace_type(&self) -> MarketplaceType {
        MarketplaceType::CloudMarket
    }
    
    async fn search(&self, query: &str, options: SearchOptions) -> Result<MarketplaceSearchResult> {
        let url = format!("{}/api/v1/packages/search", self.endpoint);
        let response = self.http_client
            .get(&url)
            .query(&[
                ("q", query),
                ("page", &options.page.to_string()),
                ("page_size", &options.page_size.to_string()),
            ])
            .send()
            .await?;
        
        let result = response.json::<MarketplaceSearchResult>().await?;
        Ok(result)
    }
    
    async fn download(&self, package_id: &str, version: &str) -> Result<Vec<u8>> {
        let url = format!("{}/api/v1/packages/{}/{}/download", self.endpoint, package_id, version);
        let response = self.http_client
            .get(&url)
            .send()
            .await?;
        
        let bytes = response.bytes().await?;
        Ok(bytes.to_vec())
    }
    
    async fn publish(&self, package: &CapabilityPackageManifest, archive: &[u8]) -> Result<()> {
        let url = format!("{}/api/v1/packages/publish", self.endpoint);
        let form = reqwest::multipart::Form::new()
            .text("package_id", package.meta.package_id.clone())
            .text("version", package.meta.version.clone())
            .part("archive", reqwest::multipart::Part::bytes(archive.to_vec())
                .file_name(format!("{}-{}.zip", package.meta.package_id, package.meta.version)));
        
        self.http_client.post(&url).multipart(form).send().await?;
        Ok(())
    }
}

/// ClawHub格式兼容适配器
pub struct ClawHubFormatAdapter {
    inner: CloudMarketClient,
}

impl ClawHubFormatAdapter {
    pub fn new(client: CloudMarketClient) -> Self {
        Self { inner: client }
    }
    
    pub async fn import_clawhub_package(&self, archive: &[u8]) -> Result<CapabilityPackageManifest> {
        let clawhub_manifest = self.parse_clawhub_manifest(archive).await?;
        self.convert_to_capability_manifest(clawhub_manifest).await
    }
    
    async fn parse_clawhub_manifest(&self, archive: &[u8]) -> Result<ClawHubManifest> {
        // 解析ClawHub格式的manifest文件
    }
    
    async fn convert_to_capability_manifest(&self, clawhub: ClawHubManifest) -> Result<CapabilityPackageManifest> {
        // 将ClawHub格式转换为企业能力包格式
    }
}
```

### 2.3 依赖解析器

```rust
/// 依赖解析器
pub struct DependencyResolver {
    registry: Arc<CapabilityPackageRegistry>,
}

impl DependencyResolver {
    pub async fn resolve(&self, package: &CapabilityPackageManifest) -> Result<ResolvedDependencies> {
        let mut resolved = HashMap::new();
        let mut pending = vec![(package.meta.package_id.clone(), package.meta.version.clone())];
        let mut visited = HashSet::new();
        
        while let Some((pkg_id, version)) = pending.pop() {
            if visited.contains(&pkg_id) {
                continue;
            }
            visited.insert(pkg_id.clone());
            
            let pkg = self.registry.get_package(&pkg_id, &version).await?;
            
            for dep in &pkg.dependencies {
                let resolved_version = self.find_compatible_version(&dep.package_id, &dep.version_constraint).await?;
                
                if let Some(ref existing) = resolved.get(&dep.package_id) {
                    if existing != &resolved_version {
                        return Err(anyhow!("dependency conflict: {} requires {} but {} is already resolved",
                            pkg_id, resolved_version, existing));
                    }
                } else {
                    resolved.insert(dep.package_id.clone(), resolved_version.clone());
                    pending.push((dep.package_id.clone(), resolved_version));
                }
            }
        }
        
        Ok(ResolvedDependencies {
            packages: resolved,
            resolution_order: visited.into_iter().collect(),
        })
    }
    
    pub async fn check_conflicts(&self, packages: &[String]) -> Result<Vec<DependencyConflict>> {
        let mut conflicts = Vec::new();
        
        for i in 0..packages.len() {
            for j in (i + 1)..packages.len() {
                if let Some(conflict) = self.check_pair_conflict(&packages[i], &packages[j]).await? {
                    conflicts.push(conflict);
                }
            }
        }
        
        Ok(conflicts)
    }
}
```

### 2.4 权限控制器

```rust
/// 能力包权限控制器
pub struct PackagePermissionController {
    permission_service: Arc<dyn PermissionService>,
    audit_logger: Arc<dyn AuditLogger>,
}

impl PackagePermissionController {
    pub async fn check_install_permission(&self, package: &CapabilityPackageManifest, user_id: &str) -> Result<bool> {
        for perm in &package.permissions {
            if perm.required {
                let has_permission = self.permission_service
                    .check_permission(user_id, &perm.permission)
                    .await?;
                
                if !has_permission {
                    self.audit_logger.log(AuditEvent {
                        event_type: "package_permission_denied".to_string(),
                        user_id: user_id.to_string(),
                        package_id: package.meta.package_id.clone(),
                        permission: perm.permission.clone(),
                        timestamp: Utc::now().timestamp(),
                    }).await;
                    
                    return Ok(false);
                }
            }
        }
        
        Ok(true)
    }
    
    pub async fn grant_package_permissions(&self, package: &CapabilityPackageManifest, user_id: &str) -> Result<()> {
        for perm in &package.permissions {
            if perm.required {
                self.permission_service
                    .grant_permission(user_id, &perm.permission, &perm.reason)
                    .await?;
            }
        }
        
        self.audit_logger.log(AuditEvent {
            event_type: "package_permissions_granted".to_string(),
            user_id: user_id.to_string(),
            package_id: package.meta.package_id.clone(),
            permission: "all".to_string(),
            timestamp: Utc::now().timestamp(),
        }).await;
        
        Ok(())
    }
}
```

## 3. Tauri命令接口

```rust
#[tauri::command]
pub async fn install_capability_package(
    package_id: String,
    version: Option<String>,
    marketplace: Option<MarketplaceType>,
    app_handle: tauri::AppHandle,
) -> Result<RegistryEntry, String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    registry.install(&package_id, version.as_deref(), marketplace)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn uninstall_capability_package(
    package_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    registry.uninstall(&package_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_installed_packages(
    department_id: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<Vec<RegistryEntry>, String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    let filter = department_id.map(|d| RegistryFilter { department_id: Some(d) });
    registry.list(filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_marketplace(
    query: String,
    marketplace: MarketplaceType,
    page: usize,
    app_handle: tauri::AppHandle,
) -> Result<MarketplaceSearchResult, String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    registry.search_marketplace(&query, marketplace, page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_package_updates(
    app_handle: tauri::AppHandle,
) -> Result<Vec<PackageUpdate>, String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    registry.check_updates()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_capability_package(
    package_id: String,
    target_version: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<RegistryEntry, String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    registry.update(&package_id, target_version.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn enable_capability_package(
    package_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    registry.set_enabled(&package_id, true)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn disable_capability_package(
    package_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let registry = app_handle.state::<CapabilityPackageRegistry>();
    registry.set_enabled(&package_id, false)
        .await
        .map_err(|e| e.to_string())
}
```

## 4. 前端集成

```typescript
interface CapabilityPackageService {
  installPackage(packageId: string, version?: string, marketplace?: MarketplaceType): Promise<RegistryEntry>;
  uninstallPackage(packageId: string): Promise<void>;
  listInstalled(departmentId?: string): Promise<RegistryEntry[]>;
  searchMarketplace(query: string, marketplace: MarketplaceType, page?: number): Promise<MarketplaceSearchResult>;
  checkUpdates(): Promise<PackageUpdate[]>;
  updatePackage(packageId: string, targetVersion?: string): Promise<RegistryEntry>;
  enablePackage(packageId: string): Promise<void>;
  disablePackage(packageId: string): Promise<void>;
}

interface RegistryEntry {
  packageId: string;
  installedVersion: string;
  installedAt: number;
  installedBy: string;
  tenantId: string;
  departmentId?: string;
  enabled: boolean;
  autoUpdate: boolean;
  installationPath: string;
  checksum: string;
}

interface PackageUpdate {
  packageId: string;
  currentVersion: string;
  latestVersion: string;
}
```

## 5. 性能指标

| 指标 | 目标值 |
|------|--------|
| 包安装时间 | < 30s |
| 包卸载时间 | < 5s |
| 市场搜索响应 | < 2s |
| 依赖解析时间 | < 5s |
| 更新检查时间 | < 3s |
| 最大包大小 | 500MB |
| 最大依赖深度 | 10层 |
