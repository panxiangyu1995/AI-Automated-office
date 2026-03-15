# Design: 向量数据库初始化

## 架构设计

### 存储抽象层

```
┌─────────────────────────────────────────────────────────────┐
│                    VectorStore Trait                         │
├─────────────────────────────────────────────────────────────┤
│  + insert(id, vector, metadata) -> Result<()>               │
│  + insert_batch(items) -> Result<()>                        │
│  + search(vector, k, filter) -> Result<Vec<SearchResult>>   │
│  + delete(id) -> Result<()>                                 │
│  + update(id, vector, metadata) -> Result<()>               │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│  SqliteVecStore │            │  QdrantStore    │
│  (本地模式)      │            │  (云端模式)      │
└─────────────────┘            └─────────────────┘
```

### 混合搜索架构 (ADR-014)

```
┌─────────────────────────────────────────────────────────────┐
│                    HybridSearchEngine                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Query ──┬──► VectorSearch ──► VectorResults ──┐            │
│          │                                      │            │
│          └──► BM25Search ──► BM25Results ──────┤            │
│                                                 ▼            │
│                                          RRF Fusion          │
│                                                 │            │
│                                                 ▼            │
│                                          FinalResults        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## SQLite-vec 集成

### 表结构

```sql
-- 向量存储表
CREATE VIRTUAL TABLE vec_items USING vec0(
    id TEXT PRIMARY KEY,
    embedding FLOAT[1536],  -- OpenAI ada-002 维度
    content TEXT,
    metadata TEXT,          -- JSON
    created_at INTEGER
);

-- BM25 全文索引
CREATE VIRTUAL TABLE text_index USING fts5(
    id,
    content,
    metadata,
    tokenize='porter unicode61'
);
```

### Rust实现

```rust
use sqlite_vec::Vector;

pub struct SqliteVecStore {
    conn: Connection,
    dimension: usize,
}

impl VectorStore for SqliteVecStore {
    async fn insert(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()> {
        let vector_blob = Vector::from_slice(vector);
        let content = metadata.get("content").and_then(|v| v.as_str()).unwrap_or("");
        self.conn.execute(
            "INSERT INTO vec_items (id, embedding, content, metadata, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, vector_blob, content, metadata.to_string(), chrono::Utc::now().timestamp()]
        )?;
        Ok(())
    }

    async fn search(&self, vector: &[f32], k: usize, filter: Option<&str>) -> Result<Vec<SearchResult>> {
        let query_vector = Vector::from_slice(vector);
        let filter_clause = filter.map(|f| format!("WHERE {}", f)).unwrap_or_default();
        
        let results = self.conn.query_map(
            &format!("SELECT id, metadata, vec_distance_cosine(embedding, ?1) as distance 
                      FROM vec_items {} ORDER BY distance LIMIT ?", filter_clause),
            params![query_vector, k as i32],
            |row| Ok(SearchResult {
                id: row.get(0)?,
                metadata: row.get::<_, String>(1)?.parse().unwrap(),
                score: 1.0 - row.get::<_, f64>(2)?,
            })
        )?;
        
        Ok(results.collect())
    }
}
```

### 向量维度与归一化

- 向量维度由 Embedding 配置驱动
- 写入前执行归一化以保持距离度量一致

### 过滤语法

- 过滤条件采用受控语法并映射到结构化参数
- 不允许拼接原始 SQL

## Qdrant 云端集成

```rust
pub struct QdrantStore {
    client: QdrantClient,
    collection_name: String,
}

impl VectorStore for QdrantStore {
    async fn insert(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()> {
        let point = PointStruct::new(
            id.to_string(),
            vector.to_vec(),
            metadata.clone(),
        );
        self.client.upsert_points(&self.collection_name, vec![point], None).await?;
        Ok(())
    }

    async fn search(&self, vector: &[f32], k: usize, filter: Option<&str>) -> Result<Vec<SearchResult>> {
        let results = self.client.search_points(&SearchPoints {
            collection_name: self.collection_name.clone(),
            vector: vector.to_vec(),
            limit: k as u64,
            filter: filter.map(|f| Filter::from_json(f)).transpose()?,
            ..Default::default()
        }).await?;
        
        Ok(results.result.into_iter().map(|r| SearchResult {
            id: r.id.to_string(),
            metadata: serde_json::to_value(r.payload).unwrap(),
            score: r.score,
        }).collect())
    }
}
```

### Qdrant Collection 参数

- 距离度量统一配置为 cosine
- HNSW 参数与 payload 索引在初始化时写入

## RRF 融合算法

```rust
pub fn reciprocal_rank_fusion(
    vector_results: Vec<SearchResult>,
    bm25_results: Vec<SearchResult>,
    vector_weight: f32,  // 默认 0.6
    bm25_weight: f32,    // 默认 0.4
    k: usize,            // 常数，默认 60
) -> Vec<SearchResult> {
    let mut scores: HashMap<String, f32> = HashMap::new();
    let mut metadata_map: HashMap<String, serde_json::Value> = HashMap::new();

    // 向量搜索得分
    for (rank, result) in vector_results.iter().enumerate() {
        let rrf_score = vector_weight / (k as f32 + rank as f32 + 1.0);
        *scores.entry(result.id.clone()).or_default() += rrf_score;
        metadata_map.entry(result.id.clone()).or_insert_with(|| result.metadata.clone());
    }

    // BM25搜索得分
    for (rank, result) in bm25_results.iter().enumerate() {
        let rrf_score = bm25_weight / (k as f32 + rank as f32 + 1.0);
        *scores.entry(result.id.clone()).or_default() += rrf_score;
        metadata_map.entry(result.id.clone()).or_insert_with(|| result.metadata.clone());
    }

    // 排序并返回
    let mut results: Vec<_> = scores.into_iter()
        .map(|(id, score)| SearchResult {
            id,
            metadata: metadata_map.remove(&id).unwrap(),
            score,
        })
        .collect();
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    results
}
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `src-tauri/src/vector/mod.rs` | 向量模块入口 |
| `src-tauri/src/vector/store.rs` | VectorStore Trait |
| `src-tauri/src/vector/sqlite_vec.rs` | SQLite-vec 实现 |
| `src-tauri/src/vector/qdrant.rs` | Qdrant 实现 |
| `src-tauri/src/vector/embedding.rs` | 向量嵌入服务 |
| `src-tauri/src/vector/hybrid.rs` | 混合搜索引擎 |
