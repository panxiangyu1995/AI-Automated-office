## ADDED Requirements

### Requirement: 可观测性架构（日志/监控/链路追踪）

As a 运维人员，I want 系统具备结构化日志、Prometheus 指标和 OpenTelemetry 链路追踪，So that 我可以监控系统健康状态和排查问题。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** API 输出结构化 JSON 日志到 stdout，包含请求 ID、时间、方法、路径、状态码、耗时

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Prometheus /metrics 端点返回 API 请求总数、响应时间分布、错误率等指标

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** OpenTelemetry 链路追踪 ID 在服务间传递，可在 Jaeger 中查看完整调用链

