## ADDED Requirements

### Requirement: 运营数据导出与备份

As a 运营商，I want 导出运营数据和执行企业级备份，So that 可以满足合规要求和数据安全。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/data-export 创建数据导出任务，异步执行

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/enterprises/{id}/backup 触发企业 Schema 级备份

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/enterprises/{id}/restore 从备份恢复企业数据

