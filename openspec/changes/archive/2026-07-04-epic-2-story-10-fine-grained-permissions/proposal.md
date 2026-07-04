## Why

As a 企业管理员或老板，我需要 自定义员工的权限（精细化到具体操作），以便 可以按需授权，而非仅依赖角色粗粒度控制。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/employees/{employee_id}/permissions 为员工设置精细化权限
- 系统优先检查精细化权限，再检查角色权限
- 精细化权限可限制到具体模块、具体操作（如'只能查看合同，不能创建'）

## Capabilities

### New Capabilities
- `fine-grained-permissions`: 精细化权限分配的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
