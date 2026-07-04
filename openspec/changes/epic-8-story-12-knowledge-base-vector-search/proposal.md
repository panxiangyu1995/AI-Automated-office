## Why

As a Agent，我需要 通过语义检索查找知识库文档，以便 可以用自然语言查询找到最相关的知识。这是 Epic 8 的关键功能点。

## What Changes

- 知识库文档创建/更新后自动将文档内容向量化并存入 Qdrant
- POST /api/v1/knowledge-base/semantic-search 携带自然语言查询，返回语义最相关的知识库文档列表
- 向量化服务不可用时文档正常保存，向量化任务进入重试队列

## Capabilities

### New Capabilities
- `knowledge-base-vector-search`: 知识库向量化与语义检索的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
