## Why

As a 企业用户，我需要 导出业务数据，以便 可以在本地分析或备份。这是 Epic 10 的关键功能点。

## What Changes

- POST /api/v1/data-export 创建异步导出任务
- GET /api/v1/data-export/{id}/download 下载导出文件
- GET /api/v1/data-export/history 返回导出历史列表

## Capabilities

### New Capabilities
- `data-export`: 数据导出的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
