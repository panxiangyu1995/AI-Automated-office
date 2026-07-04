## Why

As a 企业管理员，我需要 对客户进行分级（VIP/重要/普通/潜在）并自定义分级规则，以便 可以差异化服务不同级别的客户。这是 Epic 4 的关键功能点。

## What Changes

- POST /api/v1/customer-levels 创建自定义客户分级
- 系统配置自动升级规则，客户达到阈值时自动升级到对应级别
- PUT /api/v1/customers/{customer_id}/level 手动调整客户分级

## Capabilities

### New Capabilities
- `customer-level-management`: 客户分级管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
