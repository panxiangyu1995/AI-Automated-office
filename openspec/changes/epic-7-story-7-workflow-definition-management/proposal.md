## Why

As a 企业管理员，我需要 定义和管理审批流程模板，以便 不同业务场景可以配置不同的审批规则。这是 Epic 7 的关键功能点。

## What Changes

- POST /api/v1/workflow-definitions 创建审批流程定义
- PUT /api/v1/workflow-definitions/{id} 更新审批流程定义（已生效的流程不可修改，需创建新版本）
- GET /api/v1/workflow-definitions?type=contract 按业务类型查询审批流程定义列表

## Capabilities

### New Capabilities
- `workflow-definition-management`: 审批流程定义与管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
