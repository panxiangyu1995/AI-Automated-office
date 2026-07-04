## Why

As a 企业用户，我需要 按模块查看业务数据报表，以便 可以从数据维度分析业务状况。这是 Epic 10 的关键功能点。

## What Changes

- GET /api/v1/reports/sales?period=2026-06 返回销售报表
- GET /api/v1/reports/inventory?warehouse_id={id} 返回库存报表
- GET /api/v1/reports/finance?period=2026-06 返回财务报表
- GET /api/v1/reports/service?period=2026-06 返回售后报表

## Capabilities

### New Capabilities
- `general-business-reports`: 通用数据报表的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
