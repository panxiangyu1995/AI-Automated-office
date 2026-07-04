## Why

As a 员工，我需要 申请领用物料，以便 可以领用办公或业务所需物料。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/requisitions 创建领用申请（草稿状态）
- 领用申请审批通过后，仓库确认出库并填写实发数量，扣减对应仓库库存，生成出库流水（requisition_out）
- 实发数量可少于申请数量

## Capabilities

### New Capabilities
- `material-requisition`: 物料领用申请的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
