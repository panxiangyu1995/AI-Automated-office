## ADDED Requirements

### Requirement: 文件下载与预览

As a 企业用户，I want 下载和预览已上传的文件，So that 可以查看业务单据关联的附件内容。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/files/{file_id}/download 返回文件内容（Content-Disposition: attachment）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/files/{file_id}/preview 对于图片/PDF 返回预览内容，其他类型返回不支持预览错误

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 用户无文件访问权限（跨企业）时返回 403 权限不足

