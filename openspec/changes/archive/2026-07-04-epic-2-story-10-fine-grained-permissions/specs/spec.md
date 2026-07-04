## ADDED Requirements

### Requirement: 精细化权限分配

As a 企业管理员或老板，I want 自定义员工的权限（精细化到具体操作），So that 可以按需授权，而非仅依赖角色粗粒度控制。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/employees/{employee_id}/permissions 为员工设置精细化权限

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 系统优先检查精细化权限，再检查角色权限

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 精细化权限可限制到具体模块、具体操作（如'只能查看合同，不能创建'）

