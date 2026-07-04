## Why

As a Agent，我需要 AI 助手记住对话上下文和用户偏好，以便 多轮对话可以连贯进行。这是 Epic 10 的关键功能点。

## What Changes

- 用户有多轮对话时，AI 助手结合历史上下文生成回复
- PATCH /api/v1/assistant/preferences 更新企业级 AI 助手偏好设置
- DELETE /api/v1/assistant/sessions/{id} 清除指定会话的上下文数据

## Capabilities

### New Capabilities
- `ai-assistant-context-preferences`: AI 助手上下文与偏好的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
