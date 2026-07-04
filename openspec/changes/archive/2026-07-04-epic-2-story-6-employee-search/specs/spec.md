## ADDED Requirements

### Requirement: 员工查询（按角色/姓名模糊搜索）

As a 企业用户，I want 按角色或姓名模糊搜索员工，So that 可以快速找到需要联系的同事。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/employees?role=manager 返回所有 Manager 角色的员工列表

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/employees?name=张 返回姓名包含'张'的员工列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/employees?position=仓库管理员 返回岗位为'仓库管理员'的员工列表

