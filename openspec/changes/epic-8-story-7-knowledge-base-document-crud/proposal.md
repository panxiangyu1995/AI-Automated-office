## Why

As a 企业管理员，我需要 创建、编辑、删除知识库文档，以便 可以积累和管理企业知识资产。这是 Epic 8 的关键功能点。

## What Changes

- POST /api/v1/knowledge-base/documents 创建知识库文档（标题、分类、Markdown 内容）
- PUT /api/v1/knowledge-base/documents/{id} 更新知识库文档（保留历史版本）
- DELETE /api/v1/knowledge-base/documents/{id} 软删除知识库文档

## Capabilities

### New Capabilities
- `knowledge-base-document-crud`: 知识库文档 CRUD的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
