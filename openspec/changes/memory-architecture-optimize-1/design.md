# Design: Agent记忆模块架构优化 - 阶段1

## 优化前架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        MemoryService                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Hooks      │───▶│   Dispatch   │───▶│   Process     │     │
│  │   Registry   │    │   Dispatcher │    │   (内存)      │     │
│  └──────────────┘    └──────────────┘    └───────┬──────┘     │
│                                                  │             │
│  ┌──────────────┐    ┌──────────────┐            │             │
│  │  Retrieval   │    │   Hybrid     │            │             │
│  │  (未使用)    │    │  (空实现)   │            │             │
│  └──────────────┘    └──────────────┘            │             │
│                                                  ▼             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              PersonalMemoryStore                        │    │
│  │              items: Arc<RwLock<Vec<MemoryItem>>>       │    │
│  │              (内存存储，重启丢失)                       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**问题：**
1. Hook事件未持久化
2. HybridRetrievalEngine未集成
3. 内存存储，重启丢失

## 优化后架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        MemoryService                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Hooks      │───▶│   Dispatch   │───▶│   Process     │     │
│  │   Registry   │    │   Dispatcher │    │   持久化      │     │
│  └──────────────┘    └──────────────┘    └───────┬──────┘     │
│                                                  │             │
│  ┌──────────────┐    ┌──────────────┐           │             │
│  │  Retrieval   │◀───│   Hybrid     │           │             │
│  │  (向量存储)   │    │  Retrieval   │           │             │
│  └──────────────┘    └──────────────┘           │             │
│                                                  ▼             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              PersonalMemoryStore                       │    │
│  │              backend: Arc<dyn StorageBackend>           │    │
│  │              (SQLite持久化)                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    StorageBackend Trait                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              SqliteStorage                             │     │
│  │              pool: Pool<Sqlite>                        │     │
│  │              - memory_items 表                          │     │
│  │              - vector_index (sqlite-vec)               │     │
│  │              - fts5 全文索引                           │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 详细设计

### 1. StorageBackend Trait

```rust
// src-tauri/src/agent/memory/storage/backend.rs

use async_trait::async_trait;
use rusqlite::{params, Connection};
use std::sync::Arc;

/// 存储后端抽象
#[async_trait]
pub trait StorageBackend: Send + Sync {
    /// 执行无返回值的SQL
    async fn execute(&self, sql: &str, params: &[(&str, &dyn ToSql)]) -> Result<(), StorageError>;

    /// 执行查询并返回结果
    async fn query<T: FromRow + Send + 'static>(
        &self,
        sql: &str,
        params: &[(&str, &dyn ToSql)],
    ) -> Result<Vec<T>, StorageError>;

    /// 初始化表结构
    async fn init_schema(&self) -> Result<(), StorageError>;
}

/// SQLite存储实现
pub struct SqliteStorage {
    path: String,
    pool: Arc<tokio::sync::RwLock<Connection>>,
}

impl SqliteStorage {
    pub fn new(path: &str) -> Result<Self, StorageError> {
        let conn = Connection::open(path)?;
        Ok(Self {
            path: path.to_string(),
            pool: Arc::new(tokio::sync::RwLock::new(conn)),
        })
    }
}

#[async_trait]
impl StorageBackend for SqliteStorage {
    async fn execute(&self, sql: &str, params: &[(&str, &dyn ToSql)]) -> Result<(), StorageError> {
        let conn = self.pool.write().await;
        conn.execute(sql, params)
            .map_err(|e| StorageError::Execution(e.to_string()))?;
        Ok(())
    }

    async fn query<T: FromRow + Send + 'static>(
        &self,
        sql: &str,
        params: &[(&str, &dyn ToSql)],
    ) -> Result<Vec<T>, StorageError> {
        let conn = self.pool.read().await;
        let mut stmt = conn.prepare(sql)
            .map_err(|e| StorageError::Query(e.to_string()))?;

        let rows = stmt.query_map(params, |row| {
            T::from_row(row)
        }).map_err(|e| StorageError::Query(e.to_string()))?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| StorageError::Query(e.to_string()))
    }

    async fn init_schema(&self) -> Result<(), StorageError> {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS memory_items (
                id TEXT PRIMARY KEY,
                layer TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                user_id TEXT,
                session_key TEXT,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                category TEXT NOT NULL,
                confidence REAL NOT NULL,
                source TEXT NOT NULL,
                embedding BLOB,
                metadata TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                last_accessed_at INTEGER,
                access_count INTEGER NOT NULL DEFAULT 0,
                version INTEGER NOT NULL DEFAULT 1,
                is_deleted INTEGER NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_memory_tenant ON memory_items(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_items(user_id);
            CREATE INDEX IF NOT EXISTS idx_memory_layer ON memory_items(layer);
            CREATE INDEX IF NOT EXISTS idx_memory_key ON memory_items(tenant_id, user_id, key);
        "#;

        self.execute(sql, &[]).await
    }
}
```

### 2. PersonalMemoryStore 重构

