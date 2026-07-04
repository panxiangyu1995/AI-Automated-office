## ADDED Requirements

### Requirement: 物料（SKU）管理

As a 仓库管理员，I want 创建、编辑、删除物料（SKU），So that 可以管理企业的所有物料品类。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/materials 创建物料 SKU，包含名称、类型、规格参数（JSON）、单位、单价

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/materials/{material_id} 更新物料信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/materials?type=finished_product 返回指定类型的物料列表

