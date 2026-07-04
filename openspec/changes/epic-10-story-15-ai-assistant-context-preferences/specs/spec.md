## ADDED Requirements

### Requirement: AI 助手上下文与偏好

As a Agent，I want AI 助手记住对话上下文和用户偏好，So that 多轮对话可以连贯进行。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 用户有多轮对话时，AI 助手结合历史上下文生成回复

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/assistant/preferences 更新企业级 AI 助手偏好设置

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/assistant/sessions/{id} 清除指定会话的上下文数据

