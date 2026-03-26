# Design: 完整审计日志系统

## 技术方案

### 实现类型
- **类型**: refactor（基于现有 AuditLogManager 扩展）
- **优先级**: medium
- **阶段**: Phase 5 - 治理与可靠性增强
- **后端必需**: true

### 前端实现

#### 技术选型
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **HTTP 客户端**: fetch API / Tauri IPC

#### 模块结构
```
src/
├── features/
│   └── agent/
│       ├── components/
│       │   ├── AuditLogViewer.tsx       # 审计日志查看器
│       │   └── AuditLogDetail.tsx       # 审计日志详情
│       ├── hooks/
│       │   └── useAuditLog.ts           # 审计日志 Hook
│       └── stores/
│           └── auditLogStore.ts         # 审计日志状态
```

#### 核心接口

```typescript
// 审计日志类型定义
interface AuditLog {
  id: string;
  eventType: AuditEventType;
  eventLevel: AuditEventLevel;
  source: AuditSource;
  sessionId?: string;
  traceId?: string;
  userId?: string;
  tenantId?: string;
  content: AuditContent;
  createdAt: number;
  archived: boolean;
}

type AuditEventType =
  | 'agent_action'
  | 'tool_call'
  | 'tool_result'
  | 'decision'
  | 'data_change'
  | 'system_event';

type AuditEventLevel =
  | 'DEBUG'
  | 'INFO'
  | 'WARN'
  | 'ERROR'
  | 'CRITICAL';

type AuditSource =
  | 'main_agent'
  | 'sub_agent'
  | 'tool_executor';

interface AuditContent {
  action: string;
  description?: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// 查询参数
interface AuditLogQuery {
  startTime?: number;
  endTime?: number;
  eventTypes?: AuditEventType[];
  eventLevels?: AuditEventLevel[];
  sources?: AuditSource[];
  sessionId?: string;
  userId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// Hook 接口
interface UseAuditLog {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  query: (params: AuditLogQuery) => Promise<void>;
  export: (format: 'json' | 'csv') => Promise<string>;
  getDetail: (id: string) => Promise<AuditLog>;
}
```

### 后端实现

#### 技术选型
- **语言**: Rust
- **异步框架**: Tokio
- **数据库**: SQLite (本地存储)
- **序列化**: Serde JSON

#### 模块结构
```
src-tauri/src/
├── agent/
│   ├── audit/
│   │   ├── mod.rs              # 模块入口
│   │   ├── log_manager.rs     # 日志管理器
│   │   ├── event_recorder.rs   # 事件记录器
│   │   ├── query_service.rs    # 查询服务
│   │   ├── archive_service.rs  # 归档服务
│   │   └── models.rs          # 数据模型
│   └── commands/
│       └── audit_commands.rs   # Tauri 命令
```

#### 核心数据结构

```rust
// 审计日志模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub event_type: String,
    pub event_level: String,
    pub source: String,
    pub session_id: Option<String>,
    pub trace_id: Option<String>,
    pub user_id: Option<String>,
    pub tenant_id: Option<String>,
    pub content: Value,  // JSON
    pub created_at: i64,
    pub archived: bool,
}

// 审计事件明细
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: String,
    pub log_id: String,
    pub step_id: Option<String>,
    pub action: String,
    pub input_data: Option<Value>,
    pub output_data: Option<Value>,
    pub error_message: Option<String>,
    pub duration_ms: Option<i64>,
    pub created_at: i64,
}

// 归档记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditArchive {
    pub id: String,
    pub archive_date: String,
    pub file_path: String,
    pub file_size: i64,
    pub log_count: i64,
    pub compressed: bool,
    pub created_at: i64,
}
```

#### 核心服务实现

```rust
// 日志管理器 - 核心入口
pub struct AuditLogManager {
    db: Database,
    event_tx: Channel<AuditLog>,
}

impl AuditLogManager {
    // 记录审计事件
    pub async fn record_event(&self, event: AuditLog) -> Result<(), AuditError> {
        // 异步写入
        self.event_tx.send(event).await?;
        Ok(())
    }

    // 查询审计日志
    pub async fn query(&self, params: QueryParams) -> Result<QueryResult, AuditError> {
        // 实现分页、过滤、排序
    }

    // 导出审计日志
    pub async fn export(&self, params: QueryParams, format: ExportFormat) -> Result<String, AuditError> {
        // 支持 JSON/CSV 格式
    }

    // 触发归档
    pub async fn trigger_archive(&self, before_date: &str) -> Result<AuditArchive, AuditError> {
        // 按日期归档旧日志
    }
}

// 事件记录器 - 集成到 Agent 执行流程
pub struct EventRecorder {
    manager: Arc<AuditLogManager>,
}

impl EventRecorder {
    // 记录工具调用
    pub async fn record_tool_call(&self, ctx: &ToolCallContext) -> Result<(), AuditError> {
        let event = AuditLog {
            id: generate_uuid(),
            event_type: "tool_call".to_string(),
            event_level: "INFO".to_string(),
            source: "tool_executor".to_string(),
            content: json!({
                "toolName": ctx.tool_name,
                "input": ctx.input,
                "output": ctx.output,
            }),
            created_at: current_timestamp(),
            ..Default::default()
        };
        self.manager.record_event(event).await
    }

    // 记录决策
    pub async fn record_decision(&self, ctx: &DecisionContext) -> Result<(), AuditError> {
        let event = AuditLog {
            id: generate_uuid(),
            event_type: "decision".to_string(),
            event_level: "INFO".to_string(),
            source: "main_agent".to_string(),
            content: json!({
                "decisionType": ctx.decision_type,
                "reasoning": ctx.reasoning,
                "outcome": ctx.outcome,
            }),
            created_at: current_timestamp(),
            ..Default::default()
        };
        self.manager.record_event(event).await
    }
}
```

