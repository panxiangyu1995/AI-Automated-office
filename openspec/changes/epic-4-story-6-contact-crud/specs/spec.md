## ADDED Requirements

### Requirement: 联系人 CRUD

As a 销售人员，I want 管理客户下的联系人，So that 可以记录和维护客户对接人信息。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/customers/{customer_id}/contacts 创建联系人，必须归属某个客户

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/contacts/{contact_id} 更新联系人信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/contacts/{contact_id} 软删除联系人

