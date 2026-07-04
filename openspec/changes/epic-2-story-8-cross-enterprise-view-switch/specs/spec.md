## ADDED Requirements

### Requirement: 老板跨企业视角切换

As a 集团老板，I want 在不同企业之间切换视角，So that 可以查看和管理不同企业的数据。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/auth/switch-enterprise 携带目标企业 ID，返回该企业的新 Access Token

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 老板切换到企业 A 后查询员工列表，只返回企业 A 的员工

