## Why

As a 管理员或部门经理，我需要 按时间范围查询员工的销售业绩，以便 可以评估员工绩效。这是 Epic 3 的关键功能点。

## What Changes

- GET /api/v1/employees/{employee_id}/sales-performance 返回指定时间范围内的销售业绩（销售额、订单数、回款额）
- 部门经理只能查询本部门员工

## Capabilities

### New Capabilities
- `employee-sales-performance`: 员工销售业绩查询的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
