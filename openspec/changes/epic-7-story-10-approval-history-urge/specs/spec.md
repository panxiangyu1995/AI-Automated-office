## ADDED Requirements

### Requirement: 审批历史与催办

As a 审批提交人，I want 查看审批历史和催办审批人，So that 可以追踪审批进度并加速流程。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/workflow-instances/{id}/history 返回审批历史（每个节点的审批人、时间、结果、备注）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/workflow-instances/{id}/urge 向当前审批人发送催办通知

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/workflow-instances/statistics 返回审批统计数据（平均审批时长、超时率、各审批人处理量）

