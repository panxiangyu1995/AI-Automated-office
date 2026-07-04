## Why

As a 系统管理员，我需要 系统能够自动管理 PostgreSQL Schema 实现多租户数据隔离，以便 不同企业的数据完全隔离，互不可见。这是 Epic 1 的关键功能点。

## What Changes

- 创建新企业时，系统自动创建该企业专属的 PostgreSQL Schema（如 tenant_{uuid}）
- Schema 包含所有业务表的初始结构
- Schema 创建失败时返回明确错误码
- API 请求携带企业上下文时，所有 SQL 自动路由到对应企业的 Schema
- 任何查询无法跨越企业 Schema 边界

## Capabilities

### New Capabilities
- `multi-tenant-schema`: 数据库连接与多租户 Schema 管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
