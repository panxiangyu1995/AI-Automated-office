## Why

当前项目的 RAG（检索增强生成）架构处于初级阶段，存在以下核心问题：
1. **嵌入缓存缺失**：每次检索都调用嵌入 API，导致成本高、延迟大
2. **检索质量不足**：仅支持简单向量检索，缺乏重排序和混合检索能力
3. **元数据过滤薄弱**：无法基于文档属性（部门、标签、日期等）进行精细化检索
4. **分块策略简单**：仅支持固定大小分块，无法处理复杂文档结构

参考 Dify 的 RAG 实现，需要引入企业级的检索优化能力。

## What Changes

**Phase 1: 嵌入缓存系统**
- 实现基于文本哈希的向量缓存（SQLite 持久化）
- 支持批量嵌入的缓存查询
- 实现 Redis 缓存层（查询嵌入 TTL=600秒）
- 缓存统计和监控 API

**Phase 2: 检索增强**
- 实现 BM25 全文检索引擎
- 实现 Reciprocal Rank Fusion (RRF) 混合检索合并算法
- 实现加权评分重排序（向量分 × 权重 + BM25分 × 权重）
- 支持 Rerank 模型集成（可选）

**Phase 3: 元数据过滤**
- 定义元数据过滤 DSL（支持 eq/ne/gt/lt/contains/in 等操作符）
- 实现 Qdrant Filter 转换器
- 支持多条件组合过滤（AND/OR 逻辑）

**Phase 4: 分块策略优化**
- 实现基于句子的智能分块
- 支持重叠窗口优化
- 实现文档结构感知分块（保留标题层级）

## Capabilities

### New Capabilities

- `rag-embedding-cache`: 嵌入向量缓存系统，支持文本哈希映射和批量查询优化
- `rag-hybrid-search`: 混合检索引擎，融合向量检索和 BM25 全文检索
- `rag-metadata-filter`: 元数据过滤系统，支持多条件组合的精细化检索
- `rag-smart-chunker`: 智能文档分块器，支持句子边界识别和语义分块
- `rag-rerank`: 检索结果重排序，支持加权评分和 Rerank 模型

### Modified Capabilities

- `knowledge-retrieval`: 扩展现有检索 API，支持新的检索配置和过滤参数

## Impact

**后端 (Rust/Tauri)**
- 新增 `src-tauri/src/knowledge/embedding_cache.rs` - 嵌入缓存模块
- 新增 `src-tauri/src/knowledge/filter.rs` - 元数据过滤模块
- 新增 `src-tauri/src/knowledge/rerank.rs` - 重排序模块
- 修改 `src-tauri/src/knowledge/pipeline/pipeline.rs` - 集成缓存和分块优化
- 修改 `src-tauri/src/knowledge/context_builder.rs` - 支持检索配置

**前端**
- 新增 `src/features/knowledge/components/RetrievalConfig.tsx` - 检索配置面板
- 修改 `src/features/session/runtime/knowledgeRetrieval.ts` - 适配新的检索 API

**数据库**
- 新增 `embedding_cache` 表（文本哈希 → 向量映射）
- 新增 `chunk_metadata` 表扩展字段

**依赖**
- rusqlite（已有）
- tokio（已有）
- serde_json（已有）
