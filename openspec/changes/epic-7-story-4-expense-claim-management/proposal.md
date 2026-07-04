## Why

As a 员工，我需要 提交费用报销申请，以便 可以报销业务相关费用。这是 Epic 7 的关键功能点。

## What Changes

- POST /api/v1/expense-claims 创建报销申请（待审批状态）
- PATCH /api/v1/expense-claims/{id}/status 状态流转：待审批→审批中→已批准→已打款→已拒绝
- GET /api/v1/expense-claims?department_id={id}&status=pending 部门经理查看本部门待审批报销列表

## Capabilities

### New Capabilities
- `expense-claim-management`: 费用报销管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
