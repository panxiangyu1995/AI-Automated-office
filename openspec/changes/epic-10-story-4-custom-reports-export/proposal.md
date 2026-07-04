## Why

As a 企业管理员，我需要 创建自定义报表并导出数据，以便 可以按需分析业务数据。这是 Epic 10 的关键功能点。

## What Changes

- POST /api/v1/reports/custom 创建自定义报表定义
- GET /api/v1/reports/custom/{id}/run 执行报表查询并返回结果
- GET /api/v1/reports/custom/{id}/export?format=csv 导出报表数据为 CSV/Excel 格式

## Capabilities

### New Capabilities
- `custom-reports-export`: 自定义报表与导出的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
