## ADDED Requirements

### Requirement: 知识库文档 CRUD

As a 企业管理员，I want 创建、编辑、删除知识库文档，So that 可以积累和管理企业知识资产。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/knowledge-base/documents 创建知识库文档（标题、分类、Markdown 内容）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/knowledge-base/documents/{id} 更新知识库文档（保留历史版本）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/knowledge-base/documents/{id} 软删除知识库文档

