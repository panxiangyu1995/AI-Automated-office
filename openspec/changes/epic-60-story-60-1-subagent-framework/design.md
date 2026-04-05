# Design: Subagent 核心框架

## 1. 类型系统设计

### 1.1 Agent 类型枚举

```rust
// Agent 类型
pub enum AgentType {
    /// Primary Agent - 主 Agent，负责用户交互和任务编排
    Primary,
    /// Department Subagent - 部门级 Subagent，随插件加载
    Department,
    /// Personal Subagent - 用户级 Subagent，本地存储
    Personal,
    /// Hidden Agent - 系统级 Agent（标题、摘要、压缩）
    Hidden,
}

/// Agent Mode 枚举（来自 kilocode 启发）
pub enum AgentMode {
    /// code - 默认主 Agent
    Code,
    /// ask - 纯问答（无写操作）
    Ask,
    /// orchestrator - 复杂任务编排
    Orchestrator,
    /// general - 并行多步骤任务
    General,
    /// department - 部门 Subagent
    Department,
    /// hidden - 系统任务
    Hidden,
}
```

### 1.2 Agent 配置结构

```rust
/// Agent 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// Agent 名称（唯一标识）
    pub name: String,
    /// Agent 类型
    pub agent_type: AgentType,
    /// Agent Mode
    pub mode: AgentMode,
    /// 显示名称
    pub display_name: String,
    /// 描述
    pub description: String,
    /// 模型配置
    pub models: ModelConfig,
    /// 工具权限
    pub tools: ToolPermissions,
    /// 触发条件
    pub trigger: TriggerConfig,
    /// 限制参数
    pub limits: LimitsConfig,
    /// 插件 ID（Department Subagent 专用）
    pub plugin_id: Option<String>,
    /// 创建者 ID（Personal Subagent 专用）
    pub creator_id: Option<String>,
}

/// 模型配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    /// 主模型配置
    pub primary: ModelProvider,
    /// 轻量模型配置（用于 OCR、简单查询）
    pub light: Option<ModelProvider>,
    /// 小模型配置（用于标题、摘要）
    pub small: Option<ModelProvider>,
}

/// 模型提供者
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelProvider {
    /// 提供商
    pub provider: String,
    /// 模型 ID
    pub model_id: String,
    /// 温度
    pub temperature: f32,
    /// 最大 token 数
    pub max_tokens: u32,
}

/// 工具权限配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolPermissions {
    /// 允许的工具列表
    pub allowed: Vec<String>,
    /// 禁止的工具列表
    pub denied: Vec<String>,
    /// 工具约束
    pub constraints: HashMap<String, ToolConstraint>,
}

/// 工具约束
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolConstraint {
    /// 最大调用次数/天
    pub max_per_day: Option<u32>,
    /// 最大金额限制
    pub max_amount: Option<f64>,
    /// 允许的字段列表
    pub allowed_fields: Option<Vec<String>>,
    /// 数据范围
    pub data_scope: Option<DataScope>,
}

/// 数据范围
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataScope {
    /// 仅本人数据
    Personal,
    /// 本部门数据
    Department,
    /// 全部数据
    All,
    /// 高管数据范围
    Executive,
}

/// 触发配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerConfig {
    /// 触发模式
    pub mode: TriggerMode,
    /// 触发关键词
    pub keywords: Vec<String>,
    /// 触发条件
    pub conditions: Vec<TriggerCondition>,
    /// 优先级（1-10）
    pub priority: u8,
}

/// 触发模式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TriggerMode {
    /// 手动触发
    Manual,
    /// 自动路由
    Auto,
    /// 混合模式
    Hybrid,
}

/// 触发条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerCondition {
    /// 意图类型
    pub intent: String,
    /// 实体类型
    pub entities: Vec<String>,
}

/// 限制配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LimitsConfig {
    /// 最大步数
    pub max_steps: u32,
    /// 最大并发数
    pub max_concurrent: u32,
    /// 超时时间（秒）
    pub timeout_seconds: u32,
}
```

### 1.3 委派协议

