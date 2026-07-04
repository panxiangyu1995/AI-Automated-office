## ADDED Requirements

### Requirement: 供应商管理

As a 采购人员，I want 创建、编辑、删除供应商，So that 可以管理物料采购来源。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/suppliers 创建供应商

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/suppliers/{supplier_id} 更新供应商信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/suppliers/{supplier_id} 软删除供应商（有关联采购订单时禁止删除）

