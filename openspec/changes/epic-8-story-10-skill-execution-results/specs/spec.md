## ADDED Requirements

### Requirement: Skill 执行与结果

As a Agent，I want 调用 Skill 并获取执行结果，So that 可以通过 Skill 完成业务操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/skills/{skill_name}/execute 携带参数，执行 Skill 对应的 API 调用，返回执行结果

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Skill 参数不合法时返回结构化错误码 SKILL_INVALID_PARAMETER

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Agent 无 Skill 调用权限时返回 403 权限不足

