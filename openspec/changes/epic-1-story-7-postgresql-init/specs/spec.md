# Spec: PostgreSQL数据库初始化

## 需求来源

| 来源 | 编号 | 描述 |
|------|------|------|
| PRD | FR27 | 用户登录 |
| PRD | FR28 | 用户管理 |
| PRD | FR29 | 角色管理 |
| PRD | FR30 | 权限管理 |
| PRD | FR34 | 租户管理 |
| PRD | FR35 | 租户配置 |
| PRD | FR36 | 租户数据隔离 |
| 架构 | ADR-005 | 多租户架构 - Schema级隔离 |
| 架构 | ADR-024 | 数据库设计规范 |
| NFR | NFR10 | AES-256 数据加密 |
| NFR | NFR13 | 多租户数据隔离 |

## 验收场景

### 场景 1: 数据库连接

**Given** PostgreSQL 服务已启动
**When** 应用启动并连接数据库
**Then** 连接池正常工作
**And** 可执行简单查询 `SELECT 1`

### 场景 2: 表结构创建

**Given** 数据库连接成功
**When** 执行迁移脚本
**Then** 创建以下表：
- `tenants` - 租户表
- `users` - 用户表
- `roles` - 角色表
- `permissions` - 权限表
- `user_roles` - 用户角色关联表
- `role_permissions` - 角色权限关联表
- `departments` - 部门表
- `sessions` - 会话表

**And** 所有外键约束正确建立
**And** 所有索引创建成功

### 场景 3: 多租户Schema隔离

**Given** 新租户注册
**When** 创建租户记录
**Then** 自动创建租户专属 Schema
**And** Schema 名称与租户 ID 对应

**And** 连接建立后设置 `search_path` 为 `public,{tenant_id}`
**And** 连接归还到连接池前重置 `search_path`

### 场景 4: 种子数据插入

**Given** 表结构已创建
**When** 执行种子数据脚本
**Then** 插入默认权限数据
**And** 插入默认角色数据
**And** 插入默认管理员账号
**And** 管理员初始口令由环境变量或一次性初始化口令提供

### 场景 5: 迁移版本管理

**Given** 存在多个迁移脚本
**When** 执行迁移
**Then** 按版本号顺序执行
**And** 记录已执行的迁移版本
**And** 支持回滚到指定版本

## 数据规格

### 租户表 (tenants)

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',      -- free, basic, pro, enterprise
    max_users INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'active',  -- active, suspended, deleted
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 用户表 (users)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    employee_id VARCHAR(50),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',  -- active, inactive, deleted
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, email)
);
```

### 角色表 (roles)

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);
```

### 权限表 (permissions)

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,  -- create, read, update, delete, manage
    description TEXT
);
```

### 部门表 (departments)

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    parent_id UUID REFERENCES departments(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    manager_id UUID REFERENCES users(id),
    level INTEGER DEFAULT 1,
    path VARCHAR(500),  -- 物化路径，如 /1/2/3
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 会话表 (sessions)

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    device_info JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 数据更新与审计

- `updated_at` 统一由触发器或应用层自动维护
- 软删除记录默认过滤，审计操作保留操作者与来源

### 数据加密

- 敏感字段按需进行应用层加密或列级加密
- 密钥由集中配置管理，不落地在代码仓库

## 默认权限数据

| code | name | resource | action |
|------|------|----------|--------|
| `user:read` | 查看用户 | user | read |
| `user:write` | 编辑用户 | user | update |
| `user:delete` | 删除用户 | user | delete |
| `role:read` | 查看角色 | role | read |
| `role:write` | 编辑角色 | role | update |
| `department:read` | 查看部门 | department | read |
| `department:write` | 编辑部门 | department | update |
| `tenant:manage` | 管理租户 | tenant | manage |
| `plugin:install` | 安装插件 | plugin | create |
| `settings:manage` | 系统设置 | settings | manage |

## 默认角色数据

| code | name | 权限 |
|------|------|------|
| `super_admin` | 超级管理员 | 全部权限 |
| `admin` | 管理员 | user:*, role:read, department:*, settings:manage |
| `manager` | 部门经理 | user:read, department:read |
| `employee` | 普通员工 | user:read (自己) |

## 索引设计

```sql
-- 用户表索引
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 会话表索引
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 部门表索引
CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_path ON departments(path);
```

## 迁移脚本规范

```
migrations/
├── 001_init_schema.up.sql      # 创建表结构
├── 001_init_schema.down.sql    # 回滚表结构
├── 002_seed_permissions.up.sql # 插入权限数据
├── 003_seed_default_roles.up.sql # 插入默认角色
└── migrate.go                  # 迁移执行器
```

命名规范：`{版本号}_{描述}.{up|down}.sql`
