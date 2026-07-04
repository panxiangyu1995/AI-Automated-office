## Why

As a 企业管理员，我需要 执行员工调岗（从原部门移到新部门），以便 组织调整时可以快速变更员工归属。这是 Epic 3 的关键功能点。

## What Changes

- POST /api/v1/employees/{employee_id}/transfer 员工从原部门移除，添加到新部门
- 记录调岗历史（原部门、新部门、调岗日期）
- 如果是部门经理调岗，原部门经理自动清空

## Capabilities

### New Capabilities
- `employee-transfer`: 调岗操作的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
