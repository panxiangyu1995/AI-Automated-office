## Why

As a Agent，我需要 通过 AI 助手获取业务操作建议，以便 Agent 可以更智能地辅助用户完成业务操作。这是 Epic 10 的关键功能点。

## What Changes

- POST /api/v1/assistant/chat 携带用户问题和上下文，AI 助手返回操作建议
- AI 助手需要执行操作时返回操作建议及对应 Skill 调用参数
- AI 助手回答无法确定时返回免责声明并建议咨询人工

## Capabilities

### New Capabilities
- `ai-assistant-chat`: AI 助手对话的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
