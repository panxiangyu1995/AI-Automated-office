## Why

As a 售后人员，我需要 生成维修工单并完成客户签字确认，以便 维修过程和结果有据可查。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/service-orders/{order_id}/repair-order 携带故障点、维修内容，生成维修工单
- POST /api/v1/service-orders/{order_id}/sign-off 上传客户签字确认件，工单状态变为'待签字'
- POST /api/v1/service-orders/{order_id}/complete 工单状态变为'已完成'

## Capabilities

### New Capabilities
- `repair-order-sign-off`: 维修工单与签字确认的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
