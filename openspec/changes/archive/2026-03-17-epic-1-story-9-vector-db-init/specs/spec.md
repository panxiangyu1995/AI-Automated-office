# Spec: 向量数据库初始化

## 需求来源

| 来源 | 编号 | 描述 |
|------|------|------|
| PRD | FR14-8 | 记忆层 - 语义检索 |
| PRD | FR14-11 | 记忆层 - 事实存储 |
| PRD | FR250 | 知识库 - 文档存储 |
| PRD | FR251 | 知识库 - 向量检索 |
| PRD | FR273 | RAG - 向量搜索 |
| PRD | FR285 | RAG - 混合搜索 |
| PRD | FR286 | RAG - 重排序 |
| PRD | FR287 | RAG - 相关性评分 |
| 架构 | ADR-014 | 混合搜索架构 |
| NFR | NFR8-1 | 检索延迟 < 500ms |
| NFR | NFR8-2 | 召回率 > 95% |

## 验收场景

### 场景 1: 向量存储接口

**Given** 需要存储和检索向量
**When** 使用 VectorStore Trait
**Then** 支持以下操作：
- `insert(id, vector, metadata)` - 插入向量
- `insert_batch(items)` - 批量插入
- `search(vector, k, filter)` - 相似度搜索
- `delete(id)` - 删除向量
- `update(id, vector, metadata)` - 更新向量

### 场景 2: sqlite-vec 本地存储

**Given** 使用本地模式
**When** 初始化 SqliteVecStore
**Then** 加载 sqlite-vec 扩展
**And** 创建虚拟表 `vec_items`
**And** 向量可正常插入和搜索

### 场景 3: Qdrant 云端存储

**Given** 使用云端模式
**When** 初始化 QdrantStore
**Then** 连接 Qdrant 服务
**And** 创建 Collection（如不存在）
**And** 向量可正常插入和搜索

### 场景 4: 向量嵌入生成

**Given** 需要将文本转为向量
**When** 调用 EmbeddingService
**Then** 调用 OpenAI 兼容 API
**And** 返回的向量维度与配置一致

### 场景 4.1: 向量归一化

**Given** 向量写入存储
**When** 写入前进行归一化
**Then** 相似度计算保持一致性

### 场景 5: 混合搜索

**Given** 用户输入查询文本
**When** 执行混合搜索
**Then** 并行执行：
- 向量搜索（语义相似）
- BM25 搜索（关键词匹配）
**And** 合并结果

### 场景 6: RRF 融合

**Given** 向量搜索和 BM25 搜索结果
**When** 应用 RRF 算法
**Then** 计算融合得分：
```
RRF_score(d) = Σ (w_i / (k + rank_i(d)))
```
**And** 按融合得分排序返回

### 场景 7: 模式切换

**Given** 配置文件设置
**When** 切换本地/云端模式
**Then** 使用对应的存储实现
**And** 透明切换，上层代码无感知

### 场景 8: 过滤语法

**Given** 使用过滤条件检索
**When** 提交过滤表达式
**Then** 过滤表达式被解析为结构化条件
**And** 不允许原始 SQL 拼接

## 数据规格

### 向量存储接口

```rust
pub trait VectorStore: Send + Sync {
    async fn insert(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()>;
    async fn insert_batch(&self, items: Vec<VectorItem>) -> Result<()>;
    async fn search(&self, query: VectorQuery) -> Result<Vec<SearchResult>>;
    async fn delete(&self, id: &str) -> Result<()>;
    async fn update(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()>;
    async fn count(&self) -> Result<usize>;
}

pub struct VectorItem {
    pub id: String,
    pub vector: Vec<f32>,
    pub content: Option<String>,
    pub metadata: serde_json::Value,
}

pub struct VectorQuery {
    pub vector: Vec<f32>,
    pub k: usize,
    pub filter: Option<String>,
    pub include_metadata: bool,
}

pub struct SearchResult {
    pub id: String,
    pub score: f32,
    pub metadata: serde_json::Value,
}
```

### sqlite-vec 表结构

```sql
CREATE VIRTUAL TABLE vec_items USING vec0(
    id TEXT PRIMARY KEY,
    embedding FLOAT[1536],
    content TEXT,
    metadata TEXT,
    created_at INTEGER
);

CREATE VIRTUAL TABLE text_index USING fts5(
    id,
    content,
    metadata,
    tokenize='porter unicode61'
);
```

### Embedding 服务配置

```typescript
interface EmbeddingConfig {
  provider: 'openai' | 'zhipu' | 'dashscope' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  dimension: number;
  batchSize: number;
}
```

### 过滤与索引

- 过滤条件限定为字段白名单与受控操作符
- Qdrant 使用 payload 索引提升过滤性能

### 混合搜索配置

```typescript
interface HybridSearchConfig {
  vectorWeight: number;     // 默认 0.6
  bm25Weight: number;       // 默认 0.4
  rrfK: number;             // RRF 常数，默认 60
  maxResults: number;       // 最大结果数
  minScore: number;         // 最小得分阈值
}
```

## API 规格

### 向量嵌入 API

```
POST /api/v1/embeddings
Content-Type: application/json

{
  "input": "需要嵌入的文本",
  "model": "text-embedding-ada-002"
}

Response:
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.0023, 0.0056, ...]
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 10,
    "total_tokens": 10
  }
}
```

### 向量搜索 API

```
POST /api/v1/vector/search
Content-Type: application/json

{
  "query": "搜索文本",
  "k": 10,
  "filter": {"category": "document"},
  "hybrid": true
}

Response:
{
  "results": [
    {
      "id": "doc-001",
      "score": 0.95,
      "metadata": {...},
      "content": "..."
    }
  ],
  "total": 10,
  "latency_ms": 120
}
```

## 性能指标

| 指标 | 目标值 |
|------|--------|
| 向量搜索延迟 | < 200ms |
| 混合搜索延迟 | < 500ms |
| 批量嵌入吞吐 | > 100 条/秒 |
| 召回率@10 | > 95% |
| MRR | > 0.8 |

## 错误处理

| 错误码 | 描述 |
|--------|------|
| `EMBEDDING_FAILED` | 向量嵌入失败 |
| `VECTOR_STORE_ERROR` | 向量存储错误 |
| `QDRANT_CONNECTION_ERROR` | Qdrant 连接失败 |
| `INVALID_VECTOR_DIMENSION` | 向量维度不匹配 |
| `SEARCH_TIMEOUT` | 搜索超时 |
