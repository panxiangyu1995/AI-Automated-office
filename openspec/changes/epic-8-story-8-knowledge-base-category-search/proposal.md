## Why

As a 企业用户，我需要 按分类浏览和搜索知识库，以便 可以快速找到需要的知识文档。这是 Epic 8 的关键功能点。

## What Changes

- GET /api/v1/knowledge-base/categories 返回知识库分类树形结构
- GET /api/v1/knowledge-base/search?keyword=合同模板&category=法务 返回匹配的知识库文档列表，支持全文搜索
- GET /api/v1/knowledge-base/documents/{id} 返回知识库文档详情（含内容、版本历史、关联分类）

## Capabilities

### New Capabilities
- `knowledge-base-category-search`: 知识库分类与搜索的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
