# Backup 备份模块

Base: `/api/v1`
需要 `backup` 特性开关启用 + `system:backup` 权限（operator, owner）。

## Backup Configs（备份配置）

### POST /backup/configs
创建备份配置。
- **Body**: `{ "backup_time": "string", "backup_directory?": "string", "retention_days?": "int", "enabled?": "bool" }`

### GET /backup/configs
列出备份配置。

### GET /backup/configs/:id
获取备份配置详情。

### PUT /backup/configs/:id
更新备份配置。
- **Body**: `{ "backup_time?", "backup_directory?", "retention_days?", "enabled?" }`

### DELETE /backup/configs/:id
删除备份配置。

## Backup Records（备份记录）

### GET /backup/records
列出备份记录（分页）。
- **Query**: `?page=1&page_size=20`

### POST /backup/trigger
手动触发备份。

### POST /backup/restore/:record_id
从备份记录恢复。
- **⚠️ 危险操作**：恢复会覆盖现有数据，执行前必须向用户确认。
