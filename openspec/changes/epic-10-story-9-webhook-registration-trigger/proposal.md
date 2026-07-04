## Why

As a 企业管理员，我需要 配置 Webhook 接收业务事件通知，以便 可以与外部系统实时集成。这是 Epic 10 的关键功能点。

## What Changes

- POST /api/v1/webhooks 注册 Webhook（URL、事件类型列表、密钥）
- 业务事件触发时向已注册的 Webhook URL 发送 POST 请求（含事件数据和签名）
- Webhook 调用失败时按重试策略重试（最多3次，指数退避），记录调用日志

## Capabilities

### New Capabilities
- `webhook-registration-trigger`: Webhook 注册与触发的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
