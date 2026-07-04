## Why

As a 管理员，我需要 系统自动记录所有业务操作的审计日志，以便 我可以追溯谁在什么时间做了什么操作。这是 Epic 1 的关键功能点。

## What Changes

- 用户执行任何业务操作时，系统自动记录操作者 ID、时间、类型、目标实体、变更内容
- 可按时间范围、用户、操作类型筛选查询审计日志，支持分页

## Capabilities

### New Capabilities
- `audit-log`: 审计日志（基础操作记录）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
