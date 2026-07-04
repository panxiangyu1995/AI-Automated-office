## Why

As a 企业管理员，我需要 查看用量和账单，以便 可以了解费用明细。这是 Epic 9 的关键功能点。

## What Changes

- GET /api/v1/billing/usage?period=2026-06 返回当月用量明细（API 调用量、存储用量、用户数）
- GET /api/v1/billing/invoices 返回账单列表（周期、金额、状态）
- GET /api/v1/billing/invoices/{id} 返回账单详情（含用量明细和费用计算）

## Capabilities

### New Capabilities
- `usage-billing-invoice`: 用量计费与账单的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
