## Why

As a 企业管理员，我需要 配置多级审批和条件分支，以便 不同金额或类型的业务走不同的审批路径。这是 Epic 7 的关键功能点。

## What Changes

- 审批流程定义包含条件分支，根据条件自动选择审批路径
- 审批流程定义包含多级审批，当前节点审批通过后自动流转到下一级审批节点
- 条件分支判断失败时返回错误码 WF_CONDITION_EVALUATION_FAILED

## Capabilities

### New Capabilities
- `multi-level-approval-conditions`: 多级审批与条件分支的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
