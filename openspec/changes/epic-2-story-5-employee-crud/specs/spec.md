## ADDED Requirements

### Requirement: 员工档案基础 CRUD

As a 企业管理员，I want 创建、编辑、删除员工档案，So that 可以为企业员工建立账号和归属关系。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/enterprises/{enterprise_id}/employees 创建员工记录，生成登录凭证，员工必须归属某个部门

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/employees/{employee_id} 更新员工信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/employees/{employee_id} 软删除员工（标记为离职，保留历史数据）

