## ADDED Requirements

### Requirement: 运营仪表盘

As a 运营商，I want 查看平台运营数据仪表盘，So that 可以掌握平台整体运营状况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/dashboard 返回平台核心指标（企业总数、活跃企业数、用户总数、本月新增、收入汇总）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/dashboard/trends?period=30d 返回趋势数据（日活企业、日活用户、日收入）

