## Why

As a 企业管理员，我需要 设置部门经理并赋予部门级管理权限，以便 部门经理可以管理本部门员工和业务。这是 Epic 2 的关键功能点。

## What Changes

- PUT /api/v1/departments/{department_id}/manager 指定员工 ID 成为部门经理，获得 Manager 角色
- 部门经理可以编辑本部门信息，禁止修改其他部门信息

## Capabilities

### New Capabilities
- `department-manager`: 部门经理设置与权限的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
