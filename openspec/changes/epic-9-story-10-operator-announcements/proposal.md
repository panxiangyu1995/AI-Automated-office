## Why

As a 运营商，我需要 发布平台公告和通知，以便 企业用户可以了解平台动态和维护信息。这是 Epic 9 的关键功能点。

## What Changes

- POST /api/v1/operator/announcements 发布平台公告
- GET /api/v1/announcements 返回当前生效的公告列表
- PATCH /api/v1/operator/announcements/{id}/revoke 撤回公告

## Capabilities

### New Capabilities
- `operator-announcements`: 运营通知与公告的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
