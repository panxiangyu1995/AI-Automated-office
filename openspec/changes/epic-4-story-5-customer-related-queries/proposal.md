## Why

As a 销售人员，我需要 查询客户关联的合同、售后工单和往来款，以便 可以全面了解客户业务状况。这是 Epic 4 的关键功能点。

## What Changes

- GET /api/v1/customers/{customer_id}/contracts 返回该客户的合同列表，支持按状态筛选
- GET /api/v1/customers/{customer_id}/service-orders 返回售后工单列表，支持按状态筛选
- GET /api/v1/customers/{customer_id}/financial-summary 返回往来款汇总

## Capabilities

### New Capabilities
- `customer-related-queries`: 客户关联查询（合同/售后/往来款）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
