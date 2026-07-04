## ADDED Requirements

### Requirement: Rate Limiting 中间件

As a 系统开发者，I want 实现 API 请求频率限制，So that 单个企业或 IP 不会压垮系统。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 配置 Rate Limit 规则（每企业 1000 QPS，每 IP 100 QPS）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 请求频率超过限制时返回 429 Too Many Requests

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 响应头包含 X-RateLimit-Limit、X-RateLimit-Remaining、X-RateLimit-Reset

