## Why

As a 财务人员，我需要 创建和管理收款记录，以便 可以追踪客户付款情况。这是 Epic 7 的关键功能点。

## What Changes

- POST /api/v1/payment-receivables 创建收款记录
- GET /api/v1/payment-receivables?contract_id={id}&status=pending 返回匹配的收款记录列表
- PATCH /api/v1/payment-receivables/{id}/confirm 确认收款，更新合同已收金额

## Capabilities

### New Capabilities
- `receivable-management`: 收款记录管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
