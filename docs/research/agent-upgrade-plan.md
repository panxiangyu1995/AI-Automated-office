# Agent 机制升级任务计划

基于 Claude Code Agent 机制分析，为 AI-Automated-office 制定分阶段升级计划。

---

## 阶段一：工具过滤与 Hook 系统（短期）

### Task 1.1: 工具白名单/黑名单系统

**来源**: `src/tools/AgentTool/agentToolUtils.ts` 分析
**PRD 覆盖**: ARCH-01 (Agent 框架)

```rust
// src-tauri/src/agent/tools/registry.rs

#[derive(Debug, Clone, PartialEq)]
pub enum ToolPermission {
    All,
    Whitelist(Vec<String>),
    Blacklist(Vec<String>),
}

#[derive(Debug, Clone)]
pub struct AgentToolPolicy {
    pub permission: ToolPermission,
    pub requires_confirmation: bool,
}

impl ToolRegistry {
    pub fn filter_tools(&self, agent_type: &str, tools: Vec<Tool>) -> Vec<Tool> {
        let policy = self.policies.get(agent_type)
            .unwrap_or(&AgentToolPolicy {
                permission: ToolPermission::All,
                requires_confirmation: false,
            });
        
        match &policy.permission {
            ToolPermission::All => tools,
            ToolPermission::Whitelist(names) => {
                tools.into_iter()
                    .filter(|t| names.contains(&t.name))
                    .collect()
            }
            ToolPermission::Blacklist(names) => {
                tools.into_iter()
                    .filter(|t| !names.contains(&t.name))
                    .collect()
            }
        }
    }
}
```

**验收标准**:
- [ ] Agent 可以定义 `tools` 白名单
- [ ] Agent 可以定义 `disallowedTools` 黑名单
- [ ] 工具过滤不影响其他 Agent

### Task 1.2: Hook 系统实现

**来源**: `src/utils/hooks/postSamplingHooks.ts` 分析
**PRD 覆盖**: ARCH-01

```rust
// src-tauri/src/agent/hooks/mod.rs

pub trait AgentHook: Send + Sync {
    fn name(&self) -> &str;
    fn pre_tool_call(&self, ctx: &HookContext) -> Result<HookAction, HookError>;
    fn post_tool_call(&self, ctx: &HookContext, result: &ToolResult) -> Result<HookAction, HookError>;
    fn on_error(&self, ctx: &HookContext, error: &Error) -> Result<(), HookError>;
}

pub enum HookAction {
    Allow,
    Deny(String),
    Modify(Value),
}

pub struct HookContext {
    pub agent_id: Uuid,
    pub agent_type: String,
    pub tool_name: String,
    pub tool_input: Value,
    pub session_id: Uuid,
}
```

**验收标准**:
- [ ] 支持 `pre_tool_call` Hook
- [ ] 支持 `post_tool_call` Hook
- [ ] 支持 `on_error` Hook
- [ ] Hook 可修改工具输入/阻止执行

### Task 1.3: 进度追踪系统

**来源**: `src/tasks/LocalAgentTask/LocalAgentTask.tsx` 分析
**PRD 覆盖**: FR-201 (Agent 状态监控)

```rust
// src-tauri/src/agent/progress.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressUpdate {
    pub task_id: Uuid,
    pub agent_id: Uuid,
    pub status: TaskStatus,
    pub tool_use_count: u32,
    pub token_count: u64,
    pub last_activity: Option<ToolActivity>,
    pub recent_activities: Vec<ToolActivity>,
    pub started_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolActivity {
    pub tool_name: String,
    pub input_summary: String,
    pub activity_description: Option<String>,
    pub is_search: bool,
    pub is_read: bool,
}
```

**验收标准**:
- [ ] 实时进度更新 (每 1 秒)
- [ ] 后台任务支持
- [ ] 进度通知推送
- [ ] 历史活动记录

---

## 阶段二：三层记忆系统（中期）

### Task 2.1: 记忆存储层

**来源**: `src/memdir/memdir.ts` 分析
**PRD 覆盖**: FR-151 (记忆系统)

```rust
// src-tauri/src/agent/memory/layered.rs

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MemoryScope {
    User,     // ~/.ai-office/agent-memory/<agent_type>/
    Project,  // .ai-office/agent-memory/<agent_type>/
    Local,    // .ai-office/agent-memory-local/<agent_type>/
}

pub struct MemoryEntry {
    pub path: PathBuf,
    pub scope: MemoryScope,
    pub agent_type: String,
    pub last_modified: DateTime<Utc>,
}

pub struct LayeredMemoryStore {
    base_dirs: MemoryBaseDirs,
    max_entry_lines: usize,
    max_entry_bytes: usize,
}

impl LayeredMemoryStore {
    pub fn load(&self, agent_type: &str, scope: MemoryScope) -> Result<String> {
        let path = self.get_memory_path(agent_type, scope);
        if !path.exists() {
            return Ok(String::new());
        }
        
        let content = fs::read_to_string(&path)?;
        Ok(self.truncate_if_needed(content))
    }
    
    pub fn save(&self, agent_type: &str, scope: MemoryScope, content: &str) -> Result<()> {
        let path = self.get_memory_path(agent_type, scope);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&path, content)?;
        Ok(())
    }
    
    fn truncate_if_needed(&self, content: String) -> String {
        let lines: Vec<_> = content.lines().collect();
        let was_truncated = lines.len() > self.max_entry_lines 
            || content.len() > self.max_entry_bytes;
        
        if !was_truncated {
            return content;
        }
        
        // 优先按行截断
        let truncated: String = if lines.len() > self.max_entry_lines {
            lines[..self.max_entry_lines].join("\n")
        } else {
            content.clone()
        };
        
        // 次按字节截断
        if truncated.len() > self.max_entry_bytes {
            truncated[..self.max_entry_bytes].to_string()
        } else {
            truncated
        }
    }
}
```

