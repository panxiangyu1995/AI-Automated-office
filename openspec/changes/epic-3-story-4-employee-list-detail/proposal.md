## Why

As a 企业管理员，我需要 查看所有员工列表和单个员工详情，以便 可以了解企业人员全貌。这是 Epic 3 的关键功能点。

## What Changes

- GET /api/v1/employees?page=1&page_size=20 返回员工列表，支持分页、按部门/状态筛选
- GET /api/v1/employees/{employee_id} 返回员工详细信息（含部门、岗位、入职日期、状态）

## Capabilities

### New Capabilities
- `employee-list-detail`: 员工列表与详情查询的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
