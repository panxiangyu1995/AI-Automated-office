## Why

As a 用户，我需要 通过 OAuth 2.0 流程登录系统、刷新令牌和登出，以便 我可以安全地访问系统 API。这是 Epic 1 的关键功能点。

## What Changes

- POST /api/v1/auth/login 返回 Access Token（JWT，1小时）和 Refresh Token（30天）
- Access Token 包含 user_id、enterprise_id、role 等声明
- POST /api/v1/auth/refresh 返回新的 Access Token 和 Refresh Token，旧 Refresh Token 失效
- POST /api/v1/auth/logout 使当前 Token 均失效，后续请求返回 401

## Capabilities

### New Capabilities
- `oauth2-authentication`: OAuth 2.0 认证（登录/刷新/登出）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
