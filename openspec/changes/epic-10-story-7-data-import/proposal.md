## Why

As a 企业管理员，我需要 批量导入业务数据，以便 可以快速初始化系统或批量更新数据。这是 Epic 10 的关键功能点。

## What Changes

- POST /api/v1/data-import/upload 上传 CSV/Excel 文件，解析并返回预览
- POST /api/v1/data-import/execute 执行导入，返回导入结果（成功数、失败数、错误明细）
- 导入数据校验失败时返回错误明细（行号、字段、错误原因），允许部分导入或全部回滚

## Capabilities

### New Capabilities
- `data-import`: 数据导入的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
