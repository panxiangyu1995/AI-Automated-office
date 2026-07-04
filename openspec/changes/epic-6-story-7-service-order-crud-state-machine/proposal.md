## Why

As a 售后人员，我需要 创建、编辑、删除售后工单并管理状态流转，以便 可以管理售后服务流程。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/service-orders 创建售后工单（创建状态）
- 状态流转：创建→报价中→确认→维修中→待签字→已完成
- DELETE /api/v1/service-orders/{order_id} 仅创建状态可删除（软删除）

## Capabilities

### New Capabilities
- `service-order-crud-state-machine`: 售后工单 CRUD 与状态机的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
