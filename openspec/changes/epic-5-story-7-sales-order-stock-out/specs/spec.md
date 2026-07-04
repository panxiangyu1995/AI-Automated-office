## ADDED Requirements

### Requirement: 销售出库与库存扣减

As a 销售人员，I want 创建销售订单并执行出库，So that 可以完成销售发货流程。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/sales-orders 创建销售订单

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/sales-orders/{order_id}/stock-out 自动扣减对应仓库的库存，生成出库流水记录

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 库存不足时禁止出库，返回错误码 IMS_INSUFFICIENT_STOCK

