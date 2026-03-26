# Design: Sub-Agent执行上下文 - 隔离环境

## 技术方案

### 实现类型
- **类型**: new（新功能开发）
- **优先级**: high
- **阶段**: Phase 2 - Sub-Agent运行时实现
- **实现方式**: 前后端协同，前端定义类型接口，后端实现核心逻辑

### API设计

#### 前端类型定义

```typescript
// src/features/agent/types/subagent-context.types.ts

/**
 * Sub-Agent执行上下文配置
 */
export interface SubAgentContextConfig {
  /** Sub-Agent唯一标识 */
  subAgentId: string;
  /** 记忆注入范围配置 */
  memoryScope: MemoryScopeConfig;
  /** 允许使用的工具列表 */
  allowedTools: string[];
  /** 权限级别 */
  permissionLevel: PermissionLevel;
  /** 超时配置（毫秒） */
  timeoutMs: number;
  /** 系统提示词自定义部分 */
  customSystemPrompt?: string;
}

/**
 * 记忆范围配置
 */
export interface MemoryScopeConfig {
  /** 是否启用记忆注入 */
  enabled: boolean;
  /** 可访问的记忆类型列表 */
  allowedMemoryTypes: MemoryType[];
  /** 记忆检索的最大数量 */
  maxMemoryCount: number;
  /** 记忆检索的时间范围（秒），0表示不限制 */
  timeRangeSeconds: number;
  /** 关键词过滤白名单 */
  keywordWhitelist?: string[];
}

/**
 * 记忆类型枚举
 */
export enum MemoryType {
  Personal = 'personal',       // 个人记忆
  Enterprise = 'enterprise',   // 企业知识
  Session = 'session',         // 会话记忆
  Correction = 'correction',   // 错题集
}

/**
 * 权限级别枚举
 */
export enum PermissionLevel {
  ReadOnly = 'read_only',      // 只读
  Standard = 'standard',       // 标准
  Elevated = 'elevated',       //  elevated权限
  Admin = 'admin',             // 管理员
}

/**
 * Sub-Agent执行上下文
 */
export interface SubAgentExecutionContext {
  /** 上下文ID */
  id: string;
  /** 关联的Sub-Agent ID */
  subAgentId: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 上下文状态 */
  status: ContextStatus;
  /** 当前嵌套深度 */
  nestingDepth: number;
  /** 已使用的工具列表 */
  usedTools: string[];
  /** 记忆注入记录 */
  memoryInjections: MemoryInjection[];
}

/**
 * 上下文状态
 */
export enum ContextStatus {
  Initializing = 'initializing',
  Ready = 'ready',
  Executing = 'executing',
  Completed = 'completed',
  Failed = 'failed',
  Timeout = 'timeout',
}

/**
 * 记忆注入记录
 */
export interface MemoryInjection {
  /** 记忆ID */
  memoryId: string;
  /** 记忆类型 */
  memoryType: MemoryType;
  /** 注入时间戳 */
  injectedAt: number;
  /** 相关度评分 */
  relevanceScore: number;
}

/**
 * 工具过滤结果
 */
export interface ToolFilterResult {
  /** 过滤后的工具列表 */
  allowedTools: ToolDescriptor[];
  /** 被过滤的工具数量 */
  filteredCount: number;
  /** 过滤原因 */
  filterReasons: string[];
}

/**
 * 工具描述符（脱敏后）
 */
export interface ToolDescriptor {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 参数schema（脱敏） */
  parameters: Record<string, unknown>;
  /** 是否需要确认 */
  requireConfirmation: boolean;
}
```

#### Rust后端接口

```rust
// src-tauri/src/agent/subagent/commands.rs

use serde::{Deserialize, Serialize};
use tauri::command;

/// Sub-Agent上下文配置（从Tauri前端传入）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentContextConfig {
    pub sub_agent_id: String,
    pub memory_scope: MemoryScopeConfig,
    pub allowed_tools: Vec<String>,
    pub permission_level: PermissionLevel,
    #[serde(default = "default_timeout_ms")]
    pub timeout_ms: u64,
    pub custom_system_prompt: Option<String>,
}

fn default_timeout_ms() -> u64 { 300000 } // 默认5分钟

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryScopeConfig {
    pub enabled: bool,
    pub allowed_memory_types: Vec<MemoryType>,
    #[serde(default = "default_max_memory_count")]
    pub max_memory_count: u32,
    #[serde(default)]
    pub time_range_seconds: u64,
    pub keyword_whitelist: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemoryType {
    Personal,
    Enterprise,
    Session,
    Correction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PermissionLevel {
    ReadOnly,
    Standard,
    Elevated,
    Admin,
}

/// 创建Sub-Agent执行上下文
#[command]
pub async fn create_subagent_context(
    config: SubAgentContextConfig,
) -> Result<SubAgentContext, String> {
    // 实现逻辑
}

/// 获取Sub-Agent执行上下文
#[command]
pub async fn get_subagent_context(
    context_id: String,
) -> Result<SubAgentContext, String> {
    // 实现逻辑
}

/// 更新Sub-Agent执行上下文状态
#[command]
pub async fn update_subagent_context_status(
    context_id: String,
    status: ContextStatus,
) -> Result<(), String> {
    // 实现逻辑
}

/// 验证工具是否在允许列表中
#[command]
pub async fn validate_tool_access(
    context_id: String,
    tool_name: String,
) -> Result<bool, String> {
    // 实现逻辑
}
```

