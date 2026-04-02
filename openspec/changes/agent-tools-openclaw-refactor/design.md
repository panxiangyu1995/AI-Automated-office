# Design: Agent Tools System Refactoring Based on OpenClaw

## Context

**背景**: 当前 AI-Automated-office 的 Agent Tools 系统需要基于 OpenClaw 的成熟设计进行全面重构和增强，以补齐功能差距。

**现有架构**:
- `ToolExecutionPipeline`: 工具执行管道
- `ToolRegistry`: 工具注册表
- `ToolExecutor` trait: 工具执行器接口
- `ToolDescriptor`: 工具描述元数据
- `ToolPermission`: 权限检查
- `ToolSensitivity`: 敏感度评估

**参考实现**: OpenClaw 项目 (`src/agents/tool-catalog.ts`, `src/browser/pw-tools-core.*`, `src/agents/tools/memory-tool.ts`, `src/agents/tools/sessions-*.ts`)

## Goals / Non-Goals

**Goals:**
1. 引入 Profile 驱动的工具筛选机制
2. 重构 Browser Tool 为完整 Playwright 集成（8个子模块）
3. 新增 Memory Tools（语义搜索）
4. 新增 Sessions Tools（完整会话管理）
5. 新增 Media Tools（图片理解/语音合成）
6. 新增 Automation Tools（定时任务）
7. 保持与现有权限和安全系统集成

**Non-Goals:**
1. 不修改现有 ToolExecutionPipeline 核心架构
2. 不实现部门工具（Layer 3，由单独 change 处理）
3. 不实现 MCP 外部工具接入

---

## Decisions

### Decision 1: Profile 驱动的工具筛选机制

#### 问题

当前工具系统没有 Profile 概念，所有工具一视同仁，无法根据场景动态切换工具集。

#### 解决方案

参考 OpenClaw `tool-catalog.ts` 的 Profile 设计：

```rust
// profile.rs

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolProfile {
    Minimal,   // 仅基础工具
    Coding,   // 编码工具集
    Messaging, // 消息工具集
    Full,     // 全功能
}

// Profile → 工具 ID 映射
pub fn get_tools_for_profile(profile: ToolProfile) -> Vec<&'static str> {
    match profile {
        ToolProfile::Minimal => vec![
            "session_status",
            "system_get_app_version",
            "system_get_platform",
            "network_check_status",
        ],
        ToolProfile::Coding => vec![
            // Filesystem
            "file_read", "file_write", "file_edit", "dir_list",
            // Shell
            "sandbox_execute", "pattern_search",
            // Web
            "web_search", "web_fetch", "http_request",
            // Browser
            "browser_interact",
            // Document
            "document_parse", "document_convert",
            // Memory
            "memory_search", "memory_get",
            // Sessions
            "sessions_list", "sessions_history", "sessions_send",
            "sessions_spawn", "sessions_yield", "session_status",
            // Media
            "image_understand", "tts_speak",
            // Automation
            "cron_schedule", "cron_list", "cron_cancel",
        ],
        ToolProfile::Messaging => vec![
            "sessions_list", "sessions_history", "sessions_send",
            "session_status", "message_send",
        ],
        ToolProfile::Full => vec![],  // 无限制
    }
}
```

#### Profile 过滤集成

在 `pipeline.rs` 中集成 Profile 过滤：

```rust
impl ToolExecutionPipeline {
    pub async fn execute(
        &self,
        request: ToolExecutionRequest,
        emitter: Option<&mut RuntimeEventEmitter>,
    ) -> Result<ToolExecutionResponse, String> {
        // ... 前置检查 ...

        // Profile 过滤
        if let Some(profile) = request.profile {
            let allowed_tools = get_tools_for_profile(profile);
            if !allowed_tools.contains(&request.tool_id.as_str()) {
                return Err(format!(
                    "Tool '{}' not allowed in profile {:?}",
                    request.tool_id, profile
                ));
            }
        }

        // ... 继续执行 ...
    }
}
```

#### 配置集成

```rust
// tools.rs 配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolsConfig {
    pub default_profile: ToolProfile,
    pub profiles: HashMap<ToolProfile, ToolProfileConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolProfileConfig {
    pub allow: Vec<String>,      // 允许的工具
    pub deny: Vec<String>,       // 拒绝的工具
    pub also_allow: Vec<String>, // 额外允许
}
```

---

### Decision 2: Browser Tool 完整 Playwright 集成

#### 问题

