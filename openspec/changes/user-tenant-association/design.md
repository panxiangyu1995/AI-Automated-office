# Design: 多租户-用户-租户关联

## 优化前架构

```
┌─────────────┐
│    User     │
├─────────────┤
│ id          │
│ username    │───▶ UNIQUE
│ password    │
│ name        │
│ department  │
│ role        │
│ created_at  │
│ updated_at  │
└─────────────┘
     │
     │ 无关联
     ▼
┌─────────────┐
│   Tenant    │
└─────────────┘
```

**问题：**
- 用户与租户无关联
- 无法实现多租户隔离
- 用户名全局唯一而非租户内唯一

## 优化后架构

```
┌─────────────┐          ┌─────────────┐
│    User     │          │   Tenant    │
├─────────────┤          ├─────────────┤
│ id          │          │ id          │
│ tenant_id   │─────────▶│ name        │
│ username    │          │ code        │
│ password    │          │ ...         │
│ name        │          └─────────────┘
│ department  │
│ role        │
└─────────────┘
```

**约束：**
- `users.tenant_id` → `tenants.id` (FK)
- `(tenant_id, username)` → UNIQUE

## 详细设计

### 1. 数据库变更

```sql
-- v8_users_tenant_id.sql
ALTER TABLE users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';

-- 为现有数据设置默认租户
UPDATE users SET tenant_id = 'default' WHERE tenant_id IS NULL;

-- 添加租户索引
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- 修改用户名唯一性约束
DROP INDEX idx_users_username;
CREATE UNIQUE INDEX idx_users_tenant_username ON users(tenant_id, username);
```

### 2. User 结构体变更

```rust
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct User {
    pub id: String,
    pub tenant_id: String,           // 新增
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub name: String,
    pub department: String,
    pub role: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl User {
    pub fn new(
        tenant_id: String,
        username: String,
        password_hash: String,
        name: String,
        department: String,
        role: String,
    ) -> Self {
        let now = Utc::now().timestamp();
        Self {
            id: format!("user-{}", uuid::Uuid::new_v4()),
            tenant_id,
            username,
            password_hash,
            name,
            department,
            role,
            created_at: now,
            updated_at: now,
        }
    }
}
```

### 3. AuthService 方法变更

```rust
impl AuthService {
    pub async fn login(
        &self, 
        tenant_id: &str,
        username: &str, 
        password: &str,
        remember_me: bool,
    ) -> Result<(User, String), String> {
        // 按租户和用户名查询
        let user: Option<User> = sqlx::query_as(
            "SELECT * FROM users WHERE tenant_id = ? AND username = ?"
        )
        .bind(tenant_id)
        .bind(username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        
        // 验证密码...
    }
    
    pub async fn register(
        &self,
        tenant_id: &str,
        username: &str,
        password: &str,
        name: &str,
        department: Option<&str>,
    ) -> Result<User, String> {
        // 验证用户名在租户内唯一
        let exists: Option<String> = sqlx::query_scalar(
            "SELECT id FROM users WHERE tenant_id = ? AND username = ?"
        )
        .bind(tenant_id)
        .bind(username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        
        if exists.is_some() {
            return Err("用户名已存在".to_string());
        }
        
        // 创建用户...
    }
}
```

### 4. JWT Claims 变更

```rust
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,      // user_id
    tid: String,      // tenant_id [新增]
    exp: usize,
}
```

## SessionMetadata 兼容性

`SessionMetadata` 已有 `tenant_id` 字段，无需修改：

```rust
pub struct SessionMetadata {
    pub user_id: String,
    pub username: String,
    pub display_name: Option<String>,
    pub tenant_id: String,  // 已有
    pub tenant_name: Option<String>,
    pub refresh_token: String,
    pub expires_at: i64,
    pub last_active_at: i64,
    pub created_at: i64,
}
```

## 兼容性策略

### 向后兼容

1. **默认租户值**: 所有现有用户的 tenant_id 默认为 "default"
2. **API 透明处理**: 前端登录时自动传递当前租户 ID
3. **迁移平滑**: ALTER TABLE ADD COLUMN 支持

### 多租户场景

```rust
// 登录时指定租户
let (user, token) = auth_service.login(
    "tenant-abc",  // 租户 ID
    "john",         // 用户名
    "password123",  // 密码
    false,          // remember_me
).await?;

// 注册时指定租户
let user = auth_service.register(
    "tenant-abc",   // 租户 ID
    "jane",         // 用户名
    "password123",  // 密码
    "Jane Doe",     // 姓名
    Some("Sales"),  // 部门
).await?;
```

## 测试策略

### 单元测试

1. **单租户用户测试**: 测试用户创建、登录
2. **多租户隔离测试**: 验证不同租户间用户隔离
3. **唯一性约束测试**: 验证租户内用户名唯一

### 集成测试

1. **迁移测试**: 验证从无 tenant_id 到有 tenant_id 的迁移
2. **跨租户查询测试**: 验证租户隔离
