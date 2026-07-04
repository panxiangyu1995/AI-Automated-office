## Why

As a 运营商，我需要 查看平台级审计日志和操作记录，以便 可以追踪平台上的所有管理操作。这是 Epic 9 的关键功能点。

## What Changes

- GET /api/v1/operator/audit-log 返回平台审计日志（租户创建/暂停/恢复/注销、套餐变更等）
- GET /api/v1/operator/enterprises/{id}/activity 返回指定企业的活动日志（API 调用量、活跃用户数、存储用量）

## Capabilities

### New Capabilities
- `operator-audit-log`: 运营审计与日志的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
