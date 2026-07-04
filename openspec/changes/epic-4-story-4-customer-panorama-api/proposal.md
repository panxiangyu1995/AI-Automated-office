## Why

As a Agent，我需要 通过一个 API 获取客户的全景数据，以便 可以为用户生成完整的客户画像。这是 Epic 4 的关键功能点。

## What Changes

- GET /api/v1/customers/{customer_id}/panorama 一次性返回该客户的所有关联数据：联系人列表、商机列表、关联合同列表、关联售后工单列表、往来款汇总

## Capabilities

### New Capabilities
- `customer-panorama-api`: 客户全景视图 API的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
