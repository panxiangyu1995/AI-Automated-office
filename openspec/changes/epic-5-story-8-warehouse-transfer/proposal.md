## Why

As a 仓库管理员，我需要 在仓库之间调拨物料，以便 可以平衡各仓库库存。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/stock-transfers 创建调拨单（草稿状态）
- 调拨单审批通过后，源仓库出库并扣减库存，生成出库流水（transfer_out）
- 调拨货物到达目标仓库后，填写实收数量，目标仓库库存增加，生成入库流水（transfer_in）
- 实收数量与调拨数量不一致时记录差异

## Capabilities

### New Capabilities
- `warehouse-transfer`: 仓库间调拨的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
