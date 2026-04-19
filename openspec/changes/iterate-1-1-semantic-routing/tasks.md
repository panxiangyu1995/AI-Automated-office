# 任务拆分 - 语义路由实现

## 任务清单

### Task 1: 添加语义路由配置类型

**文件**: `src-tauri/src/agent/routing_types.rs`

**步骤**:
1. 在 `RoutingRule` 结构体中添加 `embedding_hint: Option<String>` 字段
2. 添加 `SemanticRoutingConfig` 结构体
3. 添加 `SemanticRoutingConfig::default()` 实现

**验收标准**:
- [ ] `SemanticRoutingConfig` 结构体存在
- [ ] 包含 `enabled`, `threshold`, `top_k`, `embedding_model` 字段

---

### Task 2: 创建 SemanticRouter

**文件**: `src-tauri/src/agent/router/semantic.rs` (新建)

**步骤**:
1. 定义 `SemanticRouter` 结构体
2. 实现 `SemanticRouter::new()`
3. 实现 `SemanticRouter::match_rules()` 方法
4. 实现 `cosine_similarity()` 函数
5. 实现 `get_or_compute_embedding()` 方法（含缓存）
6. 添加 LRU 缓存依赖

**验收标准**:
- [ ] `SemanticRouter` 结构体存在
- [ ] `match_rules()` 返回 Vec<(RoutingRule, f64)>
- [ ] `cosine_similarity()` 计算正确
- [ ] 缓存机制正常工作

---

### Task 3: 集成 SemanticRouter 到 SubAgentRoutingService

**文件**: `src-tauri/src/agent/routing.rs`

**步骤**:
1. 添加 `semantic_router: Option<Arc<SemanticRouter>>` 字段
2. 添加 `with_semantic_router()` builder 方法
3. 修改 `calculate_match_score()` 方法，调用 `semantic_match()`
4. 在 `MatchStrategy::Semantic` 分支调用 `semantic_router`

**验收标准**:
- [ ] `SemanticRouter` 成功集成
- [ ] 语义路由匹配返回正确结果
- [ ] 无 EmbeddingService 时回退到关键词匹配

---

### Task 4: 添加单元测试

**文件**: `src-tauri/src/agent/routing.rs` (tests 模块)

**步骤**:
1. 测试 `cosine_similarity()` 正确性
2. 测试 `SemanticRouter::match_rules()` 
3. 测试缓存机制
4. 测试阈值过滤

**验收标准**:
- [ ] 所有单元测试通过
- [ ] 覆盖边界情况（零向量、空输入）

---

### Task 5: 集成测试

**文件**: `src-tauri/tests/integration/routing_test.rs` (新建)

**步骤**:
1. 创建完整的路由测试场景
2. 测试语义匹配 vs 关键词匹配
3. 测试 Top-K 排序
4. 测试 EmbeddingService 不可用时的回退

**验收标准**:
- [ ] 集成测试通过
- [ ] 语义路由匹配准确率 > 80%
