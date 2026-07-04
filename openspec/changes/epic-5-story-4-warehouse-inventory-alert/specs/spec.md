## ADDED Requirements

### Requirement: 按仓库维度的库存查询与预警

As a 仓库管理员，I want 按仓库维度查询库存并设置安全库存预警，So that 可以及时发现库存不足。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/warehouses/{warehouse_id}/inventory 返回该仓库所有物料的库存数量、安全库存、在途数量

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/materials/{material_id}/inventory 返回该物料在各仓库的库存分布

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 某物料在某仓库的数量低于安全库存时，触发出库操作使库存低于阈值，系统生成库存预警

