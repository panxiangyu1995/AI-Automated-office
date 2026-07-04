## ADDED Requirements

### Requirement: 员工销售业绩查询

As a 管理员或部门经理，I want 按时间范围查询员工的销售业绩，So that 可以评估员工绩效。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/employees/{employee_id}/sales-performance 返回指定时间范围内的销售业绩（销售额、订单数、回款额）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 部门经理只能查询本部门员工

