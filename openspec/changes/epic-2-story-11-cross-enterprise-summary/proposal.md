## Why

As a 集团老板，我需要 查看跨企业的经营汇总数据，以便 可以一览集团下所有企业的经营状况。这是 Epic 2 的关键功能点。

## What Changes

- GET /api/v1/groups/{group_id}/summary 返回集团下所有企业的核心经营指标
- 支持按企业对比

## Capabilities

### New Capabilities
- `cross-enterprise-summary`: 跨企业经营汇总的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
