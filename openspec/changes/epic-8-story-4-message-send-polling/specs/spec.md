## ADDED Requirements

### Requirement: 消息发送与轮询

As a Agent，I want 通过消息轮询获取待处理消息，So that Agent 可以实时接收系统通知和任务。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/messages/poll 返回未读消息列表（审批通知、任务分配、系统公告等）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** CLI 每 60 秒轮询一次时返回增量消息（上次轮询后的新消息）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/messages/{id}/ack 标记消息为已读

