# Design: PostgreSQL数据库初始化

## 数据库架构

### 多租户隔离方案 (ADR-005)

采用Schema级隔离：
- 每个租户使用独立的数据库Schema
- 公共数据放在public Schema
- 租户数据放在 `{tenant_id}` Schema

### 多租户连接与 search_path

- 连接建立后按租户设置 `search_path`，避免跨租户查询
- 连接池复用时必须重置 `search_path` 与租户上下文
- 租户 Schema 创建流程与租户记录写入在同一事务内完成

### 表结构设计

```sql
-- 租户表 (public schema)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表 (public schema)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- 角色表 (public schema)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- 权限表 (public schema)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

-- 用户角色关联表
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- 部门表 (public schema)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    parent_id UUID REFERENCES departments(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    manager_id UUID REFERENCES users(id),
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会话表 (public schema)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
```

### 软删除与审计

- 关键业务表增加 `deleted_at`，查询默认过滤
- 所有数据变更记录 `updated_at` 自动更新
- 管理操作保留审计字段（操作者、来源、时间）

## 迁移管理

使用 GORM AutoMigrate + 自定义迁移脚本：

```
migrations/
├── 001_init_schema.up.sql
├── 001_init_schema.down.sql
├── 002_seed_permissions.up.sql
├── 003_seed_default_roles.up.sql
└── migrate.go
```

## 种子数据

### 默认权限
- `user:read` - 查看用户
- `user:write` - 编辑用户
- `user:delete` - 删除用户
- `department:read` - 查看部门
- `department:write` - 编辑部门
- `tenant:manage` - 管理租户

### 默认角色
- `super_admin` - 超级管理员（全部权限）
- `admin` - 管理员（用户、部门管理）
- `manager` - 部门经理（部门内管理）
- `employee` - 普通员工（基础权限）

### 默认管理员
- 初始化阶段创建默认管理员账号
- 密码通过环境变量或一次性初始化口令注入

## 文件清单

| 文件 | 说明 |
|------|------|
| `internal/model/tenant.go` | 租户模型 |
| `internal/model/user.go` | 用户模型 |
| `internal/model/role.go` | 角色模型 |
| `internal/model/permission.go` | 权限模型 |
| `internal/model/department.go` | 部门模型 |
| `internal/model/session.go` | 会话模型 |
| `migrations/001_init_schema.up.sql` | 初始化迁移 |
| `migrations/002_seed_permissions.up.sql` | 权限种子 |
| `migrations/003_seed_default_roles.up.sql` | 角色种子 |
| `scripts/migrate.sh` | 迁移脚本 |
