## ADDED Requirements

### Requirement: 审计日志查询与导出

As a 企业管理员，I want 查询和导出审计日志，So that 可以追溯所有系统操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/audit-log?user_id={id}&action=update&start_date=2026-01-01 返回审计日志列表

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/audit-log/{id} 返回审计日志详情（操作前后数据差异）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/audit-log/export?format=csv&start_date=2026-01-01 导出审计日志为 CSV 格式

