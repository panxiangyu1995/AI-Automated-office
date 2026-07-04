## ADDED Requirements

### Requirement: 多仓库管理

As a 仓库管理员，I want 创建、编辑、停用仓库，So that 可以管理多个物理仓库。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/warehouses 创建仓库

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/warehouses/{warehouse_id}/status 停用仓库（仓库下有库存时禁止停用）

