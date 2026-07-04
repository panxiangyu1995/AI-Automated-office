## ADDED Requirements

### Requirement: 付款记录管理

As a 财务人员，I want 创建和管理付款记录，So that 可以追踪向供应商的付款情况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/payment-payables 创建付款记录

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/payment-payables?purchase_order_id={id}&status=pending 返回匹配的付款记录列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/payment-payables/{id}/confirm 确认付款，更新采购订单已付金额

