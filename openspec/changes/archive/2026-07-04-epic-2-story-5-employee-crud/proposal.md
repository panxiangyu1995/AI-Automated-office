## Why

As a 企业管理员，我需要 创建、编辑、删除员工档案，以便 可以为企业员工建立账号和归属关系。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/enterprises/{enterprise_id}/employees 创建员工记录，生成登录凭证，员工必须归属某个部门
- PUT /api/v1/employees/{employee_id} 更新员工信息
- DELETE /api/v1/employees/{employee_id} 软删除员工（标记为离职，保留历史数据）

## Capabilities

### New Capabilities
- `employee-crud`: 员工档案基础 CRUD的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
