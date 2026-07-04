## ADDED Requirements

### Requirement: 部门管理（创建/编辑/删除/树形结构）

As a 企业管理员，I want 创建、编辑、删除部门并查询组织架构树，So that 可以建立符合企业实际的组织结构。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/enterprises/{enterprise_id}/departments 创建部门记录，支持多级树形结构

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/departments/{department_id} 更新部门信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/departments/{department_id} 软删除部门（部门下无员工时才允许删除）

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/enterprises/{enterprise_id}/departments/tree 返回树形结构的组织架构

