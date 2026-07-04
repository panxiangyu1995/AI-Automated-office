## Why

As a 企业管理员，我需要 创建、编辑、删除部门并查询组织架构树，以便 可以建立符合企业实际的组织结构。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/enterprises/{enterprise_id}/departments 创建部门记录，支持多级树形结构
- PUT /api/v1/departments/{department_id} 更新部门信息
- DELETE /api/v1/departments/{department_id} 软删除部门（部门下无员工时才允许删除）
- GET /api/v1/enterprises/{enterprise_id}/departments/tree 返回树形结构的组织架构

## Capabilities

### New Capabilities
- `department-management`: 部门管理（创建/编辑/删除/树形结构）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
