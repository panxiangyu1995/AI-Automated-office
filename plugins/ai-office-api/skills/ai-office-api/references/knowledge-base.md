# Knowledge Base 知识库模块

Base: `/api/v1`

## Documents（文档）

### POST /enterprises/:enterprise_id/kb/docs
创建知识库文档。
- **Auth**: JWT
- **Body**: `{ "title": "string", "category_id?": "UUID", "content": "string", "summary?": "string", "tags?": ["string"] }`

### GET /enterprises/:enterprise_id/kb/docs
列出知识库文档（分页）。
- **Query**: `?page=1&page_size=20`

### POST /kb/docs/:id/chunk
对文档进行分块（向量化预处理）。
- **Path**: `id` = 文档 ID

### GET /kb/docs/:id/chunks
获取文档分块列表。

## Categories（分类）

### POST /enterprises/:enterprise_id/kb/categories
创建知识库分类。
- **Body**: `{ "name": "string", "parent_id?": "UUID" }`

### GET /enterprises/:enterprise_id/kb/categories
列出知识库分类。

## Semantic Search（语义搜索）

### GET /enterprises/:enterprise_id/kb/semantic-search
语义搜索知识库文档。
- **Query**: `?q=搜索关键词`