```rust
// src-tauri/src/agent/memory/storage/personal.rs

use async_trait::async_trait;
use std::sync::Arc;

use super::backend::{SqliteStorage, StorageBackend};
use super::layer::{MemoryStore, PermissionBoundary};
use crate::agent::memory::types::{MemoryItem, MemoryLayer, MemoryQuery, MemoryCategory};
use crate::agent::memory::config::MemoryError;

pub struct PersonalMemoryStore {
    backend: Arc<SqliteStorage>,
}

impl PersonalMemoryStore {
    pub fn new(backend: SqliteStorage) -> Self {
        Self {
            backend: Arc::new(backend),
        }
    }

    pub async fn with_default_db() -> Result<Self, MemoryError> {
        let db_path = dirs::data_local_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("ai-automated-office")
            .join("memory.db");

        std::fs::create_dir_all(db_path.parent().unwrap()).ok();

        let backend = SqliteStorage::new(db_path.to_str().unwrap())
            .map_err(|e| MemoryError::Storage(e.to_string()))?;
        backend.init_schema().await
            .map_err(|e| MemoryError::Storage(e.to_string()))?;

        Ok(Self::new(backend))
    }
}

#[async_trait]
impl MemoryStore for PersonalMemoryStore {
    async fn add(&self, item: &MemoryItem) -> Result<(), MemoryError> {
        if item.layer != MemoryLayer::Personal {
            return Err(MemoryError::OperationFailed(
                "PersonalMemoryStore can only store personal memories".to_string(),
            ));
        }

        let sql = r#"
            INSERT OR REPLACE INTO memory_items
            (id, layer, tenant_id, user_id, session_key, key, value, category,
             confidence, source, embedding, metadata, created_at, updated_at,
             last_accessed_at, access_count, version, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#;

        let embedding_blob = item.embedding.as_ref().map(|e| {
            rusqlite::blob::ZeroBlob(e.len() as i32)
        });

        self.backend.execute(sql, &[
            ("id", &item.id as &dyn rusqlite::ToSql),
            ("layer", &format!("{:?}", item.layer) as &dyn rusqlite::ToSql),
            ("tenant_id", &item.tenant_id as &dyn rusqlite::ToSql),
            ("user_id", &item.user_id as &dyn rusqlite::ToSql),
            ("session_key", &item.session_key as &dyn rusqlite::ToSql),
            ("key", &item.key as &dyn rusqlite::ToSql),
            ("value", &item.value as &dyn rusqlite::ToSql),
            ("category", &format!("{:?}", item.category) as &dyn rusqlite::ToSql),
            ("confidence", &item.confidence as &dyn rusqlite::ToSql),
            ("source", &format!("{:?}", item.source) as &dyn rusqlite::ToSql),
            ("embedding", &Option::<String>::None as &dyn rusqlite::ToSql),
            ("metadata", &item.metadata.to_string() as &dyn rusqlite::ToSql),
            ("created_at", &item.created_at as &dyn rusqlite::ToSql),
            ("updated_at", &item.updated_at as &dyn rusqlite::ToSql),
            ("last_accessed_at", &item.last_accessed_at as &dyn rusqlite::ToSql),
            ("access_count", &item.access_count as &dyn rusqlite::ToSql),
            ("version", &item.version as &dyn rusqlite::ToSql),
            ("is_deleted", &(item.is_deleted as i32) as &dyn rusqlite::ToSql),
        ]).await.map_err(|e| MemoryError::Storage(e.to_string()))?;

        Ok(())
    }

    async fn search(&self, query: &MemoryQuery) -> Result<Vec<MemoryItem>, MemoryError> {
        let sql = r#"
            SELECT * FROM memory_items
            WHERE is_deleted = 0
              AND tenant_id = ?
              AND (user_id = ? OR user_id IS NULL)
              AND (layer = 'Personal' OR layer = 'Personal')
              AND (key LIKE ? OR value LIKE ?)
            ORDER BY updated_at DESC
            LIMIT ?
        "#;

        let like_pattern = format!("%{}%", query.query);

        let rows: Vec<MemoryItemRow> = self.backend.query(sql, &[
            ("tenant_id", &query.tenant_id as &dyn rusqlite::ToSql),
            ("user_id", &query.user_id as &dyn rusqlite::ToSql),
            ("key_pattern", &like_pattern as &dyn rusqlite::ToSql),
            ("value_pattern", &like_pattern as &dyn rusqlite::ToSql),
            ("limit", &(query.k as i64) as &dyn rusqlite::ToSql),
        ]).await.map_err(|e| MemoryError::Storage(e.to_string()))?;

        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    // ... 其他方法类似实现
}
```

### 3. HybridRetrievalEngine 修复

```rust
// src-tauri/src/agent/memory/retrieval/hybrid.rs

impl<V: VectorStore> HybridRetrievalEngine<V> {
    /// 修复后的keyword_search实现
    async fn keyword_search(
        &self,
        query: &MemoryQuery,
    ) -> Result<Vec<SearchResult>, MemoryError> {
        // 使用FTS5进行全文搜索
        let fts_sql = r#"
            SELECT id, key, value, bm25(matchinfo(fts_table)) as rank
            FROM memory_items_fts
            WHERE memory_items_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        "#;

        // 实现FTS5搜索逻辑
        // ...
        Ok(results)
    }
}
```

## 依赖关系

```
MemoryService
    │
    ├── StorageBackend (trait)
    │       │
    │       └── SqliteStorage
    │
    ├── HybridRetrievalEngine
    │       │
    │       ├── VectorStore
    │       └── EmbeddingService
    │
    ├── HookDispatcher
    │       │
    │       └── HookRegistry
    │
    └── CognitiveStateManager
```

## 测试要点

1. **持久化测试**：添加数据 → 重启 → 验证数据存在
2. **Hook链路测试**：触发Hook → 验证存储 → 查询验证
3. **检索测试**：添加带embedding的数据 → 搜索 → 验证混合检索
4. **权限测试**：验证L1只能本人访问，L2可租户内共享
