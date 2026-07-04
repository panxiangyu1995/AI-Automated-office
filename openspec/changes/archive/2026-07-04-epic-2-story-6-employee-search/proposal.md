## Why

As a 企业用户，我需要 按角色或姓名模糊搜索员工，以便 可以快速找到需要联系的同事。这是 Epic 2 的关键功能点。

## What Changes

- GET /api/v1/employees?role=manager 返回所有 Manager 角色的员工列表
- GET /api/v1/employees?name=张 返回姓名包含'张'的员工列表
- GET /api/v1/employees?position=仓库管理员 返回岗位为'仓库管理员'的员工列表

## Capabilities

### New Capabilities
- `employee-search`: 员工查询（按角色/姓名模糊搜索）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
