## Why

As a 仓库管理员，我需要 按仓库维度查询库存并设置安全库存预警，以便 可以及时发现库存不足。这是 Epic 5 的关键功能点。

## What Changes

- GET /api/v1/warehouses/{warehouse_id}/inventory 返回该仓库所有物料的库存数量、安全库存、在途数量
- GET /api/v1/materials/{material_id}/inventory 返回该物料在各仓库的库存分布
- 某物料在某仓库的数量低于安全库存时，触发出库操作使库存低于阈值，系统生成库存预警

## Capabilities

### New Capabilities
- `warehouse-inventory-alert`: 按仓库维度的库存查询与预警的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
