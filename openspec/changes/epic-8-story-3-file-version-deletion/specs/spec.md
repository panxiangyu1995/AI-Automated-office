## ADDED Requirements

### Requirement: 文件版本与删除

As a 企业用户，I want 管理文件版本和删除文件，So that 可以更新附件并清理不需要的文件。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/files/{file_id}/versions 创建文件新版本，保留历史版本

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/files/{file_id}/versions 返回文件版本列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/files/{file_id} 软删除文件（标记 deleted_at），已关联业务单据的文件不可删除

