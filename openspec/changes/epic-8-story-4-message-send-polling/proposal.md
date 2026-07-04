## Why

As a Agent，我需要 通过消息轮询获取待处理消息，以便 Agent 可以实时接收系统通知和任务。这是 Epic 8 的关键功能点。

## What Changes

- GET /api/v1/messages/poll 返回未读消息列表（审批通知、任务分配、系统公告等）
- CLI 每 60 秒轮询一次时返回增量消息（上次轮询后的新消息）
- POST /api/v1/messages/{id}/ack 标记消息为已读

## Capabilities

### New Capabilities
- `message-send-polling`: 消息发送与轮询的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
