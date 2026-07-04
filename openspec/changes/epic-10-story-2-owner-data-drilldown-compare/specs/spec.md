## ADDED Requirements

### Requirement: 老板数据穿透与对比

As a 老板，I want 穿透查看报表背后的明细数据并进行跨期对比，So that 可以从宏观到微观理解经营状况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/owner-drilldown?metric=revenue&period=2026-Q2 返回指标穿透明细（从季度→月→周→单据）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/owner-compare?metric=revenue&periods=2026-Q1,2026-Q2 返回跨期对比数据

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/owner-ranking?type=department&metric=revenue 返回部门排名数据

