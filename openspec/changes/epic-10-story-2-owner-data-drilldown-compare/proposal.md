## Why

As a 老板，我需要 穿透查看报表背后的明细数据并进行跨期对比，以便 可以从宏观到微观理解经营状况。这是 Epic 10 的关键功能点。

## What Changes

- GET /api/v1/reports/owner-drilldown?metric=revenue&period=2026-Q2 返回指标穿透明细（从季度→月→周→单据）
- GET /api/v1/reports/owner-compare?metric=revenue&periods=2026-Q1,2026-Q2 返回跨期对比数据
- GET /api/v1/reports/owner-ranking?type=department&metric=revenue 返回部门排名数据

## Capabilities

### New Capabilities
- `owner-data-drilldown-compare`: 老板数据穿透与对比的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
