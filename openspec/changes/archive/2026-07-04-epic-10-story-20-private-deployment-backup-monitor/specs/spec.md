## ADDED Requirements

### Requirement: 私有化备份恢复与监控

As a 运维人员，I want 执行私有化环境的数据备份恢复和系统监控，So that 可以保障私有化环境的数据安全和稳定运行。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ./scripts/backup.sh 备份 PostgreSQL 数据、Redis RDB、Qdrant 快照

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ./scripts/restore.sh --backup-dir=/backups/2026-07-04 从备份恢复所有数据

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/system/metrics 返回 Prometheus 兼容的系统指标

