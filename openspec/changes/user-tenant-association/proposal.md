# Proposal: 多租户-用户-租户关联

## 变更类型
- [ ] 新功能
- [ ] 架构优化
- [x] 性能优化
- [ ] 代码重构

## 背景

当前 `User` 表没有 `tenant_id` 字段，导致：

1. **用户与租户解耦** - 无法实现用户级别的租户隔离
2. **用户名全局唯一** - 应改为租户内唯一
3. **无法支持多租户** - 限制了系统的多租户能力

## 优化目标

为 User 表增加 tenant_id 字段，建立用户与租户的关联：

1. 用户属于特定租户
2. 用户名在租户内唯一
3. 支持多租户场景

## 功能不变性保证

**必须保持的现有功能：**
- `auth/login` - 用户登录
- `auth/register` - 用户注册
- `auth/get_current_user` - 获取当前用户
- `auth/ensure_default_user` - 创建默认用户

## 优化方案

### 1. 数据库迁移 (v8_users_tenant_id)

```sql
-- 添加 tenant_id 字段
ALTER TABLE users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';

-- 为现有用户设置默认租户
UPDATE users SET tenant_id = 'default' WHERE tenant_id IS NULL;

-- 添加索引
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- 修改用户名唯一性约束（租户内唯一）
DROP INDEX IF EXISTS idx_users_username;
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
```

### 3. AuthService 方法签名变更

```rust
impl AuthService {
    pub async fn login(
        &self, 
        tenant_id: &str,
        username: &str, 
        password: &str
    ) -> Result<(User, String), String>
    
    pub async fn register(
        &self,
        tenant_id: &str,
        username: &str,
        password: &str,
        name: &str,
        department: Option<&str>,
    ) -> Result<User, String>
}
```

## 影响范围

### 涉及文件
- `src-tauri/src/auth/mod.rs` - User 结构体和 AuthService
- `src-tauri/src/storage/migrations/v3_users.rs` - 用户表迁移
- `src-tauri/src/storage/migrations/v8_users_tenant_id.rs` - **新增** 租户关联迁移
- `src-tauri/src/session/metadata.rs` - SessionMetadata（已有 tenant_id，保持一致）

### 不影响文件
- `src-tauri/src/tenant/` - 租户模块
- `src-tauri/src/agent/` - Agent 模块

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 迁移破坏现有用户 | 低 | 高 | 迁移前备份，DEFAULT 值保证兼容性 |
| 前端接口不兼容 | 低 | 中 | 保持内部处理透明 |
| 唯一性约束冲突 | 中 | 高 | 迁移前清理重复用户名 |

## 依赖

- **前置依赖:** Task 220 (租户持久化改造)
- **后置依赖:** Task 222 (租户上下文传播)

## 验证计划

```bash
cargo build --lib
cargo test auth
cargo clippy
```
