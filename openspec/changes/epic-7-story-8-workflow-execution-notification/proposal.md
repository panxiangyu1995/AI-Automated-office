## Why

As a 审批人，我需要 接收审批通知并执行审批操作，以便 可以及时处理待审批事项。这是 Epic 7 的关键功能点。

## What Changes

- 业务单据提交审批时，当前审批节点对应的审批人收到消息通知
- POST /api/v1/workflow-instances/{id}/approve 审批通过流转到下一节点
- POST /api/v1/workflow-instances/{id}/reject 审批拒绝退回给提交人
- GET /api/v1/workflow-instances/pending 返回当前用户待审批的流程实例列表

## Capabilities

### New Capabilities
- `workflow-execution-notification`: 审批流程执行与通知的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
