## Why

As a 老板，我需要 查看企业经营数据驾驶舱，以便 可以一目了然掌握企业核心经营指标。这是 Epic 10 的关键功能点。

## What Changes

- GET /api/v1/reports/owner-dashboard 返回驾驶舱数据（营收趋势、合同金额、回款率、员工效率、客户增长）
- GET /api/v1/reports/owner-dashboard?period=quarter 按月/季/年维度切换报表数据
- GET /api/v1/reports/owner-dashboard?enterprise_id=all 返回跨企业汇总数据

## Capabilities

### New Capabilities
- `owner-dashboard-reports`: 老板驾驶舱报表的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
