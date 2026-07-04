## Why

As a 运营商客服，我需要 创建和管理客户服务工单，以便 可以处理企业客户的服务请求。这是 Epic 9 的关键功能点。

## What Changes

- POST /api/v1/operator/service-tickets 创建客服工单
- PATCH /api/v1/operator/service-tickets/{id}/status 状态流转：待处理→处理中→已解决→已关闭
- GET /api/v1/operator/service-tickets?status=open&priority=high 按状态和优先级筛选工单列表

## Capabilities

### New Capabilities
- `customer-service-tickets`: 客户服务工单的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
