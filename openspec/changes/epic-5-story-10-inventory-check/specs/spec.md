## ADDED Requirements

### Requirement: 库存盘点（盘库）

As a 仓库管理员，I want 执行库存盘点，So that 可以核对系统库存与实际库存。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/inventory-checks 创建盘点任务

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 盘点人录入实盘数量提交盘点结果后，系统自动生成盘盈盘亏明细

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 支持按批次号/效期维度分别盘点

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 盘点结果审批通过后，自动生成盘点调整出入库流水（type=adjustment），更新系统库存数量

