## ADDED Requirements

### Requirement: 财务审批关联

As a 财务人员，I want 收付款和发票操作关联审批流，So that 关键财务操作需要审批后才能执行。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 收款确认需要审批，触发审批工作流，审批通过后才确认收款

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 付款操作需要审批，触发审批工作流，审批通过后才确认付款

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 发票开具需要审批，触发审批工作流，审批通过后才开具发票

