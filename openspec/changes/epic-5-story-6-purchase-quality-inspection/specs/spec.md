## ADDED Requirements

### Requirement: 采购质检流程

As a 质检员，I want 采购入库前触发质检流程，So that 不合格物料不会进入库存。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 采购订单配置了质检流程，货物到达后系统生成质检任务

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 质检结果为合格允许正式入库

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 质检结果为不合格触发退换货流程，禁止入库