当前 `browser_interact` 仅为框架占位，缺乏完整的 Playwright 功能。

#### 解决方案

参考 OpenClaw `pw-tools-core.*` 的 8 个子模块设计：

```
browser_interact
├── action: status/start/stop/profiles/tabs/open/close/focus
├── navigate: goto/back/forward/refresh
├── snapshot: aria/ai/role
├── screenshot: full/element/selector
├── interact: click/type/hover/drag/select/fill/press/submit/batch
├── upload: armFileChooser/disarmFileChooser
├── dialog: armDialog/accept/dismiss
├── download: armDownload/waitForDownload
├── console: getConsoleMessages
├── network: getNetworkRequests/getResponseBody
├── state: offline/headers/credentials/geolocation/emulateMedia
├── storage: cookies/getCookies/setCookies/localStorage/sessionStorage
└── trace: start/stop
```

#### 模块结构

```rust
// browser.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BrowserAction {
    // 浏览器控制
    Status,
    Start,
    Stop,
    
    // 标签页管理
    Profiles,
    Tabs,
    Open,
    Close,
    Focus,
    
    // 导航
    Navigate { url: String },
    Back,
    Forward,
    Refresh,
    
    // 快照与截图
    Snapshot { format: SnapshotFormat },
    Screenshot { full_page: bool, element: Option<String> },
    
    // 交互操作
    Interact { action: InteractionAction, params: InteractionParams },
    
    // 文件与对话框
    ArmFileChooser,
    DisarmFileChooser,
    ArmDialog { accept: bool },
    AcceptDialog,
    DismissDialog,
    
    // 下载
    ArmDownload,
    WaitForDownload,
    
    // 状态
    GetConsoleMessages,
    GetNetworkRequests,
    SetOffline { offline: bool },
    SetExtraHeaders { headers: HashMap<String, String> },
    SetGeolocation { latitude: f64, longitude: f64 },
    
    // 存储
    GetCookies,
    SetCookies { cookies: Vec<Cookie> },
    GetLocalStorage,
    GetSessionStorage,
    
    // 追踪
    TraceStart { output_path: String },
    TraceStop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SnapshotFormat {
    Aria,
    Ai,
    Role,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InteractionAction {
    Click,
    DblClick,
    RightClick,
    Hover,
    Type,
    Press,
    Select,
    Fill,
    Drag,
    Submit,
    Batch { actions: Vec<InteractionAction> },
}
```

#### CDP 客户端封装

```rust
// browser/cdp_client.rs

pub struct CdpClient {
    endpoint: String,
    browser_id: Option<String>,
}

impl CdpClient {
    pub async fn new(endpoint: &str) -> Result<Self> {
        Ok(Self {
            endpoint: endpoint.to_string(),
            browser_id: None,
        })
    }
    
    pub async fn start_browser(&mut self, profile: &str) -> Result<String> {
        // 调用 Playwright CDP Server 启动浏览器
        // 返回 browser_context_id
    }
    
    pub async fn send_command(&self, cmd: CdpCommand) -> Result<CdpResponse> {
        // 通过 HTTP 发送 CDP 命令
    }
}
```

---

### Decision 3: Memory Tools 语义搜索

#### 问题

缺乏语义记忆搜索能力，Agent 无法高效检索历史经验。

#### 解决方案

参考 OpenClaw `memory-tool.ts`：

```rust
// memory/memory_search.rs

pub struct MemorySearchTool {
    vector_store: Arc<dyn VectorStore>,
    config: MemoryConfig,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySearchParams {
    pub query: String,           // 自然语言查询
    pub max_results: Option<usize>,  // 最大返回数
    pub min_score: Option<f32>,     // 最小相似度
    pub sources: Option<Vec<MemorySource>>,  // 来源过滤
    pub date_range: Option<DateRange>,      // 时间范围
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MemorySource {
    Memory,     // 个人记忆
    Sessions,   // 会话历史
    Knowledge,  // 知识库
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySearchResult {
    pub id: String,
    pub content: String,
    pub source: MemorySource,
    pub score: f32,
    pub metadata: Value,
    pub created_at: i64,
}

// 实现
#[async_trait::async_trait]
impl ToolExecutor for MemorySearchTool {
    async fn execute(
        &self,
        params: Value,
        context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let params: MemorySearchParams = serde_json::from_value(params)
            .map_err(|e| ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: e.to_string(),
                ...
            })?;

        // 1. 嵌入查询文本
        let query_embedding = self.embeddings.embed(&params.query).await?;
        
        // 2. 向量搜索
        let results = self.vector_store.search(
            &query_embedding,
            params.max_results.unwrap_or(5),
            params.min_score,
        ).await?;
        
        // 3. 构建结果
        let search_results: Vec<MemorySearchResult> = results
            .into_iter()
            .map(|r| MemorySearchResult {
                id: r.id,
                content: r.content,
                source: MemorySource::Memory,
                score: r.score,
                metadata: r.metadata,
                created_at: r.created_at,
            })
            .collect();

        Ok(serde_json::json!({
            "query": params.query,
            "results": search_results,
            "total": search_results.len(),
        }))
    }
}
```

