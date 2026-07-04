## ADDED Requirements

### Requirement: 调岗操作

As a 企业管理员，I want 执行员工调岗（从原部门移到新部门），So that 组织调整时可以快速变更员工归属。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/employees/{employee_id}/transfer 员工从原部门移除，添加到新部门

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 记录调岗历史（原部门、新部门、调岗日期）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 如果是部门经理调岗，原部门经理自动清空