```rust
/// 委派协议（Delegation Contract）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationContract {
    /// 委派目标
    pub target: DelegationTarget,
    /// 权限约束
    pub constraints: DelegationConstraints,
    /// 上下文传递
    pub context: DelegationContext,
    /// 输出契约
    pub output: OutputContract,
}

/// 委派目标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationTarget {
    /// Subagent 名称
    pub subagent: String,
    /// 可选的意图限定
    pub intent: Option<String>,
}

/// 委派约束
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationConstraints {
    /// 允许的工具白名单
    pub allowed_tools: Vec<String>,
    /// 禁止的工具黑名单
    pub denied_tools: Vec<String>,
    /// 数据范围
    pub data_scope: DataScope,
    /// 最大步数限制
    pub max_steps: u32,
    /// 超时时间（毫秒）
    pub timeout: u64,
}

/// 委派上下文
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationContext {
    /// 原始用户消息
    pub user_message: String,
    /// 提取的实体
    pub extracted_entities: HashMap<String, serde_json::Value>,
    /// 前置 Subagent 的结果
    pub previous_results: Option<Vec<SubagentResult>>,
}

/// 输出契约
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputContract {
    /// 输出格式
    pub format: OutputFormat,
    /// 期望的结构化输出 schema
    pub schema: Option<serde_json::Value>,
}

/// 输出格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OutputFormat {
    Text,
    Structured,
    Json,
}

/// Subagent 执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentResult {
    /// Subagent 名称
    pub subagent: String,
    /// 执行状态
    pub status: ResultStatus,
    /// 输出内容
    pub output: String,
    /// 错误信息
    pub error: Option<String>,
    /// 执行耗时（毫秒）
    pub elapsed_ms: u64,
}

/// 结果状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResultStatus {
    Success,
    PartialFailure,
    Failure,
}
```

## 2. 加载器设计

### 2.1 Subagent 加载器 trait

```rust
/// Subagent 加载器 trait
pub trait SubagentLoader: Send + Sync {
    /// 加载所有 Subagent
    fn load_all(&self) -> Result<Vec<AgentConfig>, SubagentError>;

    /// 根据名称加载单个 Subagent
    fn load(&self, name: &str) -> Result<Option<AgentConfig>, SubagentError>;

    /// 卸载 Subagent
    fn unload(&self, name: &str) -> Result<(), SubagentError>;

    /// 获取 Subagent 类型
    fn get_type(&self) -> AgentType;
}

/// Subagent 错误
#[derive(Debug, thiserror::Error)]
pub enum SubagentError {
    #[error("Subagent not found: {0}")]
    NotFound(String),

    #[error("Load failed: {0}")]
    LoadFailed(String),

    #[error("Config invalid: {0}")]
    ConfigInvalid(String),
}
```

### 2.2 Department Subagent 加载器

```rust
/// Department Subagent 加载器
/// 从插件 manifest 中加载 Subagent 配置
pub struct DepartmentLoader {
    plugin_manager: Arc<PluginManager>,
}

impl DepartmentLoader {
    pub fn new(plugin_manager: Arc<PluginManager>) -> Self {
        Self { plugin_manager }
    }
}

impl SubagentLoader for DepartmentLoader {
    fn load_all(&self) -> Result<Vec<AgentConfig>, SubagentError> {
        let mut configs = Vec::new();

        // 遍历已安装的插件
        for plugin in self.plugin_manager.list_installed() {
            // 从 manifest 中读取 subagent 配置
            if let Some(subagent_config) = plugin.manifest.subagent.as_ref() {
                configs.push(AgentConfig {
                    name: subagent_config.name.clone(),
                    agent_type: AgentType::Department,
                    mode: AgentMode::Department,
                    display_name: subagent_config.display_name.clone(),
                    description: subagent_config.description.clone(),
                    models: subagent_config.models.clone(),
                    tools: subagent_config.role_permissions.clone(),
                    trigger: subagent_config.trigger.clone(),
                    limits: subagent_config.limits.clone(),
                    plugin_id: Some(plugin.id.clone()),
                    creator_id: None,
                });
            }
        }

        Ok(configs)
    }

    fn load(&self, name: &str) -> Result<Option<AgentConfig>, SubagentError> {
        // 通过插件 ID 查找
        if let Some(plugin) = self.plugin_manager.get_by_subagent_name(name) {
            if let Some(subagent_config) = &plugin.manifest.subagent {
                return Ok(Some(AgentConfig {
                    name: subagent_config.name.clone(),
                    agent_type: AgentType::Department,
                    mode: AgentMode::Department,
                    display_name: subagent_config.display_name.clone(),
                    description: subagent_config.description.clone(),
                    models: subagent_config.models.clone(),
                    tools: subagent_config.role_permissions.clone(),
                    trigger: subagent_config.trigger.clone(),
                    limits: subagent_config.limits.clone(),
                    plugin_id: Some(plugin.id.clone()),
                    creator_id: None,
                }));
            }
        }
        Ok(None)
    }

    fn unload(&self, name: &str) -> Result<(), SubagentError> {
        // Department Subagent 不支持卸载，由插件生命周期管理
        Err(SubagentError::NotFound(format!(
            "Department Subagent {} cannot be unloaded directly",
            name
        )))
    }

    fn get_type(&self) -> AgentType {
        AgentType::Department
    }
}
```

