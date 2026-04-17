# 设计: 知识库RAG功能

## 1. 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG Pipeline                                │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 1. Query Input                                        │  │
│  └─────────────────────┬───────────────────────────────────┘  │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 2. Hybrid Retrieval (并行执行)                        │  │
│  │   ┌──────────────┐    ┌──────────────┐              │  │
│  │   │ Vector Search │    │  BM25 Search  │              │  │
│  │   └──────┬───────┘    └──────┬───────┘              │  │
│  │          │                   │                       │  │
│  │          └─────────┬─────────┘                       │  │
│  └────────────────────▼───────────────────────────────────┘  │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 3. RRF Fusion (Reciprocal Rank Fusion)                │  │
│  │    score = 1.0 / (k + rank)                          │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       ▼                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 4. Result Assembly                                    │  │
│  │    - content, score, highlights, metadata             │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2. 涉及文件

- `src-tauri/src/knowledge/pipeline/pipeline.rs` - RAG Pipeline主逻辑
- `src-tauri/src/knowledge/retrieval_config.rs` - 检索配置（已有）
- `src-tauri/src/agent/knowledge_retrieval.rs` - Agent集成
- `src-tauri/src/agent/memory/retrieval/hybrid.rs` - 混合检索实现

## 3. 关键实现

### 3.1 Hybrid Retrieval

```rust
pub async fn hybrid_search(
    query: &str,
    config: &RetrievalConfig,
    ctx: &UserContext,
) -> Result<Vec<RetrievalResult>> {
    // 并行执行向量检索和BM25
    let (vector_results, bm25_results) = tokio::join!(
        vector_search(query, config, ctx),
        bm25_search(query, config, ctx),
    );
    
    // RRF融合
    let fused = reciprocal_rank_fusion(
        vector_results?,
        bm25_results?,
        config.rrf_k,
    );
    
    Ok(fused)
}
```

### 3.2 RRF Algorithm

```rust
fn reciprocal_rank_fusion<T: Identifiable>(
    results_a: Vec<(T, f32)>,
    results_b: Vec<(T, f32)>,
    k: usize,
) -> Vec<(T, f32)> {
    let mut scores: HashMap<String, f32> = HashMap::new();
    let mut all_items: HashMap<String, T> = HashMap::new();
    
    // Add scores from first result set
    for (item, score) in results_a {
        let id = item.id();
        scores.insert(id.clone(), 1.0 / (k as f32 + 1.0));
        all_items.insert(id, item);
    }
    
    // Add scores from second result set
    for (item, score) in results_b {
        let id = item.id();
        let entry = scores.entry(id.clone()).or_insert(0.0);
        *entry += 1.0 / (k as f32 + 2.0);
        all_items.insert(id, item);
    }
    
    // Sort by fused score
    let mut sorted: Vec<_> = scores.into_iter()
        .map(|(id, score)| (all_items.remove(&id).unwrap(), score))
        .collect();
    sorted.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    
    sorted
}
```

## 4. 验收标准

- [ ] 支持向量检索+BM25混合检索
- [ ] RRF算法正确融合检索结果
- [ ] 检索结果包含content/score/highlights/metadata
- [ ] NFR8-2: 检索响应时间 < 500ms
- [ ] 支持top_k和score_threshold参数
- [ ] 支持tenant_id隔离
