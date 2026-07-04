## ADDED Requirements

### Requirement: 物料报价管理

As a 销售人员，I want 查询物料历史报价并设置差异化报价策略，So that 可以为不同客户级别制定不同价格。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/materials/{material_id}/price-history 返回该物料的历史报价记录

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/materials/{material_id}/pricing-strategies 配置差异化报价策略

