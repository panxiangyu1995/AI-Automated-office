## ADDED Requirements

### Requirement: 员工自助查看个人信息

As a 员工，I want 查看自己的档案和基本信息，So that 不需要找管理员就能了解自己的信息。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/me/profile 返回当前员工的档案信息（姓名、部门、岗位、入职日期、联系方式），不返回薪资等敏感字段

