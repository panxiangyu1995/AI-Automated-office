## ADDED Requirements

### Requirement: 自动定时备份

As a 管理员，I want 配置自动定时数据库备份，So that 数据可以在故障时恢复。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 管理员配置备份策略（每日备份时间），到达时间自动执行 pg_dump 备份指定企业 Schema

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 备份文件存储在配置的目录

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 管理员触发手动恢复时，选择备份文件恢复该企业 Schema，不影响其他企业数据

