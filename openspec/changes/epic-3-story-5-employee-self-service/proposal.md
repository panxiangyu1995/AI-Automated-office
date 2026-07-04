## Why

As a 员工，我需要 查看自己的档案和基本信息，以便 不需要找管理员就能了解自己的信息。这是 Epic 3 的关键功能点。

## What Changes

- GET /api/v1/me/profile 返回当前员工的档案信息（姓名、部门、岗位、入职日期、联系方式），不返回薪资等敏感字段

## Capabilities

### New Capabilities
- `employee-self-service`: 员工自助查看个人信息的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
