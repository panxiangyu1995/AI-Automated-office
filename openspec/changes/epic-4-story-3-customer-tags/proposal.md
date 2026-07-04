## Why

As a 销售人员，我需要 为客户添加多个自定义标签，以便 可以灵活分类和筛选客户。这是 Epic 4 的关键功能点。

## What Changes

- POST /api/v1/customers/{customer_id}/tags 为客户添加标签
- GET /api/v1/customers?tags=战略合作 返回包含指定标签的客户列表

## Capabilities

### New Capabilities
- `customer-tags`: 客户自由标签的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
