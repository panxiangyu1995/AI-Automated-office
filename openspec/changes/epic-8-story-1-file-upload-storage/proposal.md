## Why

As a 企业用户，我需要 上传文件到系统并获取文件 URL，以便 业务单据可以关联附件。这是 Epic 8 的关键功能点。

## What Changes

- POST /api/v1/files/upload 上传文件（multipart/form-data），文件存储到 /storage/{enterprise_id}/{module}/{entity_id}/，返回文件 ID 和访问 URL
- 上传文件超过大小限制时返回错误码 FILE_SIZE_EXCEEDED
- 上传不支持的文件类型时返回错误码 FILE_TYPE_NOT_ALLOWED

## Capabilities

### New Capabilities
- `file-upload-storage`: 文件上传与存储的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
