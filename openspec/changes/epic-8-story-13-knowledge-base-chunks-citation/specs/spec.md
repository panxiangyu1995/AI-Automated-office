## ADDED Requirements

### Requirement: 知识库文档分块与引用

As a Agent，I want 获取知识库文档的分块内容和来源引用，So that Agent 回答用户问题时可以引用知识库的具体段落。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 语义检索返回结果时包含文档分块内容、来源文档 ID、分块位置

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/knowledge-base/documents/{id}/chunks 返回文档的分块列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 文档更新重新向量化时，旧分块向量删除，新分块向量生成

