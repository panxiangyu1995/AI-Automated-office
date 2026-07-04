## ADDED Requirements

### Requirement: 自定义报表与导出

As a 企业管理员，I want 创建自定义报表并导出数据，So that 可以按需分析业务数据。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/reports/custom 创建自定义报表定义

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/custom/{id}/run 执行报表查询并返回结果

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/custom/{id}/export?format=csv 导出报表数据为 CSV/Excel 格式

