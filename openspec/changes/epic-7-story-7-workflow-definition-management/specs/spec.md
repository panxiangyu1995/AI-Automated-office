## ADDED Requirements

### Requirement: 审批流程定义与管理

As a 企业管理员，I want 定义和管理审批流程模板，So that 不同业务场景可以配置不同的审批规则。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/workflow-definitions 创建审批流程定义

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/workflow-definitions/{id} 更新审批流程定义（已生效的流程不可修改，需创建新版本）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/workflow-definitions?type=contract 按业务类型查询审批流程定义列表

