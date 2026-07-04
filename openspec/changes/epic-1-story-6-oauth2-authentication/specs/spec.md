## ADDED Requirements

### Requirement: OAuth 2.0 认证（登录/刷新/登出）

As a 用户，I want 通过 OAuth 2.0 流程登录系统、刷新令牌和登出，So that 我可以安全地访问系统 API。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/auth/login 返回 Access Token（JWT，1小时）和 Refresh Token（30天）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Access Token 包含 user_id、enterprise_id、role 等声明

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/auth/refresh 返回新的 Access Token 和 Refresh Token，旧 Refresh Token 失效

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/auth/logout 使当前 Token 均失效，后续请求返回 401

