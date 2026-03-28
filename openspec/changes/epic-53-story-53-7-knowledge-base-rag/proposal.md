# Knowledge Base RAG - 变更提案

## 问题陈述

当前知识库系统缺少完整的RAG（Retrieval-Augmented Generation）实现：

1. **向量检索未完整集成**: 虽然有vector模块骨架，但未与知识检索服务完整集成
2. **文档处理管道缺失**: 没有文档上传、解析、分块、索引的完整流程
3. **智能分块策略缺失**: 没有语义分块、递归分块等智能分块策略
4. **Embedding服务未完整集成**: 缺少与多种Embedding模型的集成
5. **增量更新机制缺失**: 文档更新时无法智能增量更新索引

## 提议方案

### 核心组件

1. **DocumentPipeline** - 文档处理管道
   - 文档上传与验证
   - 多格式解析（PDF/Word/Excel/TXT/MD）
   - 智能分块
   - Embedding生成
   - 向量索引

2. **DocumentChunker** - 智能分块器
   - 固定大小分块
   - 语义分块
   - 递归分块
   - 段落分块

3. **RagContextBuilder** - RAG上下文构建器
   - 混合搜索（向量 + BM25）
   - RRF融合排序
   - Token预算控制
   - 相关性重排序

4. **ParserRegistry** - 解析器注册表
   - PDF解析器
   - Word解析器
   - Markdown解析器
   - Excel解析器
   - TXT解析器

### 文件结构

```
src-tauri/src/
├── knowledge/
│   ├── mod.rs              # 模块入口
│   ├── pipeline.rs         # 文档处理管道
│   ├── parser.rs           # 文档解析器
│   ├── chunker.rs          # 智能分块器
│   ├── context_builder.rs  # RAG上下文构建器
│   ├── incremental.rs      # 增量更新
│   └── commands.rs         # Tauri命令
├── vector/
│   ├── mod.rs              # 已存在
│   ├── store.rs            # 已存在
│   ├── hybrid.rs           # 已存在
│   └── embedding.rs        # 扩展
└── agent/
    └── knowledge_retrieval.rs  # 扩展现有
```

### 前端集成

```
src/features/knowledge/
├── components/
│   ├── DocumentUploader.tsx
│   ├── DocumentList.tsx
│   ├── DocumentStatus.tsx
│   └── KnowledgeSearchPanel.tsx
├── hooks/
│   ├── useDocumentUpload.ts
│   ├── useKnowledgeSearch.ts
│   └── useDocumentStatus.ts
└── types/
    └── knowledge.ts
```

## 实现计划

### Phase 1: 文档处理管道基础
- 创建knowledge模块结构
- 实现DocumentPipeline核心逻辑
- 实现基础解析器（TXT/MD）
- 实现固定大小分块

### Phase 2: 高级解析与分块
- 实现PDF解析器
- 实现Word解析器
- 实现语义分块策略
- 实现递归分块策略

### Phase 3: RAG集成
- 实现RagContextBuilder
- 集成混合搜索
- 实现Token预算控制
- 实现相关性重排序

### Phase 4: 增量更新与优化
- 实现增量更新机制
- 实现文档版本管理
- 性能优化
- 监控与日志

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| PDF解析性能 | 高 | 使用异步处理，支持进度回调 |
| Embedding服务不可用 | 高 | 实现降级策略，使用本地模型 |
| 大文档处理超时 | 中 | 分片处理，支持断点续传 |
| 向量索引膨胀 | 中 | 实现索引压缩和清理策略 |

## 验收标准

- [ ] 支持PDF/Word/Excel/TXT/MD格式文档上传
- [ ] 文档处理时间 < 30s (10MB文档)
- [ ] 向量检索延迟 < 100ms
- [ ] 混合搜索延迟 < 200ms
- [ ] 支持增量更新
- [ ] 支持文档删除和索引清理
