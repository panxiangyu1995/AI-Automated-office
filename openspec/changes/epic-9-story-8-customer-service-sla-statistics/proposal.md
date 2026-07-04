## Why

As a 运营商，我需要 监控客户服务 SLA 和统计指标，以便 可以保证服务质量。这是 Epic 9 的关键功能点。

## What Changes

- GET /api/v1/operator/service-metrics 返回客服指标（平均响应时间、解决率、SLA 达标率）
- 工单超时未响应时超过 SLA 配置的响应时间，自动升级工单优先级并通知客服主管

## Capabilities

### New Capabilities
- `customer-service-sla-statistics`: 客户服务SLA与统计的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
