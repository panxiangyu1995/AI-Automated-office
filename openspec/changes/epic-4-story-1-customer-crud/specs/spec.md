## ADDED Requirements

### Requirement: 客户档案 CRUD

As a 销售人员，I want 创建、编辑、删除客户档案，So that 可以管理企业的客户资源。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/customers 创建客户档案，客户以公司名称为企业内唯一标识，同一企业内不可创建公司名称重复的客户

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/customers/{customer_id} 更新客户信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/customers/{customer_id} 软删除客户（有关联合同/订单时禁止删除）

