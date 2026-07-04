## Why

As a 销售人员，我需要 查询物料历史报价并设置差异化报价策略，以便 可以为不同客户级别制定不同价格。这是 Epic 5 的关键功能点。

## What Changes

- GET /api/v1/materials/{material_id}/price-history 返回该物料的历史报价记录
- POST /api/v1/materials/{material_id}/pricing-strategies 配置差异化报价策略

## Capabilities

### New Capabilities
- `material-pricing`: 物料报价管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
