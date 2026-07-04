## ADDED Requirements

### Requirement: Webhook 注册与触发

As a 企业管理员，I want 配置 Webhook 接收业务事件通知，So that 可以与外部系统实时集成。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/webhooks 注册 Webhook（URL、事件类型列表、密钥）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 业务事件触发时向已注册的 Webhook URL 发送 POST 请求（含事件数据和签名）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Webhook 调用失败时按重试策略重试（最多3次，指数退避），记录调用日志

