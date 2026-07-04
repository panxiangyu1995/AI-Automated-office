## Why

As a 企业管理员，我需要 查询和导出审计日志，以便 可以追溯所有系统操作。这是 Epic 10 的关键功能点。

## What Changes

- GET /api/v1/audit-log?user_id={id}&action=update&start_date=2026-01-01 返回审计日志列表
- GET /api/v1/audit-log/{id} 返回审计日志详情（操作前后数据差异）
- GET /api/v1/audit-log/export?format=csv&start_date=2026-01-01 导出审计日志为 CSV 格式

## Capabilities

### New Capabilities
- `audit-log-query-export`: 审计日志查询与导出的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
