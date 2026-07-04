## Why

As a 企业管理员，我需要 查看数据备份记录和恢复操作日志，以便 可以确保数据安全合规。这是 Epic 10 的关键功能点。

## What Changes

- GET /api/v1/audit-backup 返回备份记录列表（备份时间、大小、状态）
- GET /api/v1/audit-restore 返回恢复操作日志（恢复时间、操作人、恢复范围）

## Capabilities

### New Capabilities
- `data-backup-restore-audit`: 数据备份与恢复审计的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
