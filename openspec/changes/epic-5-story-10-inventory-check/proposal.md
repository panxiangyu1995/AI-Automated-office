## Why

As a 仓库管理员，我需要 执行库存盘点，以便 可以核对系统库存与实际库存。这是 Epic 5 的关键功能点。

## What Changes

- POST /api/v1/inventory-checks 创建盘点任务
- 盘点人录入实盘数量提交盘点结果后，系统自动生成盘盈盘亏明细
- 支持按批次号/效期维度分别盘点
- 盘点结果审批通过后，自动生成盘点调整出入库流水（type=adjustment），更新系统库存数量

## Capabilities

### New Capabilities
- `inventory-check`: 库存盘点（盘库）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