**验收标准**:
- [ ] 支持 user/project/local 三种作用域
- [ ] 自动截断超限内容 (200行/25KB)
- [ ] 跨会话持久化

### Task 2.2: 记忆上下文注入

**来源**: `src/memdir/memdir.ts` - `buildMemoryPrompt()` 分析

```rust
// src-tauri/src/agent/memory/injector.rs

pub struct MemoryPromptInjector {
    store: Arc<LayeredMemoryStore>,
    auto_memory_enabled: bool,
}

impl MemoryPromptInjector {
    pub fn build_memory_context(&self, agent_type: &str) -> Result<String> {
        let mut context = String::new();
        
        // 优先级: local > project > user
        for scope in &[MemoryScope::Local, MemoryScope::Project, MemoryScope::User] {
            if let Ok(content) = self.store.load(agent_type, *scope) {
                if !content.trim().is_empty() {
                    context.push_str(&format!(
                        "\n\n## {} Memory\n{}\n",
                        scope_label(scope),
                        content
                    ));
                }
            }
        }
        
        // 自动记忆加载
        if self.auto_memory_enabled {
            if let Some(auto_mem) = self.load_auto_memory(agent_type)? {
                context.push_str(&format!(
                    "\n\n## Recent Context\n{}\n",
                    auto_mem
                ));
            }
        }
        
        Ok(context)
    }
    
    fn scope_label(scope: &MemoryScope) -> &'static str {
        match scope {
            MemoryScope::User => "Global",
            MemoryScope::Project => "Project",
            MemoryScope::Local => "Session",
        }
    }
}
```

**验收标准**:
- [ ] 记忆内容正确注入 system prompt
- [ ] 支持自动记忆学习
- [ ] 记忆可选择性加载

---

## 阶段三：多智能体协调（中期）

### Task 3.1: 协调器模式

**来源**: `src/coordinator/coordinatorMode.ts` 分析
**PRD 覆盖**: ARCH-02 (多智能体系统)

```rust
// src-tauri/src/agent/coordinator/mod.rs

pub struct CoordinatorAgent {
    id: Uuid,
    workers: HashMap<Uuid, WorkerHandle>,
    task_queue: Arc<Mutex<Vec<Task>>>,
    message_bus: Arc<MessageBus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerConfig {
    pub name: String,
    pub prompt: String,
    pub tools: Vec<String>,
    pub model: Option<String>,
    pub permission_mode: PermissionMode,
}

impl CoordinatorAgent {
    pub fn spawn_worker(&mut self, config: WorkerConfig) -> Result<Uuid> {
        let worker = WorkerAgent::new(config)?;
        let id = worker.id;
        self.workers.insert(id, WorkerHandle::new(worker));
        Ok(id)
    }
    
    pub fn send_message(&mut self, to: Uuid, message: String) -> Result<()> {
        self.message_bus.send(TeamMessage {
            from: self.id,
            to,
            content: message,
            msg_type: MessageType::TaskAssignment,
            timestamp: Utc::now(),
        })?;
        Ok(())
    }
    
    pub fn stop_worker(&mut self, id: Uuid) -> Result<()> {
        self.workers.remove(&id);
        Ok(())
    }
    
    pub fn get_worker_status(&self, id: Uuid) -> Option<WorkerStatus> {
        self.workers.get(&id).map(|w| w.status.clone())
    }
}
```

**验收标准**:
- [ ] 可启动多个 Worker
- [ ] Worker 间消息传递
- [ ] 任务结果汇总
- [ ] 协调器可处理复杂任务分解

### Task 3.2: Fork 子智能体

**来源**: `src/utils/forkedAgent.ts` 分析
**PRD 覆盖**: ARCH-02

