## Why

As a 集团老板或企业管理员，我需要 为员工开通跨企业访问权限，以便 核心员工可以访问多个企业的数据。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/cross-enterprise/permissions 为员工开通跨企业权限
- PUT /api/v1/cross-enterprise/permissions/{permission_id} 调整跨企业员工的可访问数据范围
- 拥有跨企业权限的员工只能访问被授权范围内的数据，所有操作记录审计日志

## Capabilities

### New Capabilities
- `cross-enterprise-permissions`: 跨企业权限管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
