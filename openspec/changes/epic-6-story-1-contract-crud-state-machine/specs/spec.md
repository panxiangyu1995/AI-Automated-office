## ADDED Requirements

### Requirement: 合同 CRUD 与状态机

As a 销售人员，I want 创建、编辑、删除合同并管理合同状态流转，So that 可以管理合同全生命周期。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/contracts 创建合同（草稿状态）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/contracts/{contract_id}/status 状态按规则流转：草稿→审批中→已生效→已履行→已终止，非法状态流转返回错误码 CON_INVALID_STATUS_TRANSITION

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/contracts/{contract_id} 仅草稿状态可删除（软删除）

