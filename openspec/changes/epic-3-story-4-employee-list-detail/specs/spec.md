## ADDED Requirements

### Requirement: 员工列表与详情查询

As a 企业管理员，I want 查看所有员工列表和单个员工详情，So that 可以了解企业人员全貌。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/employees?page=1&page_size=20 返回员工列表，支持分页、按部门/状态筛选

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/employees/{employee_id} 返回员工详细信息（含部门、岗位、入职日期、状态）

