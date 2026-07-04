## ADDED Requirements

### Requirement: 企业订阅与续费

As a 企业管理员，I want 为企业订阅套餐和管理续费，So that 可以使用平台服务。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/subscriptions 创建订阅，关联到当前企业

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 订阅即将到期（距到期日 30 天内）时系统自动发送续费提醒消息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/subscriptions/{id}/renew 续费订阅，延长有效期

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 订阅过期后 7 天内降级为只读模式，超过 7 天暂停服务

