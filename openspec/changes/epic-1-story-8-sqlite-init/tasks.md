# Tasks: SQLite本地存储初始化 (Story 1.8)

> **依赖**: 无（可与Story 1.6并行）

## 任务列表

### 任务 1: 创建 SQLite 连接模块
- **描述**: 创建 SQLite 连接管理器，支持跨平台路径
- **文件**: `src-tauri/src/storage/sqlite.rs`
- **验收**: 数据库文件在正确位置创建

### 任务 2: 创建本地会话表 (sessions)
- **描述**: 创建会话模型和存储接口
- **文件**: `src-tauri/src/storage/session_store.rs`
- **验收**: 会话可 CRUD

### 任务 3: 创建消息记录表 (messages)
- **描述**: 创建消息模型和存储接口
- **文件**: `src-tauri/src/storage/message_store.rs`
- **验收**: 消息可存储和查询

### 任务 4: 创建同步队列表 (sync_queue)
- **描述**: 创建同步队列模型和操作接口
- **文件**: `src-tauri/src/storage/sync_queue.rs`
- **验收**: 队列操作正常

### 任务 5: 创建记忆事实表 (memory_facts)
- **描述**: 创建 L1 记忆层存储接口
- **文件**: `src-tauri/src/storage/memory_store.rs`
- **验收**: 记忆可存储、查询、更新

### 任务 6: 创建检查点元数据表 (checkpoints)
- **描述**: 创建检查点存储接口
- **文件**: `src-tauri/src/storage/checkpoint_store.rs`
- **验收**: 检查点元数据可管理

### 任务 7: 创建上下文摘要表 (context_summaries)
- **描述**: 创建上下文摘要存储
- **文件**: `src-tauri/src/storage/migrations/v2_context_summaries.rs`
- **验收**: 摘要可存储

### 任务 8: 实现数据库版本迁移
- **描述**: 实现迁移框架，支持版本管理
- **文件**: `src-tauri/src/storage/migrations/mod.rs`
- **验收**: 迁移可执行，版本正确记录

### 任务 9: 实现租户数据隔离
- **描述**: 为每个租户创建独立的数据库文件
- **文件**: `src-tauri/src/storage/sqlite.rs`
- **验收**: 不同租户数据隔离

## 执行顺序

1. 任务 1（SQLite连接）
2. 任务 8（迁移框架）
3. 任务 2-7（表结构）
4. 任务 9（租户隔离）

## 测试要点

- [ ] 数据库文件正确创建
- [ ] 所有表创建成功
- [ ] 迁移可执行
- [ ] CRUD 操作正常
- [ ] 租户数据隔离生效
