# Design: SQLite本地存储初始化

## 存储架构

### 数据库位置

```
Windows: %LOCALAPPDATA%\AI-Automated-office\data\{tenant_id}\local.db
macOS: ~/Library/Application Support/AI-Automated-office/data/{tenant_id}/local.db
Linux: ~/.local/share/ai-automated-office/data/{tenant_id}/local.db
```

### 本地加密与安全

- 本地数据库启用加密存储或文件系统级加密
- 密钥由系统安全存储托管，不写入配置文件

### 冲突解决与版本

- 业务数据使用 `version` 或时间戳进行冲突检测
- 冲突合并策略按实体类型配置，默认采用最新写入优先

### 运行与清理策略

- SQLite 使用 WAL 模式
- 定期清理软删除记录与过期队列项

### 表结构设计

```sql
-- 本地会话缓存
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    session_key TEXT UNIQUE NOT NULL,  -- {tenantId}:{pluginId}:{sessionId}
    title TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    synced_at INTEGER,
    is_deleted INTEGER DEFAULT 0
);

-- 消息记录
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,  -- user, assistant, system, tool
    content TEXT,
    tool_calls TEXT,     -- JSON
    tool_call_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 同步队列（离线操作）
CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,  -- create, update, delete
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT,             -- JSON
    created_at INTEGER NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    status TEXT DEFAULT 'pending'  -- pending, processing, failed, synced
);

-- 记忆事实存储（L1个人记忆层）
CREATE TABLE memory_facts (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT,            -- preference, constraint, fact
    confidence REAL DEFAULT 1.0,
    source TEXT,              -- conversation, document, manual
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_accessed_at INTEGER,
    access_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0
);

-- 检查点元数据
CREATE TABLE checkpoints (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    user_input_preview TEXT,
    user_input_full TEXT,
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

-- 上下文摘要
CREATE TABLE context_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    covered_turns_start INTEGER,
    covered_turns_end INTEGER,
    summary_text TEXT,
    key_entities TEXT,        -- JSON
    decisions TEXT,           -- JSON array
    tokens_saved INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 数据库版本表
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL
);

-- 索引
CREATE INDEX idx_sessions_session_key ON sessions(session_key);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_memory_facts_key ON memory_facts(key);
CREATE INDEX idx_checkpoints_session ON checkpoints(session_id);
CREATE INDEX idx_checkpoints_created ON checkpoints(created_at);
```

### JSON 字段约束

- `tool_calls`、`metadata`、`payload` 等字段统一采用 JSON Schema 校验
- Schema 版本与数据库迁移版本保持一致

## Rust实现结构

```
src-tauri/src/storage/
├── mod.rs
├── sqlite.rs           # SQLite连接管理
├── migrations/         # 迁移脚本
│   ├── mod.rs
│   ├── v1_initial.rs
│   └── v2_add_context_summaries.rs
├── session_store.rs    # 会话存储
├── message_store.rs    # 消息存储
├── sync_queue.rs       # 同步队列
├── memory_store.rs     # 记忆存储
└── checkpoint_store.rs # 检查点存储
```

## 迁移机制

```rust
pub struct Migration {
    pub version: i32,
    pub name: &'static str,
    pub up: &'static str,
    pub down: Option<&'static str>,
}

pub fn run_migrations(conn: &Connection) -> Result<()> {
    // 1. 创建 schema_version 表（如果不存在）
    // 2. 查询当前版本
    // 3. 按顺序执行未应用的迁移
    // 4. 更新版本号
}
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `src-tauri/src/storage/mod.rs` | 存储模块入口 |
| `src-tauri/src/storage/sqlite.rs` | SQLite连接管理 |
| `src-tauri/src/storage/migrations/mod.rs` | 迁移管理 |
| `src-tauri/src/storage/migrations/v1_initial.rs` | 初始化迁移 |
| `src-tauri/src/storage/session_store.rs` | 会话存储 |
| `src-tauri/src/storage/message_store.rs` | 消息存储 |
| `src-tauri/src/storage/sync_queue.rs` | 同步队列 |
| `src-tauri/src/storage/memory_store.rs` | 记忆存储 |
| `src-tauri/src/storage/checkpoint_store.rs` | 检查点存储 |
