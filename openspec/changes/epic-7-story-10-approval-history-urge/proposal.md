## Why

As a 审批提交人，我需要 查看审批历史和催办审批人，以便 可以追踪审批进度并加速流程。这是 Epic 7 的关键功能点。

## What Changes

- GET /api/v1/workflow-instances/{id}/history 返回审批历史（每个节点的审批人、时间、结果、备注）
- POST /api/v1/workflow-instances/{id}/urge 向当前审批人发送催办通知
- GET /api/v1/workflow-instances/statistics 返回审批统计数据（平均审批时长、超时率、各审批人处理量）

## Capabilities

### New Capabilities
- `approval-history-urge`: 审批历史与催办的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
