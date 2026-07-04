## ADDED Requirements

### Requirement: 收款记录管理

As a 财务人员，I want 创建和管理收款记录，So that 可以追踪客户付款情况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/payment-receivables 创建收款记录

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/payment-receivables?contract_id={id}&status=pending 返回匹配的收款记录列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/payment-receivables/{id}/confirm 确认收款，更新合同已收金额

