# Proposal: Agent Runtime 架构重构 - Phase A: Provider 抽象合并

## Why

当前 Agent Runtime 存在 6 层 Provider 抽象链路（AgentProvider trait → LlmAgentProvider → DualAgentProvider → LlmProvider trait → 具体 Provider 实现），每层抽象都引入额外状态管理和错误传递开销。这导致代码理解成本高、维护困难，且与 Claude Code 的直接 SDK 调用模式存在显著差距。

Phase A 聚焦于基础设施层优化：合并 Provider 抽象、统一状态管理入口，为 Phase B 的核心执行环路重构奠定基础。

## What Changes

- **合并 Provider trait 层**：将 `LlmProvider` trait 合并到 `AgentProvider` trait，消除中间的 `LlmAgentProvider` 和 `DualAgentProvider` 包装层
- **统一状态管理**：`AgentRuntimeState` 的 7+ 个 `Arc<RwLock<...>>` 状态分散管理问题，通过 `RuntimeState` 统一入口解决
- **保持 Plan/Act 逻辑**：DualAgentProvider 的 Plan/Act 分离逻辑保留，作为 `AgentLoop` 的模式参数

## Capabilities

### Modified Capabilities

- `agent-provider`: Provider 抽象从 2 层 trait 合并为 1 层 trait，trait 签名不变（向后兼容），实现位置从 `llm_agent_provider.rs` / `dual_agent_provider.rs` 迁移到 `agent_loop.rs` 内部

## Impact

### 后端

- `src-tauri/src/agent/provider.rs` - 扩展 AgentProvider trait
- `src-tauri/src/agent/llm_agent_provider.rs` - 删除
- `src-tauri/src/agent/dual_agent_provider.rs` - 删除
- `src-tauri/src/agent/mod.rs` - 更新导出
- `src-tauri/src/agent/llm_provider/` - Provider 实现保留（Zhipu/DeepSeek/Minimax/DashScope/OpenAICompatible）

### 测试

- 所有现有 `cargo test` 必须继续通过
- Provider 相关的单元测试保持兼容

### API 契约

- **无破坏性变更**：所有 `agent_*` Tauri 命令签名保持不变
- Provider 切换逻辑（通过 `RuntimeConfig`）保持兼容
