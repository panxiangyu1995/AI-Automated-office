## ADDED Requirements

### Requirement: 客户关联查询（合同/售后/往来款）

As a 销售人员，I want 查询客户关联的合同、售后工单和往来款，So that 可以全面了解客户业务状况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customers/{customer_id}/contracts 返回该客户的合同列表，支持按状态筛选

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customers/{customer_id}/service-orders 返回售后工单列表，支持按状态筛选

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customers/{customer_id}/financial-summary 返回往来款汇总

