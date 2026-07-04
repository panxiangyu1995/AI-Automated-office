## Why

As a 运营商，我需要 定义和管理订阅套餐，以便 企业可以选择不同的服务等级。这是 Epic 9 的关键功能点。

## What Changes

- POST /api/v1/operator/plans 创建订阅套餐（名称、价格、功能列表、用户数限制、存储配额）
- PUT /api/v1/operator/plans/{id} 更新套餐定义（已订阅的套餐不可删除，只能创建新版本）
- GET /api/v1/operator/plans 返回所有套餐列表

## Capabilities

### New Capabilities
- `subscription-plan-definition`: 订阅套餐定义的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
