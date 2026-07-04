## Why

As a 销售人员，我需要 创建销售订单并执行出库，以便 可以完成销售发货流程。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/sales-orders 创建销售订单
- POST /api/v1/sales-orders/{order_id}/stock-out 自动扣减对应仓库的库存，生成出库流水记录
- 库存不足时禁止出库，返回错误码 IMS_INSUFFICIENT_STOCK

## Capabilities

### New Capabilities
- `sales-order-stock-out`: 销售出库与库存扣减的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
