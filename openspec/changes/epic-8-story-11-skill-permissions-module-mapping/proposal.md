## Why

As a 企业管理员，我需要 控制 Skill 的访问权限和模块映射，以便 不同角色的 Agent 只能调用授权范围内的 Skill。这是 Epic 8 的关键功能点。

## What Changes

- POST /api/v1/skills/{skill_name}/permissions 配置 Skill 的可访问角色
- GET /api/v1/skills?module=hrm 返回 HRM 模块下的所有 Skill
- 功能开关关闭某模块时返回错误码 SKILL_MODULE_DISABLED

## Capabilities

### New Capabilities
- `skill-permissions-module-mapping`: Skill 权限与模块映射的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
