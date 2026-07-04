## Why

As a Agent，我需要 调用 Skill 并获取执行结果，以便 可以通过 Skill 完成业务操作。这是 Epic 8 的关键功能点。

## What Changes

- POST /api/v1/skills/{skill_name}/execute 携带参数，执行 Skill 对应的 API 调用，返回执行结果
- Skill 参数不合法时返回结构化错误码 SKILL_INVALID_PARAMETER
- Agent 无 Skill 调用权限时返回 403 权限不足

## Capabilities

### New Capabilities
- `skill-execution-results`: Skill 执行与结果的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
