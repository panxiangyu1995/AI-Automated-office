# 规格: 知识库RAG功能

## 类型定义

### RetrievalConfig (已存在)
```rust
pub struct RetrievalConfig {
    pub search_method: SearchMethod,  // Semantic, FullText, Hybrid
    pub top_k: usize,                  // 默认 10
    pub score_threshold: f32,          // 默认 0.0
    pub vector_weight: f32,            // 默认 0.7
    pub bm25_weight: f32,              // 默认 0.3
    pub rrf_k: usize,                  // 默认 60
}
```

### RetrievalResult
```rust
pub struct RetrievalResult {
    pub id: String,
    pub document_id: String,
    pub content: String,
    pub score: f32,
    pub highlights: Vec<String>,
    pub metadata: serde_json::Value,
}
```

## API 规格

### knowledge_search 命令
- **输入**: `query: String, config: RetrievalConfig`
- **输出**: `Result<Vec<RetrievalResult>, String>`
- **性能要求**: < 500ms

### RRF算法参数
- k = 60 (默认)
- vector_weight + bm25_weight = 1.0

## 性能指标

| 指标 | 要求 |
|------|------|
| NFR8-1 记忆向量检索 | < 200ms |
| NFR8-2 知识库混合检索 | < 500ms |
| NFR8-3 错题集规则注入 | < 50ms |
