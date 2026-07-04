## ADDED Requirements

### Requirement: 员工离职

As a 企业管理员，I want 标记员工离职，So that 离职员工无法继续访问系统。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/employees/{employee_id}/resign 员工状态变为'离职'，记录离职日期

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 该员工的 Access Token 和 Refresh Token 立即失效

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 保留所有历史数据

