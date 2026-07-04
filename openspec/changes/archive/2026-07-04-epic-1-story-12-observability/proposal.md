## Why

As a 运维人员，我需要 系统具备结构化日志、Prometheus 指标和 OpenTelemetry 链路追踪，以便 我可以监控系统健康状态和排查问题。这是 Epic 1 的关键功能点。

## What Changes

- API 输出结构化 JSON 日志到 stdout，包含请求 ID、时间、方法、路径、状态码、耗时
- Prometheus /metrics 端点返回 API 请求总数、响应时间分布、错误率等指标
- OpenTelemetry 链路追踪 ID 在服务间传递，可在 Jaeger 中查看完整调用链

## Capabilities

### New Capabilities
- `observability`: 可观测性架构（日志/监控/链路追踪）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
