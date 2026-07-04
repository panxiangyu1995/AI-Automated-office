## ADDED Requirements

### Requirement: 财务对账与统计

As a 财务人员，I want 查看财务对账和统计报表，So that 可以掌握企业财务状况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/financial-summary 返回指定期间收支汇总

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/financial-reconciliation?contract_id={id} 返回合同维度的对账明细

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/financial-statistics 返回企业财务统计数据（月度收支趋势、费用分类占比）

