## Why

As a 企业用户，我需要 批量标记消息已读和归档消息，以便 可以高效管理消息。这是 Epic 8 的关键功能点。

## What Changes

- POST /api/v1/messages/batch-ack 批量标记消息为已读
- POST /api/v1/messages/{id}/archive 归档消息（从收件箱移到归档箱）
- GET /api/v1/messages/archived 返回已归档消息列表

## Capabilities

### New Capabilities
- `message-read-archive`: 消息已读与归档的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
