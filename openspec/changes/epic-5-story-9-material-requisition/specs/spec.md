## ADDED Requirements

### Requirement: 物料领用申请

As a 员工，I want 申请领用物料，So that 可以领用办公或业务所需物料。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/requisitions 创建领用申请（草稿状态）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 领用申请审批通过后，仓库确认出库并填写实发数量，扣减对应仓库库存，生成出库流水（requisition_out）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 实发数量可少于申请数量

