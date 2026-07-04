## Why

As a 销售人员，我需要 销售订单绑定合同和出库记录，以便 可以追踪订单关联的合同和发货情况。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/sales-orders/{order_id}/contract 销售订单绑定合同
- POST /api/v1/sales-orders/{order_id}/delivery 创建出库记录，出库配件/产品必须与关联合同一致
- 销售订单审批流与合同审批流可独立运行

## Capabilities

### New Capabilities
- `sales-order-contract-delivery`: 销售订单关联合同与出库的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
