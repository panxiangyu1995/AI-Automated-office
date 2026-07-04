## ADDED Requirements

### Requirement: 仓库间调拨

As a 仓库管理员，I want 在仓库之间调拨物料，So that 可以平衡各仓库库存。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/stock-transfers 创建调拨单（草稿状态）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 调拨单审批通过后，源仓库出库并扣减库存，生成出库流水（transfer_out）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 调拨货物到达目标仓库后，填写实收数量，目标仓库库存增加，生成入库流水（transfer_in）

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 实收数量与调拨数量不一致时记录差异