### 模块结构

```
src-tauri/src/agent/
├── mod.rs                          # Agent模块入口
├── subagent/
│   ├── mod.rs                      # SubAgent子模块入口
│   ├── context.rs                  # SubAgentExecutionContext核心实现
│   ├── memory.rs                   # 记忆注入实现
│   ├── tools.rs                    # 工具过滤实现
│   ├── permission.rs               # 权限上下文实现
│   ├── prompt.rs                   # 系统提示词构建器
│   └── commands.rs                 # Tauri命令接口
```

### 技术方案详解

#### 1. SubAgentExecutionContext核心类

```rust
// src-tauri/src/agent/subagent/context.rs

pub struct SubAgentExecutionContext {
    /// 上下文唯一标识
    id: Uuid,
    /// 关联的Sub-Agent ID
    sub_agent_id: String,
    /// 创建时间戳
    created_at: DateTime<Utc>,
    /// 最后活跃时间戳
    last_active_at: DateTime<Utc>,
    /// 当前状态
    status: ContextStatus,
    /// 当前嵌套深度
    nesting_depth: u32,
    /// 记忆注入配置
    memory_config: MemoryScopeConfig,
    /// 允许的工具列表
    allowed_tools: HashSet<String>,
    /// 权限级别
    permission_level: PermissionLevel,
    /// 已使用的工具记录
    used_tools: Vec<ToolUsageRecord>,
    /// 记忆注入历史
    memory_injections: Vec<MemoryInjectionRecord>,
    /// 自定义系统提示词
    custom_system_prompt: Option<String>,
}

impl SubAgentExecutionContext {
    /// 创建新的执行上下文
    pub fn new(config: SubAgentContextConfig) -> Result<Self, ContextError> {
        // 验证配置合法性
        Self::validate_config(&config)?;

        Ok(Self {
            id: Uuid::new_v4(),
            sub_agent_id: config.sub_agent_id,
            created_at: Utc::now(),
            last_active_at: Utc::now(),
            status: ContextStatus::Initializing,
            nesting_depth: 0,
            memory_config: config.memory_scope,
            allowed_tools: config.allowed_tools.into_iter().collect(),
            permission_level: config.permission_level,
            used_tools: Vec::new(),
            memory_injections: Vec::new(),
            custom_system_prompt: config.custom_system_prompt,
        })
    }

    /// 验证配置合法性
    fn validate_config(config: &SubAgentContextConfig) -> Result<(), ContextError> {
        if config.sub_agent_id.is_empty() {
            return Err(ContextError::InvalidConfig("sub_agent_id cannot be empty".into()));
        }
        if config.timeout_ms == 0 {
            return Err(ContextError::InvalidConfig("timeout_ms must be positive".into()));
        }
        Ok(())
    }

    /// 递增嵌套深度
    pub fn increment_nesting_depth(&mut self) -> Result<u32, ContextError> {
        const MAX_NESTING_DEPTH: u32 = 3;
        if self.nesting_depth >= MAX_NESTING_DEPTH {
            return Err(ContextError::MaxNestingDepthExceeded);
        }
        self.nesting_depth += 1;
        Ok(self.nesting_depth)
    }

    /// 递减嵌套深度
    pub fn decrement_nesting_depth(&mut self) {
        if self.nesting_depth > 0 {
            self.nesting_depth -= 1;
        }
    }

    /// 检查工具是否允许使用
    pub fn is_tool_allowed(&self, tool_name: &str) -> bool {
        // 如果工具列表为空，表示允许所有工具
        if self.allowed_tools.is_empty() {
            return true;
        }
        self.allowed_tools.contains(tool_name)
    }

    /// 记录工具使用
    pub fn record_tool_usage(&mut self, tool_name: String, params: serde_json::Value) {
        self.used_tools.push(ToolUsageRecord {
            tool_name,
            params,
            used_at: Utc::now(),
        });
        self.last_active_at = Utc::now();
    }
}
```

