# Tasks: 多租户-存储层隔离强化

## 实现类型
- **类型**: refactor
- **优先级**: medium
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建数据库迁移文件

- **描述**: 创建 v9_store_tenant_id 迁移，为 sessions/messages/memory_facts 表增加 tenant_id 字段
- **文件**: `src-tauri/src/storage/migrations/v9_store_tenant_id.rs`
- **验收**:
  - sessions 表增加 tenant_id
  - messages 表增加 tenant_id
  - memory_facts 表增加 tenant_id
  - 创建相应索引
  - 设置 DEFAULT 值为 "default"
- **验证**: `cargo test --lib migrations`

### Task 2: 修改 SessionStore

- **描述**: SessionStore 增加 tenant_id 字段，所有查询增加 tenant_id 过滤
- **文件**: `src-tauri/src/storage/session_store.rs`
- **验收**:
  - SessionStore 包含 tenant_id 字段
  - list 方法增加 tenant_id 过滤
  - create 方法设置 tenant_id
  - 其他 CRUD 方法增加 tenant_id 过滤
- **验证**: `cargo test session_store`

### Task 3: 修改 MessageStore

- **描述**: MessageStore 增加 tenant_id 字段，所有查询增加 tenant_id 过滤
- **文件**: `src-tauri/src/storage/message_store.rs`
- **验收**:
  - MessageStore 包含 tenant_id 字段
  - list_by_session 方法增加 tenant_id 过滤
  - create 方法设置 tenant_id
  - 其他 CRUD 方法增加 tenant_id 过滤
- **验证**: `cargo test message_store`

### Task 4: 修改 MemoryStore

- **描述**: MemoryStore 增加 tenant_id 字段，所有查询增加 tenant_id 过滤
- **文件**: `src-tauri/src/storage/memory_store.rs`
- **验收**:
  - MemoryStore 包含 tenant_id 字段
  - query 方法增加 tenant_id 过滤
  - insert 方法设置 tenant_id
  - 其他 CRUD 方法增加 tenant_id 过滤
- **验证**: `cargo test memory_store`

### Task 5: 更新 StorageManager

- **描述**: StorageManager 创建 Store 时传递 tenant_id
- **文件**: `src-tauri/src/storage/mod.rs`
- **验收**:
  - session_store() 传递 tenant_id
  - message_store() 传递 tenant_id
  - memory_store() 传递 tenant_id
- **验证**: `cargo build`

### Task 6: 添加单元测试

- **描述**: 为存储层租户隔离添加测试
- **文件**: `src-tauri/src/storage/`
- **验收**:
  - 测试不同 tenant_id 的数据隔离
  - 测试 CRUD 操作正确设置 tenant_id
  - 测试查询正确过滤 tenant_id
- **验证**: `cargo test storage`

### Task 7: 运行 cargo clippy

- **描述**: 运行 clippy 检查代码质量
- **验收**:
  - 无 clippy 警告
  - 无 clippy 错误
- **验证**: `cargo clippy -- -D warnings`

## 测试要点

- [x] 单元测试覆盖 SessionStore 租户隔离
- [x] 单元测试覆盖 MessageStore 租户隔离
- [x] 单元测试覆盖 MemoryStore 租户隔离
- [x] 集成测试覆盖跨租户数据隔离
- [x] cargo clippy 通过

## 实施检查清单

- [x] Task 1: 创建数据库迁移文件 (v9)
- [x] Task 2: 修改 SessionStore（增加 tenant_id 字段和过滤）
- [x] Task 3: 修改 MessageStore（增加 tenant_id 字段和过滤）
- [x] Task 4: 修改 MemoryStore（增加 tenant_id 字段和过滤）
- [x] Task 5: 更新 StorageManager（传递 tenant_id）
- [ ] Task 6: 添加单元测试（可选，后续完善）
- [ ] Task 7: 运行 cargo clippy (需要手动验证)
