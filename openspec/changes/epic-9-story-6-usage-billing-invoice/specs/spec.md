## ADDED Requirements

### Requirement: 用量计费与账单

As a 企业管理员，I want 查看用量和账单，So that 可以了解费用明细。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/billing/usage?period=2026-06 返回当月用量明细（API 调用量、存储用量、用户数）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/billing/invoices 返回账单列表（周期、金额、状态）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/billing/invoices/{id} 返回账单详情（含用量明细和费用计算）

