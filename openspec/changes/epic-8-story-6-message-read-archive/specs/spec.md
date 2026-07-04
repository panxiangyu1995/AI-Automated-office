## ADDED Requirements

### Requirement: 消息已读与归档

As a 企业用户，I want 批量标记消息已读和归档消息，So that 可以高效管理消息。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/messages/batch-ack 批量标记消息为已读

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/messages/{id}/archive 归档消息（从收件箱移到归档箱）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/messages/archived 返回已归档消息列表

