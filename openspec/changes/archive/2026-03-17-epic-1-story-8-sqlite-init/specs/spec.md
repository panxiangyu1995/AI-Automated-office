# Spec: SQLite本地存储初始化

## 需求来源

| 来源 | 编号 | 描述 |
|------|------|------|
| PRD | FR5 | 离线模式 - 本地数据存储 |
| PRD | FR38 | 数据同步 - 本地存储层 |
| PRD | FR39 | 同步状态 - 状态追踪 |
| PRD | FR42 | 冲突解决 - 版本控制 |
| 架构 | ADR-003 | 本地优先存储策略 |
| 架构 | ADR-024 | 数据库设计规范 |
| 架构 | ADR-030 | 检查点系统设计 |
| NFR | NFR5 | 内存占用优化 |

## 验收场景

### 场景 1: 数据库初始化

**Given** Tauri 应用首次启动
**When** 初始化本地存储
**Then** 在用户数据目录创建 SQLite 数据库文件
**And** 创建 `schema_version` 表
**And** 执行初始迁移脚本

### 场景 2: 表结构创建

**Given** 数据库文件已创建
**When** 执行迁移
**Then** 创建以下表：
- `sessions` - 会话缓存
- `messages` - 消息记录
- `sync_queue` - 同步队列
- `memory_facts` - 记忆存储
- `checkpoints` - 检查点
- `context_summaries` - 上下文摘要

### 场景 3: 迁移版本管理

**Given** 数据库已存在旧版本
**When** 应用启动
**Then** 检测当前版本
**And** 执行增量迁移
**And** 更新版本号

### 场景 4: 租户数据隔离

**Given** 多租户环境
**When** 不同租户登录
**Then** 每个租户使用独立的数据库文件
**And** 数据文件路径包含租户ID

### 场景 5: 会话存储

**Given** 用户创建新会话
**When** 保存会话数据
**Then** 数据写入 `sessions` 表
**And** `session_key` 格式为 `{tenantId}:{pluginId}:{sessionId}`
**And** 若 `session_key` 冲突则返回明确错误并阻止覆盖

### 场景 6: 消息存储

**Given** 会话中产生消息
**When** 保存消息
**Then** 数据写入 `messages` 表
**And** 关联正确的 `session_id`

### 场景 7: 同步队列

**Given** 网络离线
**When** 用户进行数据操作
**Then** 操作记录写入 `sync_queue` 表
**And** `status` 为 `pending`

### 场景 8: 冲突解决

**Given** 同一实体在本地与云端存在并发修改
**When** 执行同步与合并
**Then** 根据版本号或时间戳进行冲突检测
**And** 按实体类型的合并策略输出最终结果

### 场景 9: 本地加密

**Given** 本地数据库已初始化
**When** 启用本地加密
**Then** 数据文件加密存储
**And** 密钥由系统安全存储托管

## 数据规格

### 会话表 (sessions)

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    session_key TEXT UNIQUE NOT NULL,
    title TEXT,
    plugin_id TEXT,
    metadata TEXT,           -- JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    synced_at INTEGER,
    is_deleted INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
);
```

### 消息表 (messages)

```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,      -- user, assistant, system, tool
    content TEXT,
    tool_calls TEXT,         -- JSON array
    tool_call_id TEXT,
    metadata TEXT,           -- JSON
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### 同步队列表 (sync_queue)

```sql
CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL, -- create, update, delete
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT,            -- JSON
    created_at INTEGER NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    status TEXT DEFAULT 'pending', -- pending, processing, failed, synced
    processed_at INTEGER
);
```

### 记忆事实表 (memory_facts)

```sql
CREATE TABLE memory_facts (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT,           -- preference, constraint, fact
    confidence REAL DEFAULT 1.0,
    source TEXT,             -- conversation, document, manual
    embedding BLOB,          -- 向量数据（可选）
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_accessed_at INTEGER,
    access_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0
);
```

### 检查点表 (checkpoints)

```sql
CREATE TABLE checkpoints (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    user_input_preview TEXT,  -- 前100字符
    user_input_full TEXT,     -- 完整输入
    conversation_turn INTEGER,
    message_ids TEXT,         -- JSON array
    git_commit_hash TEXT,
    git_commit_message TEXT,
    artifacts TEXT,           -- JSON
    is_important INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    branch_id TEXT,
    parent_checkpoint_id TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_checkpoint_id) REFERENCES checkpoints(id)
);
```

### 上下文摘要表 (context_summaries)

```sql
CREATE TABLE context_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    covered_turns_start INTEGER,
    covered_turns_end INTEGER,
    summary_text TEXT,
    key_entities TEXT,        -- JSON array
    decisions TEXT,           -- JSON array
    tokens_saved INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### 版本表 (schema_version)

```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL,
    description TEXT
);
```

### JSON 字段约束

- `tool_calls`、`metadata`、`payload` 等字段按统一 JSON Schema 校验
- Schema 版本随迁移版本演进

## Rust 接口规格

```rust
// 存储管理器
pub struct StorageManager {
    conn: Connection,
    tenant_id: String,
}

impl StorageManager {
    pub async fn init(tenant_id: &str) -> Result<Self>;
    pub async fn get_session_store(&self) -> SessionStore;
    pub async fn get_message_store(&self) -> MessageStore;
    pub async fn get_sync_queue(&self) -> SyncQueue;
    pub async fn get_memory_store(&self) -> MemoryStore;
    pub async fn get_checkpoint_store(&self) -> CheckpointStore;
}

// 迁移管理
pub trait Migration {
    fn version(&self) -> i32;
    fn up(&self, conn: &Connection) -> Result<()>;
    fn down(&self, conn: &Connection) -> Result<()>;
}

// Tauri 命令
#[tauri::command]
pub async fn init_local_storage(tenant_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn get_storage_status() -> Result<StorageStatus, String>;
```

## 错误处理

| 错误码 | 描述 |
|--------|------|
| `STORAGE_INIT_FAILED` | 存储初始化失败 |
| `MIGRATION_FAILED` | 迁移执行失败 |
| `CONNECTION_ERROR` | 数据库连接错误 |
| `QUERY_ERROR` | 查询执行错误 |
| `INTEGRITY_ERROR` | 数据完整性错误 |

## 性能考虑

1. **连接池**: 使用单连接 + WAL 模式
2. **批量操作**: 支持批量插入和更新
3. **索引优化**: 为常用查询创建索引
4. **定期清理**: 自动清理过期数据和软删除记录
