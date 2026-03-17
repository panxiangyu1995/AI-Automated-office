# Tasks: PostgreSQL数据库初始化 (Story 1.7)

> **依赖**: Story 1.6 (Go云端后端)

## 任务列表

### 任务 1: 创建数据库连接模块
- **描述**: 创建 PostgreSQL 连接池配置
- **文件**: `pkg/database/postgres.go`
- **验收**: 连接池配置完成，支持连接测试

### 任务 2: 创建租户表 (tenants)
- **描述**: 创建租户模型和迁移脚本
- **文件**: `internal/model/tenant.go`, `migrations/001_init_schema.up.sql`
- **验收**: 表创建成功，索引正常

### 任务 3: 创建用户表 (users)
- **描述**: 创建用户模型，包含密码哈希字段
- **文件**: `internal/model/user.go`
- **验收**: 用户表创建，邮箱唯一约束生效

### 任务 4: 创建角色权限表
- **描述**: 创建 roles, permissions, user_roles, role_permissions 表
- **文件**: `internal/model/role.go`, `internal/model/permission.go`
- **验收**: 多对多关系正确建立

### 任务 5: 创建部门表 (departments)
- **描述**: 创建部门模型，支持层级结构
- **文件**: `internal/model/department.go`
- **验收**: 自引用外键正确，层级查询可用

### 任务 6: 创建会话表 (sessions)
- **描述**: 创建会话模型，支持 Token 管理
- **文件**: `internal/model/session.go`
- **验收**: 会话表创建，过期时间索引

### 任务 7: 实现数据库迁移管理
- **描述**: 集成 golang-migrate 或 GORM 迁移
- **文件**: `migrations/migrate.go`, `scripts/migrate.sh`
- **验收**: 迁移可执行，支持回滚

### 任务 8: 实现多租户 Schema 隔离
- **描述**: 实现租户 Schema 动态创建
- **文件**: `pkg/database/tenant.go`
- **验收**: 新租户自动创建独立 Schema

### 任务 9: 创建种子数据脚本
- **描述**: 创建默认权限、角色和管理员账号
- **文件**: `migrations/002_seed_permissions.up.sql`, `migrations/003_seed_default_roles.up.sql`
- **验收**: 种子数据正确插入

## 执行顺序

1. 任务 1（数据库连接）
2. 任务 2-6（表结构）
3. 任务 7（迁移管理）
4. 任务 8（多租户隔离）
5. 任务 9（种子数据）

## 测试要点

- [x] 数据库连接成功
- [x] 所有表创建正确
- [x] 外键约束生效
- [x] 索引创建正确
- [x] 迁移脚本可执行
- [x] 多租户 Schema 隔离生效
- [x] 种子数据正确
