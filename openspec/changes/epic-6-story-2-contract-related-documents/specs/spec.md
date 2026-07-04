## ADDED Requirements

### Requirement: 合同关联业务单据

As a 销售人员，I want 合同关联客户、销售订单、采购订单和出库记录，So that 可以追踪合同相关的所有业务数据。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/contracts/{contract_id}/sales-orders 合同关联一个或多个销售订单

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/contracts/{contract_id}/purchase-orders 合同关联采购订单（客户付款后关联）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/contracts/{contract_id}/delivery-records 合同绑定出库记录

