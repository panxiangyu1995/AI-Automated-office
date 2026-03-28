# Knowledge Base RAG - 任务清单

## Phase 1: 文档处理管道基础

### Task 1.1: 创建knowledge模块结构
- 创建 `src-tauri/src/knowledge/mod.rs`
- 定义核心数据结构（DocumentMetadata, DocumentChunk等）
- 定义错误类型和结果类型
- 添加模块导出到 `lib.rs`

### Task 1.2: 实现DocumentPipeline核心
- 创建 `src-tauri/src/knowledge/pipeline.rs`
- 实现PipelineStage状态机
- 实现ProcessingTask管理
- 实现进度回调机制

### Task 1.3: 实现基础解析器
- 创建 `src-tauri/src/knowledge/parser.rs`
- 实现ParserRegistry
- 实现TxtParser
- 实现MarkdownParser

### Task 1.4: 实现固定大小分块
- 创建 `src-tauri/src/knowledge/chunker.rs`
- 实现DocumentChunker
- 实现FixedSize策略
- 实现Token计数器

## Phase 2: 高级解析与分块

### Task 2.1: 实现PDF解析器
- 集成pdf解析库（pdf-extract或类似）
- 实现文本提取
- 实现表格提取（可选）
- 实现OCR支持（可选）

### Task 2.2: 实现Word解析器
- 集成docx解析库
- 实现文本提取
- 保留格式信息
- 提取元数据

### Task 2.3: 实现语义分块策略
- 实现Semantic策略
- 基于句子边界分块
- 基于段落边界分块
- 基于语义相似度分块

### Task 2.4: 实现递归分块策略
- 实现Recursive策略
- 支持自定义分隔符
- 支持嵌套分块
- 支持重叠分块

## Phase 3: RAG集成

### Task 3.1: 实现RagContextBuilder
- 创建 `src-tauri/src/knowledge/context_builder.rs`
- 实现上下文构建逻辑
- 实现Token预算控制
- 实现上下文格式化

### Task 3.2: 集成混合搜索
- 扩展现有HybridSearchEngine
- 实现作用域过滤
- 实现RRF融合
- 实现结果去重

### Task 3.3: 实现相关性重排序
- 实现RerankService接口
- 集成重排序模型（可选）
- 实现基于相关性的排序
- 实现多样性优化

### Task 3.4: 实现Tauri命令
- 创建 `src-tauri/src/knowledge/commands.rs`
- 实现upload_document命令
- 实现search_knowledge命令
- 实现get_document_status命令

## Phase 4: 增量更新与优化

### Task 4.1: 实现增量更新机制
- 创建 `src-tauri/src/knowledge/incremental.rs`
- 实现文档变更检测
- 实现增量索引更新
- 实现索引清理

### Task 4.2: 实现文档版本管理
- 实现文档版本存储
- 实现版本回滚
- 实现版本差异计算

### Task 4.3: 性能优化
- 实现批量处理优化
- 实现缓存策略
- 实现并发控制
- 性能监控

### Task 4.4: 前端集成
- 创建DocumentUploader组件
- 创建KnowledgeSearchPanel组件
- 实现文档状态显示
- 实现搜索结果展示

## 依赖关系

```
Task 1.1 ─┬─> Task 1.2 ─┬─> Task 1.3 ─> Task 2.1
          │             │
          │             └─> Task 1.4 ─> Task 2.3
          │                              │
          └─> Task 3.1 ─> Task 3.2 ─> Task 3.3 ─> Task 3.4
                                                    │
          ┌─────────────────────────────────────────┘
          │
          └─> Task 4.1 ─> Task 4.2 ─> Task 4.3 ─> Task 4.4
```

## 估算

| Phase | 任务数 | 预估工时 |
|-------|--------|----------|
| Phase 1 | 4 | 3天 |
| Phase 2 | 4 | 4天 |
| Phase 3 | 4 | 3天 |
| Phase 4 | 4 | 3天 |
| **总计** | **16** | **13天** |
