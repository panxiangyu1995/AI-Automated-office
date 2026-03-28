## 功能规格

### FR14-11: 记忆检索支持混合搜索（向量检索 + BM25关键词检索）

**描述**: 记忆检索采用混合搜索策略，提高召回率和准确率。

**检索策略**:
1. **向量检索**: 语义相似度搜索
2. **BM25检索**: 关键词匹配搜索
3. **RRF融合**: Reciprocal Rank Fusion排序

**实现**:
```rust
pub struct HybridSearchEngine<S, B>
where
    S: VectorStore,
    B: Bm25Store,
{
    vector_store: S,
    bm25_store: B,
    config: HybridSearchConfig,
}

impl<S, B> HybridSearchEngine<S, B> {
    pub async fn search(&self, query_text: &str, query: VectorQuery) -> Result<Vec<SearchResult>>;
}
```

**验证**:
- 向量检索正常
- BM25检索正常
- RRF融合正确
- 检索响应时间 < 200ms

---

### FR14-12: 文档处理管道

**描述**: 完整的文档处理流程，支持多种文档格式。

**支持格式**:
- PDF
- Word (.docx)
- Excel (.xlsx)
- TXT
- Markdown
- HTML
- JSON
- CSV

**处理阶段**:
1. Upload - 文档上传
2. Validate - 格式验证
3. Parse - 内容解析
4. Chunk - 智能分块
5. Embed - 向量化
6. Index - 索引存储

**验证**:
- 支持所有格式解析
- 处理进度可追踪
- 错误可恢复

---

### FR14-13: 智能分块策略

**描述**: 多种智能分块策略，适应不同文档类型。

**分块策略**:
1. **FixedSize**: 固定大小分块
   - chunk_size: 块大小（tokens）
   - overlap: 重叠大小

2. **Semantic**: 语义分块
   - min_chunk_size: 最小块大小
   - max_chunk_size: 最大块大小
   - similarity_threshold: 相似度阈值

3. **Recursive**: 递归分块
   - chunk_size: 目标块大小
   - chunk_overlap: 重叠大小
   - separators: 分隔符列表

4. **Sentence**: 句子分块
   - max_sentences: 最大句子数
   - overlap_sentences: 重叠句子数

**验证**:
- 各策略正确实现
- 块边界合理
- 元数据正确保留

---

### FR14-14: Embedding服务集成

**描述**: 集成多种Embedding模型服务。

**支持模型**:
- OpenAI text-embedding-ada-002
- OpenAI text-embedding-3-small
- OpenAI text-embedding-3-large
- 本地模型（通过MCP）

**功能**:
- 批量Embedding
- 缓存机制
- 维度标准化
- 降级策略

**验证**:
- 多模型支持正常
- 批量处理效率高
- 缓存命中率 > 80%

---

### FR14-15: 增量更新机制

**描述**: 文档更新时智能增量更新索引。

**更新策略**:
1. **内容哈希检测**: 检测内容变化
2. **增量索引**: 只更新变化部分
3. **索引清理**: 自动清理过期索引
4. **版本管理**: 支持版本回滚

**验证**:
- 增量更新正确
- 无重复索引
- 版本回滚正常

---

### FR14-16: RAG上下文构建

**描述**: 为Agent提供RAG上下文。

**功能**:
- Token预算控制
- 相关性排序
- 多源合并
- 格式化输出

**输出格式**:
```markdown
## 相关知识上下文

### 来源 1 (相关度: 0.95)
[文档内容]

### 来源 2 (相关度: 0.87)
[文档内容]
```

**验证**:
- Token预算正确
- 相关性排序合理
- 格式化输出正确

---

## 数据类型

### DocumentMetadata

```typescript
interface DocumentMetadata {
  documentId: string;
  filename: string;
  documentType: DocumentType;
  fileSize: number;
  mimeType: string;
  checksum: string;
  tenantId: string;
  departmentId?: string;
  uploadedBy: string;
  uploadedAt: number;
  indexedAt?: number;
  status: DocumentStatus;
  chunkCount: number;
  totalTokens: number;
  tags: string[];
  customMetadata?: Record<string, unknown>;
}
```

### DocumentChunk

```typescript
interface DocumentChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  startOffset: number;
  endOffset: number;
  embedding?: number[];
  metadata: ChunkMetadata;
}
```

### RagContext

```typescript
interface RagContext {
  query: string;
  chunks: RetrievedItem[];
  totalTokens: number;
  retrievalTimeMs: number;
}
```

## 错误码

| 错误码 | 描述 |
|--------|------|
| `RAG_001` | 文档不存在 |
| `RAG_002` | 文档解析失败 |
| `RAG_003` | Embedding服务不可用 |
| `RAG_004` | 向量索引失败 |
| `RAG_005` | 检索超时 |
| `RAG_006` | 文件过大 |
| `RAG_007` | 不支持的格式 |

## 性能指标

| 指标 | 目标值 |
|------|--------|
| 文档上传处理时间 | < 30s (10MB文档) |
| 向量检索延迟 | < 100ms |
| 混合搜索延迟 | < 200ms |
| 分块吞吐量 | > 100 chunks/s |
| Embedding吞吐量 | > 50 chunks/s |
| 最大文档大小 | 100MB |
| 最大块大小 | 8KB |
| 最小块大小 | 100B |