```rust
// src-tauri/src/agent/fork/mod.rs

#[derive(Debug, Clone)]
pub struct CacheSafeParams {
    pub system_prompt_hash: String,
    pub tools_hash: String,
    pub model: String,
    pub messages_prefix: Vec<Message>,
    pub thinking_config: Option<ThinkingConfig>,
}

pub struct ForkedAgent {
    parent_id: Uuid,
    cache_params: CacheSafeParams,
    messages: Vec<Message>,
    results: Vec<Message>,
}

impl ForkedAgent {
    pub fn new(parent: &Agent, prompt: String) -> Result<Self> {
        // 构建与父级相同的 cache 参数以共享 prompt cache
        let cache_params = CacheSafeParams {
            system_prompt_hash: parent.get_system_prompt_hash(),
            tools_hash: parent.get_tools_hash(),
            model: parent.model().to_string(),
            messages_prefix: parent.messages().clone(),
            thinking_config: parent.thinking_config().cloned(),
        };
        
        Ok(Self {
            parent_id: parent.id,
            cache_params,
            messages: vec![Message::user(prompt)],
            results: Vec::new(),
        })
    }
    
    pub async fn run(&mut self, llm: &dyn LLMProvider) -> Result<String> {
        let response = llm.chat(&self.cache_params, &self.messages).await?;
        self.results.push(response.clone());
        Ok(self.extract_text(&response))
    }
}
```

**验收标准**:
- [ ] Fork 共享父级 prompt cache
- [ ] 低开销子任务执行
- [ ] 结果正确返回

### Task 3.3: 团队消息协议

**来源**: `src/tools/shared/spawnMultiAgent.ts` 分析

```rust
// src-tauri/src/agent/team/message_protocol.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMessage {
    pub id: Uuid,
    pub from: Uuid,
    pub to: Uuid,
    pub content: String,
    pub msg_type: MessageType,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum MessageType {
    TaskAssignment,
    ProgressUpdate,
    ResultReport,
    StopRequest,
    TextMessage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskNotification {
    pub task_id: Uuid,
    pub status: TaskStatus,
    pub summary: String,
    pub result: Option<String>,
    pub usage: Option<TokenUsage>,
}
```

**验收标准**:
- [ ] 消息队列 FIFO 顺序
- [ ] 消息持久化
- [ ] 错误恢复机制

---

## 阶段四：自定义 Agent 系统（长期）

### Task 4.1: Agent 定义格式

**来源**: `src/tools/AgentTool/loadAgentsDir.ts` 分析
**PRD 覆盖**: FR-101 (自定义 Agent)

```rust
// src-tauri/src/agent/definition/mod.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDefinition {
    pub name: String,
    pub description: String,
    pub agent_type: AgentType,
    pub tools: Option<Vec<String>>,
    pub disallowed_tools: Option<Vec<String>>,
    pub prompt: String,
    pub model: Option<String>,
    pub memory: Option<MemoryScope>,
    pub max_turns: Option<u32>,
    pub mcp_servers: Option<Vec<String>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AgentType {
    General,
    Explore,
    Plan,
    Verification,
    Custom(String),
}
```

### Task 4.2: Agent 加载器

```rust
// src-tauri/src/agent/definition/loader.rs

pub struct AgentLoader {
    builtin_dir: PathBuf,
    custom_dir: PathBuf,
    parser: AgentDefinitionParser,
}

impl AgentLoader {
    pub fn load_all(&self) -> Result<Vec<AgentDefinition>> {
        let mut agents = Vec::new();
        
        // 加载内置 Agent
        for entry in fs::read_dir(&self.builtin_dir)? {
            let entry = entry?;
            if entry.path().extension() == Some("json".as_ref()) {
                agents.push(self.parse_file(&entry.path())?);
            }
        }
        
        // 加载自定义 Agent
        if self.custom_dir.exists() {
            for entry in walkdir(&self.custom_dir)? {
                if entry.path().extension() == Some("json".as_ref()) {
                    agents.push(self.parse_file(&entry.path())?);
                }
            }
        }
        
        Ok(agents)
    }
}
```

---

## 依赖关系图

```
Task 1.1 (工具过滤)
    ↓
Task 1.2 (Hook 系统) ← Task 1.1
    ↓
Task 1.3 (进度追踪)
    ↓
Task 2.1 (记忆存储) ← Task 1.2
    ↓
Task 2.2 (记忆注入) ← Task 2.1
    ↓
Task 3.1 (协调器) ← Task 1.1, 1.3, 2.2
    ↓
Task 3.2 (Fork 机制) ← Task 3.1
    ↓
Task 3.3 (消息协议) ← Task 3.1
    ↓
Task 4.1 (Agent 定义) ← Task 3.1, 3.2
    ↓
Task 4.2 (Agent 加载器) ← Task 4.1
```

---

## 实施优先级

| 优先级 | 任务 | 工作量 | 价值 |
|--------|------|--------|------|
| P0 | Task 1.1 工具过滤 | 中 | 高 - 安全性 |
| P0 | Task 1.2 Hook 系统 | 中 | 高 - 可扩展性 |
| P1 | Task 1.3 进度追踪 | 低 | 高 - 用户体验 |
| P1 | Task 2.1/2.2 记忆系统 | 高 | 中 - 智能化 |
| P2 | Task 3.1 协调器 | 高 | 高 - 复杂任务 |
| P2 | Task 3.2 Fork 机制 | 中 | 高 - 效率 |
| P2 | Task 3.3 消息协议 | 中 | 中 - 协作 |
| P3 | Task 4.1/4.2 自定义 Agent | 高 | 中 - 生态 |

---

*创建时间：2026-04-24*
