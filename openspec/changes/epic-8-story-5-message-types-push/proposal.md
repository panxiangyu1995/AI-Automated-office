## Why

As a 系统管理员，我需要 配置消息类型和推送规则，以便 不同业务事件触发不同类型的消息通知。这是 Epic 8 的关键功能点。

## What Changes

- 系统产生业务事件（审批待办、合同到期、库存预警等）时自动生成对应类型的消息并推送给相关用户
- GET /api/v1/messages?type=approval&status=unread 按类型和状态筛选消息列表
- GET /api/v1/messages/summary 返回各类型未读消息数量汇总

## Capabilities

### New Capabilities
- `message-types-push`: 消息类型与推送的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
