## ADDED Requirements

### Requirement: 客户分级管理

As a 企业管理员，I want 对客户进行分级（VIP/重要/普通/潜在）并自定义分级规则，So that 可以差异化服务不同级别的客户。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/customer-levels 创建自定义客户分级

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 系统配置自动升级规则，客户达到阈值时自动升级到对应级别

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/customers/{customer_id}/level 手动调整客户分级

