## Why

As a 系统开发者，我需要 实现 API 请求频率限制，以便 单个企业或 IP 不会压垮系统。这是 Epic 1 的关键功能点。

## What Changes

- 配置 Rate Limit 规则（每企业 1000 QPS，每 IP 100 QPS）
- 请求频率超过限制时返回 429 Too Many Requests
- 响应头包含 X-RateLimit-Limit、X-RateLimit-Remaining、X-RateLimit-Reset

## Capabilities

### New Capabilities
- `rate-limiting`: Rate Limiting 中间件的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
