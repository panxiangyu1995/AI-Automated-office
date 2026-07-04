## ADDED Requirements

### Requirement: 安全增强与数据加密

As a 系统管理员，I want 敏感数据加密存储和访问控制增强，So that 系统安全性满足企业级要求。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 敏感字段（密码、手机号、身份证号等）使用 AES-256 加密存储

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/security/settings 返回安全配置

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/security/settings 更新安全配置（密码策略、会话超时）

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** IP 白名单启用时，非白名单 IP 访问 API 返回 403

