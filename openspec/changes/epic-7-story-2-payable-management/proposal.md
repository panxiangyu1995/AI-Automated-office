## Why

As a 财务人员，我需要 创建和管理付款记录，以便 可以追踪向供应商的付款情况。这是 Epic 7 的关键功能点。

## What Changes

- POST /api/v1/payment-payables 创建付款记录
- GET /api/v1/payment-payables?purchase_order_id={id}&status=pending 返回匹配的付款记录列表
- PATCH /api/v1/payment-payables/{id}/confirm 确认付款，更新采购订单已付金额

## Capabilities

### New Capabilities
- `payable-management`: 付款记录管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
