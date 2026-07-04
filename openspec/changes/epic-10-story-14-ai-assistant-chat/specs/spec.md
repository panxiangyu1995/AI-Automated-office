## ADDED Requirements

### Requirement: AI 助手对话

As a Agent，I want 通过 AI 助手获取业务操作建议，So that Agent 可以更智能地辅助用户完成业务操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/assistant/chat 携带用户问题和上下文，AI 助手返回操作建议

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** AI 助手需要执行操作时返回操作建议及对应 Skill 调用参数

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** AI 助手回答无法确定时返回免责声明并建议咨询人工

