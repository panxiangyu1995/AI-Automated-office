# Proposal: Agent Runtime 架构重构 - Phase B: 核心执行环路

## Why

当前 Agent 执行链路跨越 10+ 层调用（AgentRuntimeState → LlmAgentProvider → DualAgentProvider → LlmProvider → 具体 Provider），导致：
1. 代码理解需要追踪多个文件
2. 性能开销（每层抽象的运行时成本）
3. 调试困难（调用栈深）

Phase B 聚焦于创建单文件核心执行引擎 `agent_loop.rs`，将所有核心逻辑内聚到一个文件，像 Claude Code 的 `QueryEngine.ts` 一样，使工程师可以通过阅读一个文件理解整个 Agent 的执行流程。

## What Changes

- **新增 `agent_loop.rs`**：单文件 Agent 执行引擎，包含完整的消息处理、LLM 调用、工具执行循环、上下文压缩触发
- **迁移 LlmAgentProvider 逻辑**：将 LlmAgentProvider 的 complete 方法逻辑迁移到 StandardAgentLoop
- **迁移 DualAgentProvider 逻辑**：将 Plan/Act 双模式逻辑迁移到 AgentLoop 内部作为 `AgentMode` 参数
- **简化 Provider 调用**：AgentLoop 直接调用 Provider，不经过多层包装

## Capabilities

### Modified Capabilities

- `agent-loop`: 新增单文件执行引擎 `agent_loop.rs`，替代分散在多个文件中的执行逻辑
- `agent-provider`: Provider 调用从 3 层包装简化为直接调用

## Impact

### 后端

- `src-tauri/src/agent/agent_loop.rs` (新增 ~800 行)
- `src-tauri/src/agent/provider.rs` - 添加 AgentLoop trait
- `src-tauri/src/agent/mod.rs` - 导出新模块

### API 契约

- **无破坏性变更**：对外暴露的 Tauri 命令保持不变
- `AgentRuntimeState` 作为统一状态入口保持兼容

### 测试

- 新增 `agent_loop` 相关单元测试
- 现有 `cargo test` 全部通过
