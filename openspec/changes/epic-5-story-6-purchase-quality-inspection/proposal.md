## Why

As a 质检员，我需要 采购入库前触发质检流程，以便 不合格物料不会进入库存。这是 Epic 5 的关键功能点。

## What Changes

- 采购订单配置了质检流程，货物到达后系统生成质检任务
- 质检结果为合格允许正式入库
- 质检结果为不合格触发退换货流程，禁止入库

## Capabilities

### New Capabilities
- `purchase-quality-inspection`: 采购质检流程的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
