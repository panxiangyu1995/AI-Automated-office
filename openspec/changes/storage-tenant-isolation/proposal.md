# Proposal: 多租户-存储层隔离强化

## 变更类型
- [ ] 新功能
- [ ] 架构优化
- [ ] 性能优化
- [x] 代码重构

## 背景

当前 `StorageManager` 按 tenant_id 分离数据库文件，但 Store 层（SessionStore/MessageStore/MemoryStore）查询未增加 tenant_id 条件，存在跨租户数据访问风险。

## 优化目标

确保所有存储操作通过 tenant_id 进行数据隔离：

1. Store 层增加 tenant_id 字段
2. 所有查询增加 tenant_id 过滤
3. 所有插入设置 tenant_id

## 功能不变性保证

**必须保持的现有功能：**
- 会话列表查询
- 会话创建/更新/删除
- 消息列表查询
- 消息创建/更新/删除
- 记忆 Fact 存储

## 优化方案

### 1. Store 结构体变更

```rust
pub struct SessionStore {
    pool: SqlitePool,
    tenant_id: String,  // 新增
}

pub struct MessageStore {
    pool: SqlitePool,
    tenant_id: String,  // 新增
}

pub struct MemoryStore {
    pool: SqlitePool,
    tenant_id: String,  // 新增
}
```

### 2. 数据库迁移

```sql
-- v9_store_tenant_id.sql
ALTER TABLE sessions ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE messages ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE memory_facts ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';

CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_memory_facts_tenant ON memory_facts(tenant_id);
```

### 3. 查询变更

```rust
impl SessionStore {
    pub async fn list(&self, user_id: Option<&str>) -> Result<Vec<Session>, Error> {
        let mut query = "SELECT * FROM sessions WHERE tenant_id = ?";
        let mut bindings: Vec<Box<dyn Bind + Send + Sync>> = vec![Box::new(self.tenant_id.clone())];
        
        if let Some(uid) = user_id {
            query = "SELECT * FROM sessions WHERE tenant_id = ? AND user_id = ?";
            bindings.push(Box::new(uid.to_string()));
        }
        
        // 执行查询...
    }
}
```

## 影响范围

### 涉及文件
- `src-tauri/src/storage/mod.rs` - StorageManager
- `src-tauri/src/storage/session_store.rs` - SessionStore
- `src-tauri/src/storage/message_store.rs` - MessageStore
- `src-tauri/src/storage/memory_store.rs` - MemoryStore
- `src-tauri/src/storage/migrations/` - 数据库迁移

### 不影响文件
- `src-tauri/src/tenant/` - 租户模块
- `src-tauri/src/auth/` - 认证模块

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 迁移破坏现有数据 | 低 | 高 | 设置 DEFAULT 值 |
| 查询性能下降 | 低 | 中 | 确保索引存在 |
| 代码遗漏 | 中 | 高 | 添加测试覆盖 |

## 依赖

- **前置依赖:** Task 222 (租户上下文传播)
- **后置依赖:** 无

## 验证计划

```bash
cargo build --lib
cargo test storage
cargo clippy
```
