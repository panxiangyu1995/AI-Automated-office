## ADDED Requirements

### Requirement: 文件上传与存储

As a 企业用户，I want 上传文件到系统并获取文件 URL，So that 业务单据可以关联附件。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/files/upload 上传文件（multipart/form-data），文件存储到 /storage/{enterprise_id}/{module}/{entity_id}/，返回文件 ID 和访问 URL

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 上传文件超过大小限制时返回错误码 FILE_SIZE_EXCEEDED

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 上传不支持的文件类型时返回错误码 FILE_TYPE_NOT_ALLOWED

