# Design: 多租户-租户持久化改造

## 优化前架构

```
┌─────────────────────┐
│   TenantState       │
│ ┌─────────────────┐ │
│ │ tenants: Mutex  │ │
│ │     ::Vec<Tenant│ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │configs: Mutex   │ │
│ │  ::Vec<TenantC │ │
│ └─────────────────┘ │
└─────────────────────┘
         │
         ▼ 内存操作
    ┌─────────┐
    │ 无持久化 │
    └─────────┘
```

**问题：**
- 租户数据仅存内存
- 应用重启数据丢失
- 无数据访问抽象

## 优化后架构

```
┌─────────────────────────────────────────────────────┐
│                    TenantState                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ repository: Arc<dyn TenantRepository>        │   │
│  │ config_repository: Arc<dyn TenantConfigRepo>│   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Trait     │  │   Trait     │  │   Trait     │
│  Interface   │  │  Interface  │  │  Interface  │
└─────────────┘  └─────────────┘  └─────────────┘
         │               │               │
         ▼               ▼               ▼
┌─────────────────────────────────────────────────────┐
│              SqliteTenantRepository                 │
│  ┌─────────────────────────────────────────────┐  │
│  │ pool: SqlitePool                             │  │
│  │                                             │  │
│  │ - get_by_id()                               │  │
│  │ - get_by_code()                             │  │
│  │ - list()                                    │  │
│  │ - create()                                  │  │
│  │ - update()                                  │  │
│  │ - delete()                                  │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   SQLite Database   │
              │ ┌─────────────────┐ │
              │ │ tenants         │ │
              │ │ tenant_configs  │ │
              │ └─────────────────┘ │
              └─────────────────────┘
```

## 详细设计

### 1. 模块结构

```
src-tauri/src/tenant/
├── mod.rs           # 模块入口，导出类型和命令
├── types.rs         # 数据类型定义
├── commands.rs      # Tauri 命令实现
├── repository.rs    # Repository trait 和实现 [新增]
└── errors.rs        # 错误类型 [新增]
```

### 2. 错误类型设计

```rust
#[derive(Debug, Error)]
pub enum TenantError {
    #[error("Tenant not found: {0}")]
    NotFound(String),
    
    #[error("Tenant already exists: {0}")]
    AlreadyExists(String),
    
    #[error("Invalid tenant data: {0}")]
    InvalidData(String),
    
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
}
```

### 3. Repository Trait 设计

```rust
use async_trait::async_trait;

#[async_trait]
pub trait TenantRepository: Send + Sync {
    async fn get_by_id(&self, id: &str) -> Result<Option<Tenant>, TenantError>;
    async fn get_by_code(&self, code: &str) -> Result<Option<Tenant>, TenantError>;
    async fn list(&self) -> Result<Vec<Tenant>, TenantError>;
    async fn create(&self, tenant: &Tenant) -> Result<(), TenantError>;
    async fn update(&self, tenant: &Tenant) -> Result<(), TenantError>;
    async fn delete(&self, id: &str) -> Result<(), TenantError>;
}

#[async_trait]
pub trait TenantConfigRepository: Send + Sync {
    async fn get_by_tenant_id(&self, tenant_id: &str) -> Result<Option<TenantConfig>, TenantError>;
    async fn upsert(&self, config: &TenantConfig) -> Result<(), TenantError>;
}
```

### 4. SqliteTenantRepository 实现

```rust
pub struct SqliteTenantRepository {
    pool: SqlitePool,
}

#[async_trait]
impl TenantRepository for SqliteTenantRepository {
    async fn get_by_id(&self, id: &str) -> Result<Option<Tenant>, TenantError> {
        let tenant = sqlx::query_as::<_, TenantRow>(
            "SELECT id, name, code, plan, max_users, max_storage, features, status, created_at FROM tenants WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        
        Ok(tenant.map(|r| r.into()))
    }
    
    async fn create(&self, tenant: &Tenant) -> Result<(), TenantError> {
        sqlx::query(
            r#"INSERT INTO tenants (id, name, code, plan, max_users, max_storage, features, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&tenant.id)
        .bind(&tenant.name)
        .bind(&tenant.code)
        .bind(plan_to_str(&tenant.plan))
        .bind(tenant.max_users)
        .bind(tenant.max_storage)
        .bind(serde_json::to_string(&tenant.features)?)
        .bind(status_to_str(&tenant.status))
        .bind(tenant.created_at)
        .bind(tenant.created_at)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    // ... 其他方法
}
```

### 5. TenantState 重构

```rust
use std::sync::Arc;

pub struct TenantState<R, C>
where
    R: TenantRepository,
    C: TenantConfigRepository,
{
    repository: Arc<R>,
    config_repository: Arc<C>,
    current_tenant: Mutex<Option<String>>,
}

impl<R, C> TenantState<R, C>
where
    R: TenantRepository + 'static,
    C: TenantConfigRepository + 'static,
{
    pub fn new(repository: R, config_repository: C) -> Self {
        Self {
            repository: Arc::new(repository),
            config_repository: Arc::new(config_repository),
            current_tenant: Mutex::new(None),
        }
    }
    
    pub async fn get_current(&self) -> Result<Tenant, TenantError> {
        let tenant_id = self.current_tenant.lock().unwrap().clone()
            .ok_or_else(|| TenantError::NotFound("No current tenant".into()))?;
        self.repository.get_by_id(&tenant_id).await?
            .ok_or_else(|| TenantError::NotFound(tenant_id))
    }
}
```

## 兼容性设计

### 向后兼容

1. **保持命令接口不变** - 所有 Tauri 命令签名保持一致
2. **默认租户初始化** - 首次启动时自动创建默认租户
3. **数据迁移透明** - 迁移过程对上层透明

### 初始化流程

```rust
pub async fn init_default_tenant(state: &TenantState<impl TenantRepository, impl TenantConfigRepository>) {
    // 检查是否存在默认租户
    let tenants = state.repository.list().await?;
    if tenants.is_empty() {
        // 创建默认租户
        let default = Tenant::new_default();
        state.repository.create(&default).await?;
        state.set_current(&default.id).await?;
    }
}
```

## 测试策略

### 单元测试

1. **Repository Mock 测试** - 使用 Mock 验证业务逻辑
2. **TenantState 测试** - 测试状态管理
3. **错误处理测试** - 边界条件测试

### 集成测试

1. **真实数据库测试** - 使用 SQLite 内存数据库
2. **迁移测试** - 验证迁移脚本正确性
