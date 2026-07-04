## Why

As a 运营商，我需要 管理企业的 API 调用配额和功能模块开关，以便 可以防止滥用并控制企业可用功能。这是 Epic 1 的关键功能点。

## What Changes

- 企业 API 调用量达到配额限制时返回 429 Too Many Requests，错误码 AUTH_QUOTA_EXCEEDED
- 配额按周期自动重置
- 运营商关闭某企业的功能模块后，该企业用户访问该模块 API 返回 403，错误码 AUTH_FEATURE_DISABLED

## Capabilities

### New Capabilities
- `api-quota-feature-flags`: API 配额管理与功能开关的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
