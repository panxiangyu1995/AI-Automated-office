# Design: Skill执行引擎

## 模块结构

```
src-tauri/src/agent/skill/
├── mod.rs              # 模块导出
├── types.rs            # 核心类型定义
├── config.rs           # Skill配置
├── discovery/
│   ├── mod.rs          # 发现模块导出
│   ├── loader.rs       # 多源加载器
│   ├── scanner.rs      # 目录扫描器
│   └── merger.rs       # 优先级合并器
├── parser/
│   ├── mod.rs          # 解析模块导出
│   ├── skill_md.rs     # SKILL.md解析器
│   ├── frontmatter.rs  # Frontmatter解析
│   └── validator.rs    # 格式验证器
├── converter/
│   ├── mod.rs          # 转换模块导出
│   ├── tool.rs         # 工具转换器
│   └── trigger.rs      # 触发器转换器
├── loader/
│   ├── mod.rs          # 加载模块导出
│   ├── progressive.rs  # 渐进式加载器
│   ├── budget.rs       # 提示预算控制
│   └── format.rs       # 格式化输出
├── executor/
│   ├── mod.rs          # 执行模块导出
│   ├── runner.rs       # 执行运行器
│   ├── timeout.rs      # 超时控制
│   ├── retry.rs        # 重试机制
│   └── context.rs      # 执行上下文
├── registry/
│   ├── mod.rs          # 注册表模块导出
│   ├── store.rs        # 存储后端
│   └── cache.rs        # 内存缓存
├── version/
│   ├── mod.rs          # 版本模块导出
│   ├── checker.rs      # 版本检查器
│   ├── updater.rs      # 更新管理器
│   └── rollback.rs     # 回滚管理器
├── permission.rs       # 权限控制
└── audit.rs            # 审计集成
```

## 核心数据结构

### Skill基础类型

```rust
/// Skill来源
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SkillSource {
    /// 内置技能
    Bundled,
    /// 托管技能
    Managed,
    /// 工作区技能
    Workspace,
    /// 外部目录
    External,
    /// 私有市场
    PrivateMarket,
    /// ClawHub市场
    ClawHubMarket,
}

/// Skill状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SkillStatus {
    /// 已安装
    Installed,
    /// 加载中
    Loading,
    /// 活跃
    Active,
    /// 错误
    Error,
    /// 已禁用
    Disabled,
    /// 已废弃
    Deprecated,
}

/// Skill条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillEntry {
    /// 技能基本信息
    pub skill: Skill,
    /// 解析的frontmatter
    pub frontmatter: SkillFrontmatter,
    /// 元数据
    pub metadata: SkillMetadata,
    /// 调用策略
    pub invocation: SkillInvocationPolicy,
    /// 来源
    pub source: SkillSource,
    /// 状态
    pub status: SkillStatus,
    /// 安装时间
    pub installed_at: DateTime<Utc>,
    /// 最后更新时间
    pub updated_at: DateTime<Utc>,
}

/// Skill基本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    /// 技能名称
    pub name: String,
    /// SKILL.md文件路径
    pub file_path: PathBuf,
    /// 来源标识
    pub source: String,
}

/// Skill Frontmatter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillFrontmatter {
    /// 名称
    pub name: String,
    /// 版本
    pub version: String,
    /// 描述
    pub description: String,
    /// 作者
    pub author: Option<String>,
    /// 标签
    pub tags: Vec<String>,
    /// 依赖
    pub requires: Option<SkillRequires>,
}

/// Skill依赖
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillRequires {
    /// 二进制依赖
    pub bins: Option<Vec<String>>,
    /// 环境变量
    pub env: Option<Vec<String>>,
    /// 其他Skill
    pub skills: Option<Vec<String>>,
}

/// Skill元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillMetadata {
    /// 图标
    pub icon: Option<String>,
    /// 分类
    pub category: Option<String>,
    /// 主页
    pub homepage: Option<String>,
    /// 仓库
    pub repository: Option<String>,
    /// 许可证
    pub license: Option<String>,
}

/// Skill调用策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillInvocationPolicy {
    /// 禁止模型自动调用
    pub disable_model_invocation: bool,
    /// 超时时间（毫秒）
    pub timeout_ms: u64,
    /// 最大重试次数
    pub max_retries: u32,
    /// 重试延迟（毫秒）
    pub retry_delay_ms: u64,
}
```