### 2.3 Personal Subagent 加载器

```rust
/// Personal Subagent 加载器
/// 从本地 SQLite 加载用户创建的 Subagent
pub struct PersonalLoader {
    db: Arc<Database>,
}

impl PersonalLoader {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

impl SubagentLoader for PersonalLoader {
    fn load_all(&self, user_id: &str) -> Result<Vec<AgentConfig>, SubagentError> {
        let configs = self.db.query_as::<AgentConfig>(
            "SELECT * FROM user_agents WHERE creator_id = ? AND enabled = true",
            params![user_id],
        )?;
        Ok(configs)
    }

    fn load(&self, name: &str, user_id: &str) -> Result<Option<AgentConfig>, SubagentError> {
        let configs = self.db.query_as::<AgentConfig>(
            "SELECT * FROM user_agents WHERE name = ? AND creator_id = ?",
            params![name, user_id],
        )?;
        Ok(configs.into_iter().next())
    }

    fn unload(&self, name: &str, user_id: &str) -> Result<(), SubagentError> {
        self.db.execute(
            "UPDATE user_agents SET enabled = false WHERE name = ? AND creator_id = ?",
            params![name, user_id],
        )?;
        Ok(())
    }

    fn get_type(&self) -> AgentType {
        AgentType::Personal
    }
}
```

## 3. 存储设计

### 3.1 Personal Subagent 数据库表

```sql
-- 用户创建的 Subagent 表
CREATE TABLE user_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_id TEXT NOT NULL,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,
    prompt TEXT NOT NULL,
    trigger_keywords TEXT,  -- JSON 数组
    trigger_conditions TEXT,  -- JSON 数组
    trigger_mode TEXT DEFAULT 'manual',
    priority INTEGER DEFAULT 5,
    allowed_tools TEXT,  -- JSON 数组
    denied_tools TEXT,  -- JSON 数组
    knowledge_sources TEXT,  -- JSON 数组
    max_steps INTEGER DEFAULT 20,
    max_concurrent INTEGER DEFAULT 1,
    timeout_seconds INTEGER DEFAULT 300,
    enabled INTEGER DEFAULT 1,
    version INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_user_agents_creator ON user_agents(creator_id);
CREATE INDEX idx_user_agents_name ON user_agents(name);
```

### 3.2 插件 manifest 中 subagent 配置

```json
{
  "subagent": {
    "name": "finance",
    "displayName": "财务助手",
    "description": "处理发票识别、报销审核、对账分析等财务任务",
    "models": {
      "primary": {
        "provider": "anthropic",
        "modelId": "claude-sonnet-4-5",
        "temperature": 0.7,
        "maxTokens": 8192
      },
      "light": {
        "provider": "anthropic",
        "modelId": "claude-haiku-4-5",
        "temperature": 0.3,
        "maxTokens": 4096
      },
      "small": {
        "provider": "anthropic",
        "modelId": "claude-haiku-4-5",
        "temperature": 0.5,
        "maxTokens": 1024
      }
    },
    "rolePermissions": {
      "staff": {
        "tools": ["finance_query", "finance_ocr"],
        "dataScope": "personal",
        "maxDailyOCR": 10
      },
      "specialist": {
        "tools": ["finance_query", "finance_ocr", "finance_mutate", "finance_aggregate", "finance_export"],
        "dataScope": "department",
        "maxDailyOCR": 100
      }
    },
    "trigger": {
      "mode": "auto",
      "keywords": ["报销", "发票", "财务", "对账"],
      "conditions": [
        { "intent": "finance.ocr", "entities": ["invoice"] },
        { "intent": "finance.query", "entities": ["expense"] }
      ],
      "priority": 8
    },
    "limits": {
      "maxSteps": 50,
      "maxConcurrent": 2,
      "timeoutSeconds": 300
    }
  }
}
```

## 4. 与现有架构的对齐

### 4.1 与 Agent Runtime 的集成

