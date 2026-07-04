## ADDED Requirements

### Requirement: Webhook 管理与日志

As a 企业管理员，I want 管理 Webhook 配置和查看调用日志，So that 可以监控和调试 Webhook 集成。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/webhooks 返回 Webhook 列表

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/webhooks/{id} 更新 Webhook 配置

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/webhooks/{id}/logs 返回 Webhook 调用日志

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/webhooks/{id}/test 发送测试事件到 Webhook URL

