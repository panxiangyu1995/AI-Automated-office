## ADDED Requirements

### Requirement: Skill 注册与发现

As a Agent，I want 发现和调用系统注册的 Skill，So that Agent 可以通过 Skill 执行业务操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/skills 返回当前企业可用的 Skill 列表（名称、描述、参数定义、API 端点）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/skills/{skill_name} 返回 Skill 详情（含参数 Schema、调用示例）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/skills 注册新 Skill（name、description、parameters、api_endpoint、module）

