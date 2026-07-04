## Why

As a 企业用户，我需要 下载和预览已上传的文件，以便 可以查看业务单据关联的附件内容。这是 Epic 8 的关键功能点。

## What Changes

- GET /api/v1/files/{file_id}/download 返回文件内容（Content-Disposition: attachment）
- GET /api/v1/files/{file_id}/preview 对于图片/PDF 返回预览内容，其他类型返回不支持预览错误
- 用户无文件访问权限（跨企业）时返回 403 权限不足

## Capabilities

### New Capabilities
- `file-download-preview`: 文件下载与预览的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
