## ADDED Requirements

### Requirement: 部门经理设置与权限

As a 企业管理员，I want 设置部门经理并赋予部门级管理权限，So that 部门经理可以管理本部门员工和业务。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/departments/{department_id}/manager 指定员工 ID 成为部门经理，获得 Manager 角色

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 部门经理可以编辑本部门信息，禁止修改其他部门信息

