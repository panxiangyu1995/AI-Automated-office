## Why

As a 系统管理员，我需要 敏感数据加密存储和访问控制增强，以便 系统安全性满足企业级要求。这是 Epic 10 的关键功能点。

## What Changes

- 敏感字段（密码、手机号、身份证号等）使用 AES-256 加密存储
- GET /api/v1/security/settings 返回安全配置
- PATCH /api/v1/security/settings 更新安全配置（密码策略、会话超时）
- IP 白名单启用时，非白名单 IP 访问 API 返回 403

## Capabilities

### New Capabilities
- `security-encryption-enhancement`: 安全增强与数据加密的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
