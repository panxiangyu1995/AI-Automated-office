# Tasks: Agent Runtime 架构重构 - Phase A: Provider 抽象合并

## 实现类型

- **类型**: refactor（架构重构）
- **优先级**: high
- **阶段**: 架构升级迭代 Phase A

## 任务列表

### Task A1: 扩展 AgentProvider trait

- **描述**: 扩展 `provider.rs` 中的 `AgentProvider` trait，添加 `stream_complete()` 方法
- **文件**: `src-tauri/src/agent/provider.rs`
- **验收**: trait 签名扩展不影响现有实现
- **验证**: `cargo check`

### Task A2: 删除 LlmAgentProvider 包装层

- **描述**: 删除 `llm_agent_provider.rs`，将 LlmAgentProvider 的逻辑内联或删除
- **文件**: `src-tauri/src/agent/llm_agent_provider.rs` (删除)
- **验收**: 文件删除后编译通过
- **验证**: `cargo check && cargo build`

### Task A3: 删除 DualAgentProvider 包装层

- **描述**: 删除 `dual_agent_provider.rs`，Plan/Act 逻辑后续在 AgentLoop 中实现
- **文件**: `src-tauri/src/agent/dual_agent_provider.rs` (删除)
- **验收**: 文件删除后编译通过
- **验证**: `cargo check && cargo build`

### Task A4: 更新 mod.rs 导出

- **描述**: 更新 `agent/mod.rs`，删除已删除模块的 `pub mod` 声明
- **文件**: `src-tauri/src/agent/mod.rs`
- **验收**: 所有导出的模块编译通过
- **验证**: `cargo check`

### Task A5: 创建 RuntimeState 统一状态入口

- **描述**: 创建 `state.rs`，定义统一的 RuntimeState 结构体，提供向后兼容的类型别名
- **文件**: `src-tauri/src/agent/state.rs` (新增)
- **验收**: RuntimeState 可替代 AgentRuntimeState 使用
- **验证**: `cargo test --lib`

## 测试要点

- [x] 单元测试: Provider trait 相关测试继续通过
- [x] 集成测试: 现有 cargo test 全部通过
- [x] 编译检查: `cargo check && cargo build && cargo clippy -- -D warnings`
