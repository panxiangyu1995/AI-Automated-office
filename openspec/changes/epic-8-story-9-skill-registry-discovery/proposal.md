## Why

As a Agent，我需要 发现和调用系统注册的 Skill，以便 Agent 可以通过 Skill 执行业务操作。这是 Epic 8 的关键功能点。

## What Changes

- GET /api/v1/skills 返回当前企业可用的 Skill 列表（名称、描述、参数定义、API 端点）
- GET /api/v1/skills/{skill_name} 返回 Skill 详情（含参数 Schema、调用示例）
- POST /api/v1/skills 注册新 Skill（name、description、parameters、api_endpoint、module）

## Capabilities

### New Capabilities
- `skill-registry-discovery`: Skill 注册与发现的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
