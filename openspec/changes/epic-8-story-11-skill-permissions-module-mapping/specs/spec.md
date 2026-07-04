## ADDED Requirements

### Requirement: Skill 权限与模块映射

As a 企业管理员，I want 控制 Skill 的访问权限和模块映射，So that 不同角色的 Agent 只能调用授权范围内的 Skill。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/skills/{skill_name}/permissions 配置 Skill 的可访问角色

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/skills?module=hrm 返回 HRM 模块下的所有 Skill

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 功能开关关闭某模块时返回错误码 SKILL_MODULE_DISABLED

