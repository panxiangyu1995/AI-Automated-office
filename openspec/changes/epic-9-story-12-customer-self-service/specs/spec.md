## ADDED Requirements

### Requirement: 客户自助服务

As a 企业管理员，I want 通过自助服务管理企业订阅和查看用量，So that 不需要联系运营商就能完成常见操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customer/subscription 返回当前企业订阅信息（套餐、到期日、用量）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/customer/subscription/upgrade 升级订阅（立即生效，差价按天计算）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/customer/support-tickets 创建客户支持工单

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customer/support-tickets 返回本企业的支持工单列表

