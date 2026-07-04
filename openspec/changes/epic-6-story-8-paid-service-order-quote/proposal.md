## Why

As a 售后人员，我需要 为收费工单上传报价单并等待客户确认，以便 收费售后需要客户确认后才进入维修。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/service-orders/{order_id}/quote 上传报价单附件，工单状态变为'报价中'
- POST /api/v1/service-orders/{order_id}/confirm-quote 客户确认报价后，工单状态变为'确认'，可进入维修

## Capabilities

### New Capabilities
- `paid-service-order-quote`: 收费工单报价流程的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
