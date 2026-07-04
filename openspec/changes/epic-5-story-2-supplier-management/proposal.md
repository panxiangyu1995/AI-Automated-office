## Why

As a 采购人员，我需要 创建、编辑、删除供应商，以便 可以管理物料采购来源。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/suppliers 创建供应商
- PUT /api/v1/suppliers/{supplier_id} 更新供应商信息
- DELETE /api/v1/suppliers/{supplier_id} 软删除供应商（有关联采购订单时禁止删除）

## Capabilities

### New Capabilities
- `supplier-management`: 供应商管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
