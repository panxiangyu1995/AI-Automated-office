## Why

As a 运营商，我需要 查看平台运营数据仪表盘，以便 可以掌握平台整体运营状况。这是 Epic 9 的关键功能点。

## What Changes

- GET /api/v1/operator/dashboard 返回平台核心指标（企业总数、活跃企业数、用户总数、本月新增、收入汇总）
- GET /api/v1/operator/dashboard/trends?period=30d 返回趋势数据（日活企业、日活用户、日收入）

## Capabilities

### New Capabilities
- `operator-dashboard`: 运营仪表盘的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
