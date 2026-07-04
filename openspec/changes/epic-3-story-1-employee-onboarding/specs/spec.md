## ADDED Requirements

### Requirement: 员工入职（创建档案）

As a 企业管理员，I want 创建员工档案并记录入职信息，So that 新员工可以在系统中拥有账号和完整信息。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/employees 创建员工档案，自动生成登录凭证，记录入职日期，员工状态为'在职'