### Skill配置

```rust
/// Skill系统配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillConfig {
    /// 加载限制
    pub limits: SkillLimits,
    /// 执行配置
    pub execution: SkillExecutionConfig,
    /// 市场配置
    pub marketplace: MarketplaceConfig,
}

/// Skill加载限制
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLimits {
    /// 每个根目录最多扫描的候选数量
    pub max_candidates_per_root: usize,
    /// 每个来源最多加载的技能数量
    pub max_skills_loaded_per_source: usize,
    /// 单个SKILL.md文件的最大字节数
    pub max_skill_file_bytes: usize,
    /// 提示中最多包含的技能数量
    pub max_skills_in_prompt: usize,
    /// 技能提示的最大字符数
    pub max_skills_prompt_chars: usize,
}

/// Skill执行配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillExecutionConfig {
    /// 默认超时时间（毫秒）
    pub default_timeout_ms: u64,
    /// 默认最大重试次数
    pub default_max_retries: u32,
    /// 默认重试延迟（毫秒）
    pub default_retry_delay_ms: u64,
    /// 并发执行数
    pub max_concurrent: usize,
}

impl Default for SkillLimits {
    fn default() -> Self {
        Self {
            max_candidates_per_root: 100,
            max_skills_loaded_per_source: 50,
            max_skill_file_bytes: 100 * 1024, // 100KB
            max_skills_in_prompt: 20,
            max_skills_prompt_chars: 50_000,
        }
    }
}
```

### 工具转换

```rust
/// 转换后的工具
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvertedTool {
    /// 工具ID
    pub id: String,
    /// 工具名称
    pub name: String,
    /// 来源Skill
    pub source_skill: String,
    /// 工具类型
    pub tool_type: ConvertedToolType,
    /// 描述
    pub description: String,
    /// 参数定义
    pub parameters: Vec<ToolParameter>,
    /// 返回类型
    pub return_type: String,
}

/// 转换后工具类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConvertedToolType {
    /// MCP工具
    Mcp,
    /// 内置工具
    Builtin,
    /// 自定义工具
    Custom,
}

/// 工具参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolParameter {
    /// 参数名
    pub name: String,
    /// 参数类型
    pub param_type: String,
    /// 描述
    pub description: String,
    /// 是否必需
    pub required: bool,
    /// 默认值
    pub default_value: Option<String>,
    /// 枚举值
    pub enum_values: Option<Vec<String>>,
}
```

### 触发器转换

```rust
/// 转换后的触发器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvertedTrigger {
    /// 触发器ID
    pub id: String,
    /// 触发器名称
    pub name: String,
    /// 来源Skill
    pub source_skill: String,
    /// 触发器类型
    pub trigger_type: TriggerType,
    /// 描述
    pub description: String,
    /// 配置
    pub config: HashMap<String, String>,
}

/// 触发器类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TriggerType {
    /// 事件触发
    Event,
    /// 定时触发
    Schedule,
    /// 手动触发
    Manual,
    /// 条件触发
    Condition,
}
```

## 核心流程

### 1. Skill发现流程

```rust
/// 加载所有Skill条目
pub async fn load_skill_entries(
    workspace_dir: &Path,
    config: &SkillConfig,
) -> Result<Vec<SkillEntry>> {
    let limits = &config.limits;
    
    // 1. 确定所有技能目录
    let bundled_dir = resolve_bundled_skills_dir();
    let managed_dir = get_managed_skills_dir();
    let workspace_dir = workspace_dir.join("skills");
    let extra_dirs = config.marketplace.extra_dirs.clone();
    
    // 2. 从各个来源加载技能
    let mut all_skills = Vec::new();
    
    // Bundled skills (最低优先级)
    all_skills.extend(
        load_skills_from_dir(&bundled_dir, SkillSource::Bundled, limits).await?
    );
    
    // Managed skills
    all_skills.extend(
        load_skills_from_dir(&managed_dir, SkillSource::Managed, limits).await?
    );
    
    // Workspace skills (最高优先级)
    all_skills.extend(
        load_skills_from_dir(&workspace_dir, SkillSource::Workspace, limits).await?
    );
    
    // 3. 按优先级合并（后者覆盖前者）
    let merged = merge_skills_by_priority(all_skills);
    
    Ok(merged)
}
```

