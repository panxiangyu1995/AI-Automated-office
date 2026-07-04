## Why

As a 仓库管理员，我需要 创建、编辑、停用仓库，以便 可以管理多个物理仓库。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/warehouses 创建仓库
- PATCH /api/v1/warehouses/{warehouse_id}/status 停用仓库（仓库下有库存时禁止停用）

## Capabilities

### New Capabilities
- `multi-warehouse-management`: 多仓库管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
