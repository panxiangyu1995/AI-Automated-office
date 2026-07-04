## ADDED Requirements

### Requirement: 审批流程执行与通知

As a 审批人，I want 接收审批通知并执行审批操作，So that 可以及时处理待审批事项。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 业务单据提交审批时，当前审批节点对应的审批人收到消息通知

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/workflow-instances/{id}/approve 审批通过流转到下一节点

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/workflow-instances/{id}/reject 审批拒绝退回给提交人

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/workflow-instances/pending 返回当前用户待审批的流程实例列表

