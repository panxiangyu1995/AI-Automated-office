## Why

As a 管理员，我需要 配置自动定时数据库备份，以便 数据可以在故障时恢复。这是 Epic 1 的关键功能点。

## What Changes

- 管理员配置备份策略（每日备份时间），到达时间自动执行 pg_dump 备份指定企业 Schema
- 备份文件存储在配置的目录
- 管理员触发手动恢复时，选择备份文件恢复该企业 Schema，不影响其他企业数据

## Capabilities

### New Capabilities
- `auto-backup`: 自动定时备份的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
