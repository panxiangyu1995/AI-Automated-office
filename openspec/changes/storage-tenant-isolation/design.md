# Design: 多租户-存储层隔离强化

## 优化前架构

```
┌─────────────────────────────────────────────────────────┐
│              StorageManager (按 tenant_id 分离数据库文件)     │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────┬─────────────────┬─────────────────┐
│   SessionStore   │  MessageStore   │  MemoryStore   │
├─────────────────┼─────────────────┼─────────────────┤
│ pool            │ pool           │ pool           │
│ ❌ 无 tenant_id │ ❌ 无 tenant_id│ ❌ 无 tenant_id│
└─────────────────┴─────────────────┴─────────────────┘
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │sessions │      │messages │      │memory   │
    │(无隔离) │      │(无隔离) │      │facts    │
    └─────────┘      └─────────┘      └─────────┘
```

**问题：**
- Store 层无 tenant_id 字段
- 查询未按 tenant_id 过滤
- 同一数据库文件内可能存在跨租户数据

## 优化后架构

```
┌─────────────────────────────────────────────────────────┐
│              StorageManager (按 tenant_id 分离数据库文件)     │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────┬─────────────────┬─────────────────┐
│   SessionStore   │  MessageStore   │  MemoryStore   │
├─────────────────┼─────────────────┼─────────────────┤
│ pool            │ pool           │ pool           │
│ tenant_id ✓     │ tenant_id ✓    │ tenant_id ✓    │
└─────────────────┴─────────────────┴─────────────────┘
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │sessions │      │messages │      │memory   │
    │tenant_id│      │tenant_id│      │facts    │
    └─────────┘      └─────────┘      └─────────┘
```

**改进：**
- Store 层包含 tenant_id
- 所有查询按 tenant_id 过滤
- 双重隔离（数据库文件 + 表字段）

## 详细设计

### 1. 数据库变更

```sql
-- v9_store_tenant_id.sql

-- 为 sessions 表添加 tenant_id
ALTER TABLE sessions ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);

-- 为 messages 表添加 tenant_id
ALTER TABLE messages ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX idx_messages_tenant ON messages(tenant_id);

-- 为 memory_facts 表添加 tenant_id
ALTER TABLE memory_facts ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX idx_memory_facts_tenant ON memory_facts(tenant_id);
```

### 2. SessionStore 变更

```rust
// src-tauri/src/storage/session_store.rs
pub struct SessionStore {
    pool: SqlitePool,
    tenant_id: String,  // 新增
}

impl SessionStore {
    pub fn new(pool: SqlitePool, tenant_id: String) -> Self {
        Self { pool, tenant_id }
    }
    
    pub async fn list(&self, user_id: Option<&str>) -> Result<Vec<Session>, Error> {
        let query = match user_id {
            Some(uid) => {
                sqlx::query_as::<_, SessionRow>(
                    "SELECT * FROM sessions WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC"
                )
                .bind(&self.tenant_id)
                .bind(uid)
            }
            None => {
                sqlx::query_as::<_, SessionRow>(
                    "SELECT * FROM sessions WHERE tenant_id = ? ORDER BY created_at DESC"
                )
                .bind(&self.tenant_id)
            }
        };
        
        query.fetch_all(&self.pool).await.map_err(Into::into)
    }
    
    pub async fn create(&self, session: &Session) -> Result<(), Error> {
        sqlx::query(
            r#"INSERT INTO sessions (id, user_id, tenant_id, title, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&session.id)
        .bind(&session.user_id)
        .bind(&self.tenant_id)  // 使用 Store 的 tenant_id
        .bind(&session.title)
        .bind(status_to_str(&session.status))
        .bind(session.created_at)
        .bind(session.updated_at)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
}
```

### 3. MessageStore 变更

```rust
// src-tauri/src/storage/message_store.rs
pub struct MessageStore {
    pool: SqlitePool,
    tenant_id: String,  // 新增
}

impl MessageStore {
    pub fn new(pool: SqlitePool, tenant_id: String) -> Self {
        Self { pool, tenant_id }
    }
    
    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<Message>, Error> {
        sqlx::query_as::<_, MessageRow>(
            "SELECT * FROM messages WHERE tenant_id = ? AND session_id = ? ORDER BY created_at ASC"
        )
        .bind(&self.tenant_id)
        .bind(session_id)
        .fetch_all(&self.pool)
        .await
        .map(|rows| rows.into_iter().map(Message::from).collect())
        .map_err(Into::into)
    }
    
    pub async fn create(&self, message: &Message) -> Result<(), Error> {
        sqlx::query(
            r#"INSERT INTO messages (id, session_id, tenant_id, role, content, created_at)
               VALUES (?, ?, ?, ?, ?, ?)"#
        )
        .bind(&message.id)
        .bind(&message.session_id)
        .bind(&self.tenant_id)
        .bind(&message.role)
        .bind(&message.content)
        .bind(message.created_at)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
}
```

### 4. MemoryStore 变更

```rust
// src-tauri/src/storage/memory_store.rs
pub struct MemoryStore {
    pool: SqlitePool,
    tenant_id: String,  // 新增
}

impl MemoryStore {
    pub fn new(pool: SqlitePool, tenant_id: String) -> Self {
        Self { pool, tenant_id }
    }
    
    pub async fn query(&self, user_id: &str, query: &str) -> Result<Vec<MemoryFact>, Error> {
        sqlx::query_as::<_, MemoryFactRow>(
            "SELECT * FROM memory_facts WHERE tenant_id = ? AND user_id = ? AND content LIKE ?"
        )
        .bind(&self.tenant_id)
        .bind(user_id)
        .bind(format!("%{}%", query))
        .fetch_all(&self.pool)
        .await
        .map(|rows| rows.into_iter().map(MemoryFact::from).collect())
        .map_err(Into::into)
    }
    
    pub async fn insert(&self, fact: &MemoryFact) -> Result<(), Error> {
        sqlx::query(
            r#"INSERT INTO memory_facts (id, user_id, tenant_id, content, category, created_at)
               VALUES (?, ?, ?, ?, ?, ?)"#
        )
        .bind(&fact.id)
        .bind(&fact.user_id)
        .bind(&self.tenant_id)
        .bind(&fact.content)
        .bind(&fact.category)
        .bind(fact.created_at)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
}
```

### 5. StorageManager 变更

```rust
// src-tauri/src/storage/mod.rs
impl StorageManager {
    pub fn session_store(&self) -> SessionStore {
        SessionStore::new(self.pool.clone(), self.tenant_id.clone())
    }
    
    pub fn message_store(&self) -> MessageStore {
        MessageStore::new(self.pool.clone(), self.tenant_id.clone())
    }
    
    pub fn memory_store(&self) -> MemoryStore {
        MemoryStore::new(self.pool.clone(), self.tenant_id.clone())
    }
}
```

## 测试策略

### 单元测试

1. **隔离测试**: 验证不同 tenant_id 的数据不互通
2. **CRUD 测试**: 验证带 tenant_id 的 CRUD 操作
3. **索引测试**: 验证索引存在且有效

### 集成测试

1. **跨租户隔离测试**: 创建两个租户的数据，验证互不干扰
2. **迁移测试**: 验证 v9 迁移正确执行
