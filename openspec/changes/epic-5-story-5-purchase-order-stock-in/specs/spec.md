## ADDED Requirements

### Requirement: 采购订单与入库

As a 采购人员，I want 创建采购订单、审批、入库，So that 可以完成采购流程并增加库存。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/purchase-orders 创建采购订单（草稿状态）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/purchase-orders/{order_id}/stock-in 自动增加对应仓库的库存，生成入库流水记录

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 在数据库事务中保证库存和流水的一致性

