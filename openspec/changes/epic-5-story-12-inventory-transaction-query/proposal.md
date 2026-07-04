## Why

As a 企业用户，我需要 查询统一的出入库流水，以便 可以追溯所有库存变动。这是 Epic 5 的关键功能点。

## What Changes

- GET /api/v1/inventory-transactions 返回匹配的出入库流水列表，支持按类型、仓库、时间、物料筛选
- GET /api/v1/inventory-transactions/{transaction_id} 返回流水详情（含批次号、效期、序列号、规格参数、源单据类型）

## Capabilities

### New Capabilities
- `inventory-transaction-query`: 统一出入库流水查询的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
