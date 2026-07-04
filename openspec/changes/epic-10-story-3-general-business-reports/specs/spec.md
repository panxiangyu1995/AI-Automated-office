## ADDED Requirements

### Requirement: 通用数据报表

As a 企业用户，I want 按模块查看业务数据报表，So that 可以从数据维度分析业务状况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/sales?period=2026-06 返回销售报表

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/inventory?warehouse_id={id} 返回库存报表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/finance?period=2026-06 返回财务报表

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/service?period=2026-06 返回售后报表

