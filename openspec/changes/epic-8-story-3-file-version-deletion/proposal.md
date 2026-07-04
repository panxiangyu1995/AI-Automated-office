## Why

As a 企业用户，我需要 管理文件版本和删除文件，以便 可以更新附件并清理不需要的文件。这是 Epic 8 的关键功能点。

## What Changes

- POST /api/v1/files/{file_id}/versions 创建文件新版本，保留历史版本
- GET /api/v1/files/{file_id}/versions 返回文件版本列表
- DELETE /api/v1/files/{file_id} 软删除文件（标记 deleted_at），已关联业务单据的文件不可删除

## Capabilities

### New Capabilities
- `file-version-deletion`: 文件版本与删除的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
