## ADDED Requirements

### Requirement: 知识库向量化与语义检索

As a Agent，I want 通过语义检索查找知识库文档，So that 可以用自然语言查询找到最相关的知识。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 知识库文档创建/更新后自动将文档内容向量化并存入 Qdrant

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/knowledge-base/semantic-search 携带自然语言查询，返回语义最相关的知识库文档列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 向量化服务不可用时文档正常保存，向量化任务进入重试队列

