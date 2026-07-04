## Why

As a 企业管理员，我需要 标记员工离职，以便 离职员工无法继续访问系统。这是 Epic 3 的关键功能点。

## What Changes

- POST /api/v1/employees/{employee_id}/resign 员工状态变为'离职'，记录离职日期
- 该员工的 Access Token 和 Refresh Token 立即失效
- 保留所有历史数据

## Capabilities

### New Capabilities
- `employee-resignation`: 员工离职的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
