## ADDED Requirements

### Requirement: 知识库分类与搜索

As a 企业用户，I want 按分类浏览和搜索知识库，So that 可以快速找到需要的知识文档。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/knowledge-base/categories 返回知识库分类树形结构

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/knowledge-base/search?keyword=合同模板&category=法务 返回匹配的知识库文档列表，支持全文搜索

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/knowledge-base/documents/{id} 返回知识库文档详情（含内容、版本历史、关联分类）

