## ADDED Requirements

### Requirement: 统一出入库流水查询

As a 企业用户，I want 查询统一的出入库流水，So that 可以追溯所有库存变动。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/inventory-transactions 返回匹配的出入库流水列表，支持按类型、仓库、时间、物料筛选

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/inventory-transactions/{transaction_id} 返回流水详情（含批次号、效期、序列号、规格参数、源单据类型）

