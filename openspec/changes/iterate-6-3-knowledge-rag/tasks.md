# 任务: 知识库RAG功能

## 步骤清单

### Task 1: 完善Hybrid Retrieval
- [ ] 修改 `agent/memory/retrieval/hybrid.rs`
- [ ] 实现并行向量检索和BM25检索
- [ ] 实现RRF融合算法

### Task 2: 完善RAG Pipeline
- [ ] 修改 `knowledge/pipeline/pipeline.rs`
- [ ] 实现检索请求构建
- [ ] 实现结果组装和过滤
- [ ] 添加缓存支持

### Task 3: Agent集成
- [ ] 修改 `agent/knowledge_retrieval.rs`
- [ ] 实现PromptBuilder集成
- [ ] 实现上下文注入

### Task 4: 性能优化
- [ ] 添加检索结果缓存
- [ ] 优化查询并行度
- [ ] 添加性能监控

### Task 5: 测试验证
- [ ] 单元测试: RRF融合算法
- [ ] 集成测试: 混合检索端到端
- [ ] 性能测试: 验证 < 500ms
