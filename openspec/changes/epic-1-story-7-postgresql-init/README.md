# PostgreSQL数据库初始化

**Story 1.7** | Epic 1 - 基础设施与桌面端框架

## 概述

初始化云端数据库并创建核心表结构，为用户认证、租户管理、数据同步提供数据存储。

## 铁律映射

| 铁律文档 | 映射内容 |
|----------|----------|
| **PRD** | FR27-FR30 用户权限, FR34-FR36 租户管理 |
| **架构** | ADR-005 多租户Schema隔离, ADR-024 数据库设计 |
| **UX** | 无直接映射（后端基础设施） |
| **Epic** | Epic 1, Story 1.7 |

## 验收标准

- [ ] 核心表创建完成（tenants, users, roles, permissions, departments, sessions）
- [ ] 数据库迁移版本管理
- [ ] 多租户Schema隔离实现
- [ ] 种子数据脚本可执行

## 依赖关系

```
Story 1.6 (Go后端初始化)
    ↓
Story 1.7 (PostgreSQL初始化)
    ↓
Story 1.11 (用户登录)
```

## 数据库架构

### 多租户隔离方案

采用 Schema 级隔离：
- `public` Schema: 存放租户表、用户表等公共数据
- `{tenant_id}` Schema: 每个租户独立的业务数据

### 核心表结构

| 表名 | 说明 |
|------|------|
| `tenants` | 租户信息 |
| `users` | 用户信息 |
| `roles` | 角色定义 |
| `permissions` | 权限定义 |
| `user_roles` | 用户-角色关联 |
| `role_permissions` | 角色-权限关联 |
| `departments` | 部门结构 |
| `sessions` | 登录会话 |

## 相关文档

- [proposal.md](./proposal.md) - 变更提案
- [design.md](./design.md) - 技术设计
- [tasks.md](./tasks.md) - 任务列表
- [specs/spec.md](./specs/spec.md) - 验收规格
