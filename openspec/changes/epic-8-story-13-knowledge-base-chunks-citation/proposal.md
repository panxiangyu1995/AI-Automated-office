## Why

As a Agent，我需要 获取知识库文档的分块内容和来源引用，以便 Agent 回答用户问题时可以引用知识库的具体段落。这是 Epic 8 的关键功能点。

## What Changes

- 语义检索返回结果时包含文档分块内容、来源文档 ID、分块位置
- GET /api/v1/knowledge-base/documents/{id}/chunks 返回文档的分块列表
- 文档更新重新向量化时，旧分块向量删除，新分块向量生成

## Capabilities

### New Capabilities
- `knowledge-base-chunks-citation`: 知识库文档分块与引用的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
