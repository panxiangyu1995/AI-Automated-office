## Why

As a 企业管理员，我需要 定义和管理岗位（职位），以便 员工档案可以关联岗位，新员工可以通过 Agent 查询岗位职责。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/positions 创建岗位定义
- GET /api/v1/positions 返回所有岗位列表
- PUT /api/v1/positions/{position_id} 更新岗位信息

## Capabilities

### New Capabilities
- `position-management`: 岗位定义与管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
