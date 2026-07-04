## Why

As a 企业管理员，我需要 为企业订阅套餐和管理续费，以便 可以使用平台服务。这是 Epic 9 的关键功能点。

## What Changes

- POST /api/v1/subscriptions 创建订阅，关联到当前企业
- 订阅即将到期（距到期日 30 天内）时系统自动发送续费提醒消息
- POST /api/v1/subscriptions/{id}/renew 续费订阅，延长有效期
- 订阅过期后 7 天内降级为只读模式，超过 7 天暂停服务

## Capabilities

### New Capabilities
- `enterprise-subscription-renewal`: 企业订阅与续费的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
