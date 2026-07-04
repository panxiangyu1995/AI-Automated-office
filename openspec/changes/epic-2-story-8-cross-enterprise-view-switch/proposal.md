## Why

As a 集团老板，我需要 在不同企业之间切换视角，以便 可以查看和管理不同企业的数据。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/auth/switch-enterprise 携带目标企业 ID，返回该企业的新 Access Token
- 老板切换到企业 A 后查询员工列表，只返回企业 A 的员工

## Capabilities

### New Capabilities
- `cross-enterprise-view-switch`: 老板跨企业视角切换的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
