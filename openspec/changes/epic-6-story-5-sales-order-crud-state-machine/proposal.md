## Why

As a 销售人员，我需要 创建、编辑、删除销售订单并管理状态流转，以便 可以管理销售流程。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/sales-orders 创建销售订单（草稿状态），必须关联客户
- 状态按规则流转：草稿→审批中→已确认→已出库→已完成
- DELETE /api/v1/sales-orders/{order_id} 仅草稿状态可删除（软删除）

## Capabilities

### New Capabilities
- `sales-order-crud-state-machine`: 销售订单 CRUD 与状态机的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
