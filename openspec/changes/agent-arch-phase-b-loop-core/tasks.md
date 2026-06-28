# Tasks: Agent Runtime 架构重构 - Phase B: 核心执行环路

## 实现类型

- **类型**: refactor（架构重构）
- **优先级**: critical
- **阶段**: 架构升级迭代 Phase B

## 任务列表

### Task B1: 创建 agent_loop.rs 核心文件

- **描述**: 创建 `src-tauri/src/agent/agent_loop.rs`，定义类型、trait 和 StandardAgentLoop 结构体
- **文件**: `src-tauri/src/agent/agent_loop.rs` (新增)
- **验收**: 文件创建，核心类型定义完成
- **验证**: `cargo check`

### Task B2: 实现 AgentLoop Trait

- **描述**: 实现 `AgentLoop` trait 的 `run()` 和 `stream_run()` 方法
- **文件**: `src-tauri/src/agent/agent_loop.rs`
- **验收**: trait 实现完整，可编译
- **验证**: `cargo build`

### Task B3: 实现 LLM 调用逻辑

- **描述**: 实现 `call_llm()` 方法，直接调用 Provider
- **文件**: `src-tauri/src/agent/agent_loop.rs`
- **验收**: LLM 调用链路从 3+ 层简化为 1 层
- **验证**: `cargo test`

### Task B4: 实现工具执行循环

- **描述**: 实现 `execute_tool()` 方法和工具调用循环
- **文件**: `src-tauri/src/agent/agent_loop.rs`
- **验收**: 工具调用循环正常工作
- **验证**: `cargo test --test '*'`

### Task B5: 实现 Plan/Act 双模式

- **描述**: 实现 `AgentMode` 枚举和 Plan/Act 模式切换逻辑
- **文件**: `src-tauri/src/agent/agent_loop.rs`
- **验收**: Plan 模式和 Act 模式可切换
- **验证**: `cargo test`

### Task B6: 实现上下文压缩

- **描述**: 实现 `should_compact()` 和 `compact_messages()` 方法
- **文件**: `src-tauri/src/agent/agent_loop.rs`
- **验收**: 上下文压缩触发逻辑正常
- **验证**: `cargo test`

### Task B7: 更新 mod.rs 导出

- **描述**: 在 `agent/mod.rs` 中添加 `pub mod agent_loop`
- **文件**: `src-tauri/src/agent/mod.rs`
- **验收**: AgentLoop 可从外部访问
- **验证**: `cargo check`

## 测试要点

- [x] 单元测试: agent_loop 相关测试通过
- [x] 集成测试: 完整 Agent 执行流程测试
- [x] 编译检查: `cargo check && cargo build && cargo clippy -- -D warnings`
