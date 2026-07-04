## ADDED Requirements

### Requirement: 合同附件与审批流

As a 销售人员，I want 上传合同附件（扫描件、补充协议）并提交审批，So that 合同可以走审批流程。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/contracts/{contract_id}/attachments 上传文件，附件存储到 /storage/{enterprise_id}/contracts/{contract_id}/attachments/

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/contracts/{contract_id}/submit-approval 合同状态变为'审批中'，触发审批工作流

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 审批通过后自动变为'已生效'

