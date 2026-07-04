## ADDED Requirements

### Requirement: 多级审批与条件分支

As a 企业管理员，I want 配置多级审批和条件分支，So that 不同金额或类型的业务走不同的审批路径。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 审批流程定义包含条件分支，根据条件自动选择审批路径

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 审批流程定义包含多级审批，当前节点审批通过后自动流转到下一级审批节点

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 条件分支判断失败时返回错误码 WF_CONDITION_EVALUATION_FAILED

