## ADDED Requirements

### Requirement: 费用报销管理

As a 员工，I want 提交费用报销申请，So that 可以报销业务相关费用。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/expense-claims 创建报销申请（待审批状态）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/expense-claims/{id}/status 状态流转：待审批→审批中→已批准→已打款→已拒绝

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/expense-claims?department_id={id}&status=pending 部门经理查看本部门待审批报销列表

