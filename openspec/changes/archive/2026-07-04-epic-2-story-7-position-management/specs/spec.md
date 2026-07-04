## ADDED Requirements

### Requirement: 岗位定义与管理

As a 企业管理员，I want 定义和管理岗位（职位），So that 员工档案可以关联岗位，新员工可以通过 Agent 查询岗位职责。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/positions 创建岗位定义

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/positions 返回所有岗位列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/positions/{position_id} 更新岗位信息