### 数据库设计

#### 表结构
- `audit_logs` - 审计日志主表（见 proposal.md）
- `audit_events` - 审计事件明细表
- `audit_archives` - 归档记录表

#### 索引策略
- `idx_audit_logs_created_at` - 按时间范围查询
- `idx_audit_logs_event_type` - 按事件类型过滤
- `idx_audit_logs_session_id` - 按会话追溯
- `idx_audit_logs_user_id` - 按用户查询

### API 设计

#### Tauri 命令

```rust
// 记录审计事件
#[tauri::command]
pub async fn record_audit_event(
    event_type: String,
    event_level: String,
    source: String,
    content: Value,
) -> Result<String, String>;

// 查询审计日志
#[tauri::command]
pub async fn query_audit_logs(
    start_time: Option<i64>,
    end_time: Option<i64>,
    event_types: Option<Vec<String>>,
    event_levels: Option<Vec<String>>,
    session_id: Option<String>,
    user_id: Option<String>,
    keyword: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<QueryResponse, String>;

// 导出审计日志
#[tauri::command]
pub async fn export_audit_logs(
    start_time: Option<i64>,
    end_time: Option<i64>,
    event_types: Option<Vec<String>>,
    format: String,
) -> Result<String, String>;

// 触发归档
#[tauri::command]
pub async fn trigger_audit_archive(
    before_date: String,
) -> Result<ArchiveResponse, String>;

// 获取审计日志详情
#[tauri::command]
pub async fn get_audit_log_detail(
    id: String,
) -> Result<AuditLogDetail, String>;
```

## 组件设计

### 前端组件

#### AuditLogViewer
- **职责**: 审计日志列表展示和查询
- **Props**:
  - `initialQuery?: AuditLogQuery`
  - `onSelect?: (log: AuditLog) => void`
- **状态**: 查询参数、分页信息、选中项

#### AuditLogDetail
- **职责**: 审计日志详情展示
- **Props**:
  - `logId: string`
  - `expanded?: boolean`

### 后端模块

#### AuditLogManager
- **职责**: 审计日志核心管理器
- **方法**:
  - `record_event()` - 记录事件
  - `query()` - 查询日志
  - `export()` - 导出日志
  - `trigger_archive()` - 触发归档

#### EventRecorder
- **职责**: 事件记录器，集成到 Agent 执行流程
- **方法**:
  - `record_tool_call()` - 记录工具调用
  - `record_decision()` - 记录决策
  - `record_data_change()` - 记录数据变更

## 状态管理

### Zustand Store

```typescript
interface AuditLogState {
  logs: AuditLog[];
  total: number;
  currentQuery: AuditLogQuery;
  selectedLog: AuditLog | null;
  loading: boolean;

  // Actions
  setQuery: (query: AuditLogQuery) => void;
  fetchLogs: () => Promise<void>;
  selectLog: (log: AuditLog | null) => void;
  exportLogs: (format: 'json' | 'csv') => Promise<string>;
}
```

## 安全考虑

- 遵循 ADR-018 安全设计
- 审计日志内容需要脱敏处理（密码、密钥等）
- 实现字段级权限控制（管理员可查看全部，普通用户仅查看自己的）
- 审计日志不可被删除或修改
- 实现审计日志访问的二次验证

## 性能考虑

- 使用异步写入，避免阻塞主流程
- 实现批量写入，减少 IO 操作
- 添加合适索引，优化查询性能
- 支持分页查询，避免全表扫描
- 归档机制控制数据量增长
- 使用压缩存储归档日志

## 测试策略

### 单元测试
- AuditLogManager 核心方法测试
- EventRecorder 事件记录测试
- 查询过滤逻辑测试

### 集成测试
- 与 AgentOrchestrator 集成测试
- 与工具执行管道集成测试
- 数据库操作测试

### E2E 测试
- 完整审计流程测试
- 导出功能测试
- 归档功能测试
