# Proposal: 多租户-租户持久化改造

## 变更类型
- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

当前 `TenantState` 使用 `Mutex<Vec<Tenant>>` 内存存储，存在以下问题：

1. **数据不持久化** - 应用重启后租户配置丢失
2. **无法长期存储** - 仅适合单次会话使用
3. **无数据一致性保证** - 内存数据在异常情况下可能丢失

云端 `cloud-server` 已有完整的租户中间件实现，桌面端需要与其保持一致的架构设计。

## 优化目标

将 TenantState 从内存存储改造为 SQLite 持久化存储，实现：

1. 租户数据的持久化存储
2. 数据访问抽象（Repository Pattern）
3. 与云端架构一致的设计

## 功能不变性保证

**必须保持的现有功能：**
- `tenant_list` - 租户列表查询
- `tenant_get_current` - 获取当前租户
- `tenant_get_config` - 获取租户配置
- `tenant_update_config` - 更新租户配置
- `tenant_get_stats` - 获取租户统计

## 优化方案

### 1. 数据库迁移 (v7_tenant_tables)

```sql
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    max_users INTEGER NOT NULL DEFAULT 10,
    max_storage INTEGER NOT NULL DEFAULT 1073741824,
    features TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_configs (
    tenant_id TEXT PRIMARY KEY REFERENCES tenants(id),
    feature_flags TEXT NOT NULL,
    rate_limit TEXT NOT NULL,
    storage_usage INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### 2. Repository Trait 定义

```rust
pub trait TenantRepository: Send + Sync {
    async fn get_by_id(&self, id: &str) -> Result<Option<Tenant>>;
    async fn get_by_code(&self, code: &str) -> Result<Option<Tenant>>;
    async fn list(&self) -> Result<Vec<Tenant>>;
    async fn create(&self, tenant: &Tenant) -> Result<()>;
    async fn update(&self, tenant: &Tenant) -> Result<()>;
    async fn delete(&self, id: &str) -> Result<()>;
}

pub trait TenantConfigRepository: Send + Sync {
    async fn get_by_tenant_id(&self, tenant_id: &str) -> Result<Option<TenantConfig>>;
    async fn upsert(&self, config: &TenantConfig) -> Result<()>;
}
```

### 3. SqliteTenantRepository 实现

```rust
pub struct SqliteTenantRepository {
    pool: SqlitePool,
}

impl TenantRepository for SqliteTenantRepository {
    async fn get_by_id(&self, id: &str) -> Result<Option<Tenant>> {
        sqlx::query_as::<_, Tenant>(
            "SELECT * FROM tenants WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(Into::into)
    }
    // ... 其他方法
}
```

### 4. TenantState 重构

```rust
pub struct TenantState<R: TenantRepository, C: TenantConfigRepository> {
    repository: Arc<R>,
    config_repository: Arc<C>,
    current_tenant: Mutex<Option<String>>,
}

impl<R: TenantRepository, C: TenantConfigRepository> TenantState<R, C> {
    pub fn new(repository: R, config_repository: C) -> Self {
        Self {
            repository: Arc::new(repository),
            config_repository: Arc::new(config_repository),
            current_tenant: Mutex::new(None),
        }
    }
}
```

## 影响范围

### 涉及文件
- `src-tauri/src/tenant/mod.rs` - 模块入口
- `src-tauri/src/tenant/commands.rs` - 命令实现
- `src-tauri/src/tenant/types.rs` - 类型定义
- `src-tauri/src/tenant/repository.rs` - **新增** Repository 实现
- `src-tauri/src/storage/migrations/v7_tenant_tables.rs` - **新增** 数据库迁移

### 不影响文件
- `src-tauri/src/auth/mod.rs` - 认证模块
- `src-tauri/src/agent/` - Agent 模块
- `src/features/` - 前端模块

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 数据迁移失败 | 低 | 高 | 迁移脚本先检查表是否存在 |
| 性能下降 | 低 | 中 | 使用索引优化查询 |
|向后兼容问题 | 低 | 中 | 保持 API 接口不变 |

## 依赖

- **前置依赖:** 无
- **后置依赖:** Task 221 (用户-租户关联)

## 验证计划

```bash
cargo build --lib
cargo test tenant
cargo clippy
```
