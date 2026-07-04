## Why

As a 系统开发者，我需要 所有 API 请求经过 JWT 认证和 RBAC 权限验证，以便 无权限的请求被拦截并返回 403。这是 Epic 1 的关键功能点。

## What Changes

- 未携带 Authorization 头的请求返回 401 Unauthorized
- Token 中角色无权访问时返回 403 Forbidden，错误码 AUTH_PERMISSION_DENIED
- 定义 5 种角色：Operator、Owner、Admin、Manager、Employee
- 各角色只能访问其权限范围内的 API

## Capabilities

### New Capabilities
- `jwt-rbac-middleware`: JWT 认证中间件与 RBAC 权限控制的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