### 2. SKILL.md解析流程

```rust
/// 解析SKILL.md文件
pub fn parse_skill_md(content: &str, file_path: &Path) -> Result<SkillEntry> {
    // 1. 分离Frontmatter和正文
    let (frontmatter, body) = extract_frontmatter(content)?;
    
    // 2. 解析Frontmatter
    let fm: SkillFrontmatter = serde_yaml::from_str(&frontmatter)
        .map_err(|e| SkillError::ParseError(format!("Frontmatter解析失败: {}", e)))?;
    
    // 3. 提取元数据
    let metadata = extract_metadata(&fm);
    
    // 4. 解析正文中的工具和触发器
    let (tools, triggers) = parse_body(body)?;
    
    // 5. 构建SkillEntry
    Ok(SkillEntry {
        skill: Skill {
            name: fm.name.clone(),
            file_path: file_path.to_path_buf(),
            source: "workspace".to_string(),
        },
        frontmatter: fm,
        metadata,
        invocation: SkillInvocationPolicy::default(),
        source: SkillSource::Workspace,
        status: SkillStatus::Installed,
        installed_at: Utc::now(),
        updated_at: Utc::now(),
    })
}

/// 提取Frontmatter
fn extract_frontmatter(content: &str) -> Result<(String, &str)> {
    if !content.starts_with("---\n") {
        return Ok((String::new(), content));
    }
    
    let end_marker = content[4..].find("\n---\n")
        .ok_or_else(|| SkillError::ParseError("未找到Frontmatter结束标记".into()))?;
    
    let frontmatter = content[4..end_marker + 4].to_string();
    let body = &content[end_marker + 9..];
    
    Ok((frontmatter, body))
}
```

### 3. 渐进式加载流程

```rust
/// 解析工作区Skill提示状态
pub fn resolve_skill_prompt_state(
    workspace_dir: &Path,
    config: &SkillConfig,
    skill_filter: Option<&[String]>,
) -> Result<SkillPromptState> {
    // 1. 加载所有技能条目
    let entries = load_skill_entries_sync(workspace_dir, config)?;
    
    // 2. 过滤符合条件的技能
    let eligible = filter_skill_entries(&entries, config, skill_filter);
    
    // 3. 排除禁用模型调用的技能
    let prompt_entries: Vec<_> = eligible
        .iter()
        .filter(|e| !e.invocation.disable_model_invocation)
        .cloned()
        .collect();
    
    // 4. 应用提示限制
    let (skills_for_prompt, truncated, compact) = apply_skills_prompt_limits(
        &prompt_entries,
        &config.limits,
    );
    
    // 5. 生成提示文本
    let prompt = if compact {
        format_skills_compact(&skills_for_prompt)
    } else {
        format_skills_full(&skills_for_prompt)
    };
    
    Ok(SkillPromptState {
        eligible,
        prompt,
        truncated,
        compact,
    })
}

/// 应用提示限制
fn apply_skills_prompt_limits(
    skills: &[SkillEntry],
    limits: &SkillLimits,
) -> (Vec<SkillEntry>, bool, bool) {
    // 第一层限制: 按数量截断
    let by_count: Vec<_> = skills.iter()
        .take(limits.max_skills_in_prompt)
        .cloned()
        .collect();
    
    let full_format = format_skills_full(&by_count);
    if full_format.len() <= limits.max_skills_prompt_chars {
        return (by_count, false, false);
    }
    
    // 尝试紧凑格式
    let compact_format = format_skills_compact(&by_count);
    if compact_format.len() <= limits.max_skills_prompt_chars {
        return (by_count, false, true);
    }
    
    // 二分查找最大可容纳的前缀
    let fitted = binary_search_fit(&by_count, limits.max_skills_prompt_chars);
    (fitted, true, true)
}
```

### 4. 执行流程

