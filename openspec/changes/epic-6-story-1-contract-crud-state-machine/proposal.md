## Why

As a 销售人员，我需要 创建、编辑、删除合同并管理合同状态流转，以便 可以管理合同全生命周期。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/contracts 创建合同（草稿状态）
- PATCH /api/v1/contracts/{contract_id}/status 状态按规则流转：草稿→审批中→已生效→已履行→已终止，非法状态流转返回错误码 CON_INVALID_STATUS_TRANSITION
- DELETE /api/v1/contracts/{contract_id} 仅草稿状态可删除（软删除）

## Capabilities

### New Capabilities
- `contract-crud-state-machine`: 合同 CRUD 与状态机的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