#### 2. 记忆注入实现

```rust
// src-tauri/src/agent/subagent/memory.rs

pub struct MemoryInjector {
    config: MemoryScopeConfig,
}

impl MemoryInjector {
    /// 根据配置注入记忆
    pub async fn inject_memories(
        &self,
        context: &SubAgentExecutionContext,
    ) -> Result<Vec<MemoryContent>, MemoryError> {
        if !self.config.enabled {
            return Ok(Vec::new());
        }

        let mut results = Vec::new();

        for memory_type in &self.config.allowed_memory_types {
            let memories = self
                .retrieve_memories(context, memory_type)
                .await?;
            results.extend(memories);
        }

        // 按相关度排序并限制数量
        results.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
        results.truncate(self.config.max_memory_count as usize);

        Ok(results)
    }

    /// 检索特定类型的记忆
    async fn retrieve_memories(
        &self,
        context: &SubAgentExecutionContext,
        memory_type: &MemoryType,
    ) -> Result<Vec<MemoryContent>, MemoryError> {
        match memory_type {
            MemoryType::Personal => self.retrieve_personal_memories(context).await,
            MemoryType::Enterprise => self.retrieve_enterprise_memories(context).await,
            MemoryType::Session => self.retrieve_session_memories(context).await,
            MemoryType::Correction => self.retrieve_correction_memories(context).await,
        }
    }

    /// 检索个人记忆
    async fn retrieve_personal_memories(
        &self,
        context: &SubAgentExecutionContext,
    ) -> Result<Vec<MemoryContent>, MemoryError> {
        // 实现：从记忆存储中检索个人记忆
        // 使用context.sub_agent_id和context.memory_config进行过滤
    }

    /// 检索企业知识
    async fn retrieve_enterprise_memories(
        &self,
        context: &SubAgentExecutionContext,
    ) -> Result<Vec<MemoryContent>, MemoryError> {
        // 实现：从企业知识库中检索相关知识
    }

    /// 检索会话记忆
    async fn retrieve_session_memories(
        &self,
        context: &SubAgentExecutionContext,
    ) -> Result<Vec<MemoryContent>, MemoryError> {
        // 实现：检索当前会话的记忆
    }

    /// 检索错题集
    async fn retrieve_correction_memories(
        &self,
        context: &SubAgentExecutionContext,
    ) -> Result<Vec<MemoryContent>, MemoryError> {
        // 实现：检索相关的纠正规则
    }
}
```

#### 3. 工具过滤实现

```rust
// src-tauri/src/agent/subagent/tools.rs

pub struct ToolFilter {
    context: Arc<Mutex<SubAgentExecutionContext>>,
}

impl ToolFilter {
    /// 过滤工具列表
    pub fn filter_tools(
        &self,
        all_tools: Vec<ToolDescriptor>,
    ) -> ToolFilterResult {
        let allowed_tools_set: HashSet<&str> = {
            let context = self.context.lock().unwrap();
            context.get_allowed_tools()
        };

        let mut allowed_tools = Vec::new();
        let mut filtered_count = 0;
        let mut filter_reasons = Vec::new();

        for tool in all_tools {
            if allowed_tools_set.is_empty() || allowed_tools_set.contains(tool.name.as_str()) {
                // 脱敏工具描述
                allowed_tools.push(self.sanitize_tool_descriptor(tool));
            } else {
                filtered_count += 1;
                filter_reasons.push(format!(
                    "Tool '{}' not in allowed list for sub-agent",
                    tool.name
                ));
            }
        }

        ToolFilterResult {
            allowed_tools,
            filtered_count,
            filter_reasons,
        }
    }

    /// 脱敏工具描述符（移除敏感参数信息）
    fn sanitize_tool_descriptor(&self, tool: ToolDescriptor) -> ToolDescriptor {
        ToolDescriptor {
            name: tool.name,
            description: tool.description,
            // 参数schema完全暴露给Sub-Agent以确保它知道如何调用
            parameters: tool.parameters,
            require_confirmation: tool.require_confirmation,
        }
    }
}
```

#### 4. 权限上下文实现

