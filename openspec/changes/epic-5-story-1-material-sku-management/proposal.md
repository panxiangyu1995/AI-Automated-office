## Why

As a 仓库管理员，我需要 创建、编辑、删除物料（SKU），以便 可以管理企业的所有物料品类。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/materials 创建物料 SKU，包含名称、类型、规格参数（JSON）、单位、单价
- PUT /api/v1/materials/{material_id} 更新物料信息
- GET /api/v1/materials?type=finished_product 返回指定类型的物料列表

## Capabilities

### New Capabilities
- `material-sku-management`: 物料（SKU）管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
