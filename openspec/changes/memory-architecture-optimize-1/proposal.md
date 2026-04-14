# Proposal: Agent记忆模块架构优化 - 阶段1

## 变更类型
- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

当前Agent记忆模块存在以下架构问题：

1. **存储未持久化** - `PersonalMemoryStore` 使用内存 `Vec<MemoryItem>`，进程重启后数据丢失
2. **向量搜索未实现** - `find_similar()` 方法返回空结果
3. **混合检索未启用** - `HybridRetrievalEngine` 已定义但未集成到 `MemoryService`
4. **BM25搜索为空** - `keyword_search()` 返回空 `Vec`
5. **Hook事件未持久化** - Hook系统生成的记忆未保存到存储
6. **Sync为空实现** - `sync()` 方法只是占位符

## 优化目标

在不改变现有功能的前提下，优化架构以满足生产环境需求：

1. 实现存储持久化（SQLite）
2. 集成混合检索引擎
3. 修复BM25搜索实现
4. 连接Hook事件到持久化存储
5. 实现增量同步逻辑

## 功能不变性保证

以下功能必须保持不变：

- **API接口**：`memory_search/add/update/delete/stats/sync/hook_event` 命令签名
- **数据结构**：`MemoryItem`, `MemoryQuery`, `HookEvent` 类型定义
- **三层架构**：L1 Personal / L2 Enterprise / L3 Graph 权限边界
- **智能更新**：Add/Update/Merge/Delete/None 决策逻辑
- **Hook事件**：SessionStart/UserPromptSubmit/PostToolUse/Stop/SessionEnd 生命周期

## 优化方案

### 1. 存储层重构

```rust
// 新增 storage/backend.rs
pub trait StorageBackend: Send + Sync {
    async fn execute(&self, sql: &str, params: &[&dyn ToSql]) -> Result<()>;
    async fn query<T: FromRow>(&self, sql: &str, params: &[&dyn ToSql]) -> Result<Vec<T>>;
}

pub struct SqliteStorage {
    pool: Pool<Sqlite>,
}

impl StorageBackend for SqliteStorage { ... }
```

### 2. PersonalMemoryStore 重构

```rust
// 优化前
items: Arc<RwLock<Vec<MemoryItem>>>

// 优化后
backend: Arc<dyn StorageBackend>,
table_name: String,
```

### 3. 检索引擎集成

```rust
// MemoryService.search() 优化
pub async fn search(&self, query: &MemoryQuery) -> Result<HybridSearchResult> {
    // 使用 HybridRetrievalEngine 进行真正的混合搜索
    let retrieval_engine = HybridRetrievalEngine::new(
        Arc::clone(&self.vector_store),
        Arc::clone(&self.embedding_service),
        self.config.hybrid_search.clone(),
    );
    retrieval_engine.search(query).await
}
```

### 4. Hook持久化链路

```rust
// MemoryService.on_hook_event() 优化
pub async fn on_hook_event(&self, event: &HookEvent) -> Result<()> {
    let items = self.hook_dispatcher.dispatch_unique(event).await?;
    for item in items {
        // 现在会持久化到SQLite
        self.process_new_item(&item).await?;
    }
    Ok(())
}
```

## 影响范围

### 相关文件
- `src-tauri/src/agent/memory/storage/personal.rs` - 重写
- `src-tauri/src/agent/memory/storage/enterprise.rs` - 重写
- `src-tauri/src/agent/memory/storage/layer.rs` - 扩展trait
- `src-tauri/src/agent/memory/service.rs` - 集成检索引擎
- `src-tauri/src/agent/memory/retrieval/hybrid.rs` - 修复BM25

### 新增文件
- `src-tauri/src/agent/memory/storage/backend.rs` - 存储后端抽象

### 不影响
- `src-tauri/src/agent/memory/types.rs` - 类型定义不变
- `src-tauri/src/agent/memory/hooks/` - Hook逻辑不变
- `src-tauri/src/agent/memory/cognitive/` - 认知层不变
- `src-tauri/src/agent/memory/update/` - 更新决策不变
- 前端 Tauri 命令接口 - API不变

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| SQLite性能瓶颈 | 低 | 中 | 使用连接池，预留索引 |
| 迁移失败 | 低 | 高 | 保留回滚方案 |
| API不兼容 | 极低 | 高 | 仅修改内部实现 |

## 依赖

- **前置依赖**：无
- **后置依赖**：无
- **技术依赖**：`rusqlite`/`sqlx` crate（已在项目中）

## 验证计划

```bash
# 编译验证
cargo clippy -- -D warnings
cargo build

# 单元测试
cargo test --lib

# 集成测试（手动）
1. 启动应用
2. 执行Hook事件 → 验证存储
3. 执行search → 验证检索
4. 重启应用 → 验证持久化
```
