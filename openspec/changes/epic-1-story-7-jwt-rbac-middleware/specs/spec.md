## ADDED Requirements

### Requirement: JWT 认证中间件与 RBAC 权限控制

As a 系统开发者，I want 所有 API 请求经过 JWT 认证和 RBAC 权限验证，So that 无权限的请求被拦截并返回 403。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 未携带 Authorization 头的请求返回 401 Unauthorized

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Token 中角色无权访问时返回 403 Forbidden，错误码 AUTH_PERMISSION_DENIED

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 定义 5 种角色：Operator、Owner、Admin、Manager、Employee

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 各角色只能访问其权限范围内的 API