---

### Decision 4: Sessions Tools 完整会话管理

#### 问题

缺乏完整的会话生命周期管理，Agent 无法高效管理子任务和会话。

#### 解决方案

参考 OpenClaw `sessions-*.ts`：

```rust
// sessions/sessions_list.rs

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsListParams {
    pub visibility: SessionsVisibility,  // self/tree/agent/all
    pub limit: Option<usize>,
    pub include_subagents: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SessionsVisibility {
    Self_,   // 仅当前会话
    Tree,    // 当前 + 子会话（默认）
    Agent,   // 当前 Agent 的所有会话
    All,     // 所有会话
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub id: String,
    pub title: String,
    pub status: SessionStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub parent_id: Option<String>,
    pub agent_id: Option<String>,
}

// sessions/sessions_spawn.rs

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsSpawnParams {
    pub task: String,                    // 子任务描述
    pub model: Option<String>,            // 指定模型
    pub tools: Option<Vec<String>>,      // 允许的工具
    pub ttl_seconds: Option<i64>,         // TTL
    pub parent_session_id: Option<String>, // 父会话
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpawnResult {
    pub session_id: String,
    pub task_id: String,
    pub status: String,
}

// sessions/sessions_yield.rs

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsYieldParams {
    pub session_id: String,   // 目标会话
    pub message: String,      // 传递的消息
    pub wait_for_result: bool, // 等待结果
    pub timeout_seconds: Option<i64>,
}
```

---

### Decision 5: Media Tools 图片理解和语音合成

```rust
// media/image_understand.rs

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageUnderstandParams {
    pub image_url: Option<String>,    // 图片 URL
    pub image_data: Option<String>,   // Base64 图片数据
    pub prompt: String,               // 分析提示
    pub detail: Option<String>,       // low/high
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageUnderstandResult {
    pub description: String,
    pub tags: Vec<String>,
    pub raw_response: Value,
}

// media/tts_speak.rs

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TtsSpeakParams {
    pub text: String,
    pub voice: Option<String>,
    pub speed: Option<f32>,
    pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TtsSpeakResult {
    pub audio_url: Option<String>,
    pub audio_data: Option<String>,  // Base64
    pub duration_seconds: f32,
}
```

---

### Decision 6: Automation Tools 定时任务

```rust
// automation/cron_schedule.rs

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronScheduleParams {
    pub cron_expression: String,     // Cron 表达式
    pub task: String,                 // 任务描述
    pub agent_config: Option<Value>,  // Agent 配置
    pub enabled: Option<bool>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronScheduleResult {
    pub task_id: String,
    pub next_run_at: i64,
    pub status: String,
}

// automation/cron_list.rs

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CronListParams {
    pub status: Option<String>,  // pending/running/completed/failed
    pub limit: Option<usize>,
}
```

---

## Risks / Trade-offs

| 风险 | 描述 | 缓解措施 |
|------|------|---------|
| Playwright 依赖 | 需要独立安装 Playwright 和 Chrome | 提供环境检测和安装指引 |
| 向量存储 | sqlite-vec 性能和扩展性 | MVP 使用 sqlite-vec，后续可选 Qdrant |
| 会话管理复杂度 | 子 Agent 生命周期管理复杂 | 复用现有 Sub-Agent 系统 |
| 定时任务持久化 | 进程重启后任务丢失 | 持久化到 SQLite |

## Open Questions

1. **Browser Server 进程管理**: Playwright CDP server 是内嵌启动还是独立进程？
2. **Memory Source 隔离**: 多租户场景下如何隔离不同租户的向量数据？
3. **TTS Provider**: 使用哪个 TTS 提供商？本地还是云端？
4. **Session Visibility 权限**: 如何控制用户可见的会话范围？
5. **Cron 任务执行位置**: 在客户端执行还是云端执行？
