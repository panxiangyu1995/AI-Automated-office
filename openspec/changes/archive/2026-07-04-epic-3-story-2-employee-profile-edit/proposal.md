## Why

As a 企业管理员，我需要 编辑员工档案信息，以便 员工信息变更时可以及时更新。这是 Epic 3 的关键功能点。

## What Changes

- PUT /api/v1/employees/{employee_id} 更新员工档案信息，变更记录写入审计日志

## Capabilities

### New Capabilities
- `employee-profile-edit`: 员工档案编辑的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
