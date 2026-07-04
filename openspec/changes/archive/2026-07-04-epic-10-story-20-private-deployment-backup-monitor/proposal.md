## Why

As a 运维人员，我需要 执行私有化环境的数据备份恢复和系统监控，以便 可以保障私有化环境的数据安全和稳定运行。这是 Epic 10 的关键功能点。

## What Changes

- 执行 ./scripts/backup.sh 备份 PostgreSQL 数据、Redis RDB、Qdrant 快照
- 执行 ./scripts/restore.sh --backup-dir=/backups/2026-07-04 从备份恢复所有数据
- GET /api/v1/system/metrics 返回 Prometheus 兼容的系统指标

## Capabilities

### New Capabilities
- `private-deployment-backup-monitor`: 私有化备份恢复与监控的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