```rust
/// Subagent Manager - 统一管理所有 Subagent
pub struct SubagentManager {
    department_loader: Arc<DepartmentLoader>,
    personal_loader: Arc<PersonalLoader>,
    hidden_agents: HashMap<String, AgentConfig>,
}

impl SubagentManager {
    /// 获取所有可用的 Subagent（根据用户权限过滤）
    pub fn list_available(&self, user_id: &str, user_role: &Role) -> Vec<AgentConfig> {
        let mut configs = Vec::new();

        // 1. 添加 Department Subagents
        for config in self.department_loader.load_all() {
            if self.is_role_allowed(&config, user_role) {
                configs.push(config);
            }
        }

        // 2. 添加 Personal Subagents
        for config in self.personal_loader.load_all(user_id) {
            configs.push(config);
        }

        // 3. 添加 Hidden Agents
        configs.extend(self.hidden_agents.values().cloned());

        configs
    }

    /// 检查角色是否有权使用该 Subagent
    fn is_role_allowed(&self, config: &AgentConfig, user_role: &Role) -> bool {
        // TODO: 实现权限检查逻辑
        true
    }
}
```

### 4.2 与 Capability Supply Layer 的对齐

根据 ADR-046 Capability Supply Layer 扩展：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Capability Registry                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │ Core Tools │   Skills    │    MCP      │ Department       │  │
│  │  (内置)     │  (内置)     │  Services   │ Plugins/Agents  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│                                                                       │
│  新增：Department Subagents 作为新的 Capability 来源              │
└─────────────────────────────────────────────────────────────────────┘
```

## 5. 前端类型定义

```typescript
// src/features/agent/types/subagent.ts

export enum AgentType {
  Primary = 'primary',
  Department = 'department',
  Personal = 'personal',
  Hidden = 'hidden',
}

export enum AgentMode {
  Code = 'code',
  Ask = 'ask',
  Orchestrator = 'orchestrator',
  General = 'general',
  Department = 'department',
  Hidden = 'hidden',
}

export enum TriggerMode {
  Manual = 'manual',
  Auto = 'auto',
  Hybrid = 'hybrid',
}

export enum DataScope {
  Personal = 'personal',
  Department = 'department',
  All = 'all',
  Executive = 'executive',
}

export interface ModelProvider {
  provider: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
}

export interface ToolConstraint {
  maxPerDay?: number;
  maxAmount?: number;
  allowedFields?: string[];
  dataScope?: DataScope;
}

export interface TriggerCondition {
  intent: string;
  entities: string[];
}

export interface AgentConfig {
  name: string;
  agentType: AgentType;
  mode: AgentMode;
  displayName: string;
  description: string;
  models: {
    primary: ModelProvider;
    light?: ModelProvider;
    small?: ModelProvider;
  };
  tools: {
    allowed: string[];
    denied: string[];
    constraints: Record<string, ToolConstraint>;
  };
  trigger: {
    mode: TriggerMode;
    keywords: string[];
    conditions: TriggerCondition[];
    priority: number;
  };
  limits: {
    maxSteps: number;
    maxConcurrent: number;
    timeoutSeconds: number;
  };
  pluginId?: string;
  creatorId?: string;
}

export interface DelegationContract {
  target: {
    subagent: string;
    intent?: string;
  };
  constraints: {
    allowedTools: string[];
    deniedTools: string[];
    dataScope: DataScope;
    maxSteps: number;
    timeout: number;
  };
  context: {
    userMessage: string;
    extractedEntities: Record<string, unknown>;
    previousResults?: SubagentResult[];
  };
  output: {
    format: 'text' | 'structured' | 'json';
    schema?: unknown;
  };
}

export interface SubagentResult {
  subagent: string;
  status: 'success' | 'partialFailure' | 'failure';
  output: string;
  error?: string;
  elapsedMs: number;
}
```

## 6. 实现步骤

1. **创建目录结构**
   ```
   src-tauri/src/agent/subagent/
   ├── mod.rs
   ├── types.rs
   ├── loader.rs
   ├── department_loader.rs
   ├── personal_loader.rs
   ├── manager.rs
   ```

2. **实现类型定义** (`types.rs`)
   - AgentConfig, ModelConfig, ToolPermissions 等结构体
   - DelegationContract 委派协议
   - 序列化/反序列化实现

3. **实现 Department 加载器** (`department_loader.rs`)
   - 从插件 manifest 读取 Subagent 配置
   - 实现 SubagentLoader trait

4. **实现 Personal 加载器** (`personal_loader.rs`)
   - 从 SQLite 读取用户 Subagent
   - 实现 CRUD 操作

5. **实现 Manager** (`manager.rs`)
   - 统一管理所有 Subagent
   - 权限过滤
   - 路由辅助

6. **前端类型定义**
   - `src/features/agent/types/subagent.ts`

7. **集成测试**
   - Department Subagent 加载测试
   - Personal Subagent CRUD 测试
