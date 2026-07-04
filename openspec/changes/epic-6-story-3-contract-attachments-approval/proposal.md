## Why

As a 销售人员，我需要 上传合同附件（扫描件、补充协议）并提交审批，以便 合同可以走审批流程。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/contracts/{contract_id}/attachments 上传文件，附件存储到 /storage/{enterprise_id}/contracts/{contract_id}/attachments/
- POST /api/v1/contracts/{contract_id}/submit-approval 合同状态变为'审批中'，触发审批工作流
- 审批通过后自动变为'已生效'

## Capabilities

### New Capabilities
- `contract-attachments-approval`: 合同附件与审批流的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
