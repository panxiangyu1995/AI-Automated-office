## Why

As a 企业管理员，我需要 通过自助服务管理企业订阅和查看用量，以便 不需要联系运营商就能完成常见操作。这是 Epic 9 的关键功能点。

## What Changes

- GET /api/v1/customer/subscription 返回当前企业订阅信息（套餐、到期日、用量）
- POST /api/v1/customer/subscription/upgrade 升级订阅（立即生效，差价按天计算）
- POST /api/v1/customer/support-tickets 创建客户支持工单
- GET /api/v1/customer/support-tickets 返回本企业的支持工单列表

## Capabilities

### New Capabilities
- `customer-self-service`: 客户自助服务的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