```rust
/// Skill执行器
pub struct SkillExecutor {
    config: SkillExecutionConfig,
    audit: AuditLogger,
}

impl SkillExecutor {
    /// 执行Skill
    pub async fn execute(
        &self,
        skill: &SkillEntry,
        input: SkillInput,
    ) -> Result<SkillOutput> {
        let start_time = Instant::now();
        let skill_name = skill.skill.name.clone();
        
        // 1. 记录执行开始
        self.audit.log_skill_start(&skill_name, &input);
        
        // 2. 执行（带超时和重试）
        let result = self.execute_with_retry(skill, input.clone()).await;
        
        // 3. 记录执行结果
        let duration = start_time.elapsed();
        self.audit.log_skill_end(&skill_name, &result, duration);
        
        result
    }
    
    /// 带重试的执行
    async fn execute_with_retry(
        &self,
        skill: &SkillEntry,
        input: SkillInput,
    ) -> Result<SkillOutput> {
        let max_retries = skill.invocation.max_retries;
        let timeout = Duration::from_millis(skill.invocation.timeout_ms);
        let retry_delay = Duration::from_millis(skill.invocation.retry_delay_ms);
        
        let mut last_error = None;
        
        for attempt in 0..=max_retries {
            match tokio::time::timeout(
                timeout,
                self.execute_skill(skill, &input),
            ).await {
                Ok(Ok(output)) => return Ok(output),
                Ok(Err(e)) => {
                    last_error = Some(e);
                    if attempt < max_retries {
                        tokio::time::sleep(retry_delay).await;
                    }
                }
                Err(_) => {
                    last_error = Some(SkillError::Timeout);
                    if attempt < max_retries {
                        tokio::time::sleep(retry_delay).await;
                    }
                }
            }
        }
        
        Err(last_error.unwrap_or(SkillError::MaxRetriesExceeded))
    }
}
```

## Tauri命令

```rust
/// 获取已安装的Skill列表
#[tauri::command]
pub async fn get_installed_skills(
    state: State<'_, SkillRegistry>,
) -> Result<Vec<SkillEntry>, String> {
    state.get_all().await.map_err(|e| e.to_string())
}

/// 解析SKILL.md文件
#[tauri::command]
pub async fn parse_skill_file(
    file_path: String,
    state: State<'_, SkillParser>,
) -> Result<SkillEntry, String> {
    state.parse(&PathBuf::from(file_path)).await
        .map_err(|e| e.to_string())
}

/// 启用/禁用Skill
#[tauri::command]
pub async fn toggle_skill(
    skill_name: String,
    enabled: bool,
    state: State<'_, SkillRegistry>,
) -> Result<(), String> {
    state.set_enabled(&skill_name, enabled).await
        .map_err(|e| e.to_string())
}

/// 执行Skill
#[tauri::command]
pub async fn execute_skill(
    skill_name: String,
    input: SkillInput,
    state: State<'_, SkillExecutor>,
) -> Result<SkillOutput, String> {
    state.execute_by_name(&skill_name, input).await
        .map_err(|e| e.to_string())
}

/// 检查Skill更新
#[tauri::command]
pub async fn check_skill_updates(
    state: State<'_, SkillVersionManager>,
) -> Result<Vec<SkillUpdateInfo>, String> {
    state.check_updates().await.map_err(|e| e.to_string())
}

/// 更新Skill
#[tauri::command]
pub async fn update_skill(
    skill_name: String,
    state: State<'_, SkillVersionManager>,
) -> Result<SkillEntry, String> {
    state.update(&skill_name).await.map_err(|e| e.to_string())
}

/// 获取Skill提示文本
#[tauri::command]
pub async fn get_skill_prompt(
    skill_filter: Option<Vec<String>>,
    state: State<'_, SkillLoader>,
) -> Result<SkillPromptState, String> {
    state.get_prompt(skill_filter.as_deref()).await
        .map_err(|e| e.to_string())
}
```

## 测试策略

1. **单元测试**
   - SKILL.md解析测试
   - Frontmatter解析测试
   - 工具/触发器转换测试
   - 渐进式加载测试

2. **集成测试**
   - 多源加载测试
   - 执行引擎测试
   - 审计集成测试
   - 版本管理测试

3. **性能测试**
   - 大规模Skill加载测试
   - 提示预算控制测试
   - 并发执行测试
