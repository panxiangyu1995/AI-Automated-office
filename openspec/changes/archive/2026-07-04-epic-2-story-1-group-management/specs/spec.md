## ADDED Requirements

### Requirement: 集团管理（创建/编辑/删除）

As a 运营商，I want 创建、编辑和删除集团账号，So that 可以为拥有多个企业的老板建立集团管理入口。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/groups 创建集团记录，返回集团 ID 和名称，自动创建集团 Owner 用户账号

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/groups/{group_id} 更新集团信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/groups/{group_id} 软删除集团（集团下无活跃企业时才允许删除）