```rust
// src-tauri/src/agent/subagent/permission.rs

pub struct PermissionContext {
    /// 继承自主Agent的权限
    inherited_permissions: HashSet<Permission>,
    /// Sub-Agent特有的权限覆盖
    overrides: HashMap<Permission, bool>,
    /// 最终权限级别
    effective_level: PermissionLevel,
}

impl PermissionContext {
    /// 创建权限上下文
    pub fn new(
        parent_permissions: HashSet<Permission>,
        level: PermissionLevel,
    ) -> Self {
        Self {
            inherited_permissions: parent_permissions,
            overrides: HashMap::new(),
            effective_level: level,
        }
    }

    /// 检查是否具有特定权限
    pub fn has_permission(&self, permission: Permission) -> bool {
        if let Some(&overridden) = self.overrides.get(&permission) {
            return overridden;
        }

        match self.effective_level {
            PermissionLevel::ReadOnly => {
                matches!(permission, Permission::Read)
            }
            PermissionLevel::Standard => {
                matches!(
                    permission,
                    Permission::Read
                        | Permission::Write
                        | Permission::ExecuteStandardTool
                )
            }
            PermissionLevel::Elevated => {
                matches!(
                    permission,
                    Permission::Read
                        | Permission::Write
                        | Permission::ExecuteStandardTool
                        | Permission::ExecuteElevatedTool
                )
            }
            PermissionLevel::Admin => true,
        }
    }

    /// 添加权限覆盖
    pub fn add_override(&mut self, permission: Permission, value: bool) {
        self.overrides.insert(permission, value);
    }
}
```

#### 5. 系统提示词构建器

```rust
// src-tauri/src/agent/subagent/prompt.rs

pub struct SubAgentSystemPromptBuilder {
    sub_agent_definition: SubAgentDefinition,
    context: SubAgentExecutionContext,
}

impl SubAgentSystemPromptBuilder {
    /// 构建完整的系统提示词
    pub fn build(&self) -> String {
        let mut prompt = String::new();

        // 1. 添加角色定义
        prompt.push_str(&self.build_role_section());
        prompt.push_str("\n\n");

        // 2. 添加能力边界说明
        prompt.push_str(&self.build_capability_section());
        prompt.push_str("\n\n");

        // 3. 添加当前上下文信息
        if let Some(context_info) = self.build_context_section() {
            prompt.push_str(&context_info);
            prompt.push_str("\n\n");
        }

        // 4. 添加自定义提示词
        if let Some(custom) = &self.context.custom_system_prompt {
            prompt.push_str(custom);
            prompt.push_str("\n\n");
        }

        // 5. 添加行为约束
        prompt.push_str(&self.build_constraint_section());

        prompt
    }

    /// 构建角色定义部分
    fn build_role_section(&self) -> String {
        format!(
            "你是一个专业的{}助手。\n你的名称是：{}\n角色描述：{}",
            self.sub_agent_definition.domain,
            self.sub_agent_definition.name,
            self.sub_agent_definition.description,
        )
    }

    /// 构建能力边界说明
    fn build_capability_section(&self) -> String {
        let mut section = String::from("## 可用能力\n");

        for tool_name in self.context.get_allowed_tools() {
            if let Some(tool_info) = self.sub_agent_definition.get_tool_info(tool_name) {
                section.push_str(&format!("- **{}**: {}\n", tool_name, tool_info));
            }
        }

        if self.context.get_allowed_tools().is_empty() {
            section.push_str("- 当前上下文中没有可用的工具\n");
        }

        section
    }

    /// 构建上下文信息部分
    fn build_context_section(&self) -> Option<String> {
        // 注入记忆相关信息
        let memory_info = format!(
            "## 记忆上下文\n你可以通过记忆检索访问以下类型的记忆：{:?}\n",
            self.context.memory_config.allowed_memory_types
        );

        Some(memory_info)
    }

    /// 构建行为约束部分
    fn build_constraint_section(&self) -> String {
        String::from(
            "## 行为约束\n\
            1. 只使用上述可用能力中的工具，不要尝试使用未列出的工具\n\
            2. 如遇到无法处理的任务，明确告知用户并返回错误\n\
            3. 保持角色设定，不要偏离专业助手的定位\n\
            4. 严格遵守记忆边界，不要访问未授权的记忆类型\n",
        )
    }
}
```

## 安全考虑

1. **工具使用审计**：每次工具调用记录完整日志，包括调用者、时间、参数
2. **记忆访问控制**：严格的记忆类型白名单，不在白名单中的记忆类型不得访问
3. **权限边界验证**：在工具执行前进行二次权限校验
4. **提示词注入防护**：对自定义提示词进行安全校验，防止提示词注入攻击
5. **上下文隔离验证**：确保不同Sub-Agent的上下文完全隔离

## 性能考虑

1. **上下文复用**：同一Sub-Agent的多次调用可复用已创建的上下文
2. **工具过滤缓存**：已过滤的工具列表可缓存，避免重复过滤
3. **异步记忆检索**：记忆检索操作异步执行，不阻塞上下文创建
4. **上下文超时清理**：自动清理超时的上下文，释放资源
