## Why

As a 采购人员，我需要 创建采购订单、审批、入库，以便 可以完成采购流程并增加库存。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/purchase-orders 创建采购订单（草稿状态）
- POST /api/v1/purchase-orders/{order_id}/stock-in 自动增加对应仓库的库存，生成入库流水记录
- 在数据库事务中保证库存和流水的一致性

## Capabilities

### New Capabilities
- `purchase-order-stock-in`: 采购订单与入库的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
