## Why

As a 财务人员，我需要 收付款和发票操作关联审批流，以便 关键财务操作需要审批后才能执行。这是 Epic 7 的关键功能点。

## What Changes

- 收款确认需要审批，触发审批工作流，审批通过后才确认收款
- 付款操作需要审批，触发审批工作流，审批通过后才确认付款
- 发票开具需要审批，触发审批工作流，审批通过后才开具发票

## Capabilities

### New Capabilities
- `financial-approval-integration`: 财务审批关联的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
