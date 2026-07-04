## Why

As a 销售人员，我需要 合同关联客户、销售订单、采购订单和出库记录，以便 可以追踪合同相关的所有业务数据。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/contracts/{contract_id}/sales-orders 合同关联一个或多个销售订单
- POST /api/v1/contracts/{contract_id}/purchase-orders 合同关联采购订单（客户付款后关联）
- POST /api/v1/contracts/{contract_id}/delivery-records 合同绑定出库记录

## Capabilities

### New Capabilities
- `contract-related-documents`: 合同关联业务单据的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
