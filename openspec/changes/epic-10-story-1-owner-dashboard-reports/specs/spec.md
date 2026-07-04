## ADDED Requirements

### Requirement: 老板驾驶舱报表

As a 老板，I want 查看企业经营数据驾驶舱，So that 可以一目了然掌握企业核心经营指标。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/owner-dashboard 返回驾驶舱数据（营收趋势、合同金额、回款率、员工效率、客户增长）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/owner-dashboard?period=quarter 按月/季/年维度切换报表数据

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/reports/owner-dashboard?enterprise_id=all 返回跨企业汇总数据

