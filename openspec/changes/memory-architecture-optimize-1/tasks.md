# Tasks: Agent记忆模块架构优化 - 阶段1

## 实现类型
- **类型**: optimize
- **优先级**: high
- **阶段**: 架构升级迭代
- **Epic**: 架构优化

## 任务列表

### Task 1: 创建StorageBackend trait和SQLite实现
- **描述**: 定义存储后端抽象接口和SQLite实现
- **文件**:
  - 新增: `src-tauri/src/agent/memory/storage/backend.rs`
- **验收**: StorageBackend trait定义了execute/query/init_schema方法，SQLite实现可创建表
- **验证**: `cargo test --lib storage::backend`

### Task 2: 重构PersonalMemoryStore使用SQLite
- **描述**: 将PersonalMemoryStore从内存Vec改为SQLite持久化
- **文件**: `src-tauri/src/agent/memory/storage/personal.rs`
- **验收**: add/update/delete/search等操作持久化到SQLite
- **验证**: `cargo test --lib personal`

### Task 3: 重构EnterpriseKnowledgeStore使用SQLite
- **描述**: 将EnterpriseKnowledgeStore从内存改为SQLite持久化
- **文件**: `src-tauri/src/agent/memory/storage/enterprise.rs`
- **验收**: add/update/delete/search等操作持久化到SQLite
- **验证**: `cargo test --lib enterprise`

### Task 4: 修改MemoryService集成HybridRetrievalEngine
- **描述**: 修改MemoryService.search()使用HybridRetrievalEngine进行真正的混合搜索
- **文件**: `src-tauri/src/agent/memory/service.rs`
- **验收**: search()返回混合检索结果（向量+BM25）
- **验证**: `cargo test --lib memory::service`

### Task 5: 修复keyword_search实现
- **描述**: 实现真正的BM25/keyword搜索（使用SQLite FTS5）
- **文件**: `src-tauri/src/agent/memory/retrieval/hybrid.rs`
- **验收**: keyword_search返回非空结果
- **验证**: `cargo test --lib hybrid`

### Task 6: 连接Hook事件到持久化存储
- **描述**: 验证Hook系统生成的item正确持久化
- **文件**: `src-tauri/src/agent/memory/service.rs`
- **验收**: Hook事件触发后，数据可查询到
- **验证**: 集成测试

### Task 7: 实现sync()增量同步逻辑
- **描述**: 实现sync()方法的增量同步（与云端同步）
- **文件**: `src-tauri/src/agent/memory/service.rs`
- **验收**: sync()返回同步结果
- **验证**: `cargo test --lib sync`

### Task 8: 添加Cargo依赖
- **描述**: 添加rusqlite和必要的异步适配依赖
- **文件**: `src-tauri/Cargo.toml`
- **验收**: cargo build成功
- **验证**: `cargo build`

## 测试要点

- [ ] 单元测试覆盖：storage模块、retrieval模块
- [ ] 集成测试覆盖：Hook → Process → Storage 链路
- [ ] 功能回归测试：原有API行为不变
- [ ] 持久化测试：重启后数据不丢失
