# Proposal: Agent Runtime 架构重构 - Phase C+D: 子系统精简与清理

## Why

Phase A 和 B 完成了 Provider 抽象合并和核心执行环路重构后，剩余模块（路由、记忆、监控）仍存在过度工程化问题：

1. **路由系统**：`SubAgentRoutingService` 实现了 4 种匹配策略、完整风险评估、双确认防误触——90% 用户永远用不到
2. **记忆系统**：分层向量记忆 + RAG 对于 ERP 助手的简单场景过于复杂
3. **监控/审计**：6 个分散的模块（monitoring/monitoring_types/audit/audit_types/audit_siem/events）可以合并

Phase C+D 通过子系统精简和空壳模块清理，将 55+ 模块减少到 ~20 个。

## What Changes

- **简化路由系统**：将 `SubAgentRoutingService`（~700 行）简化为 `SimpleRouter`（~100 行），保留 Keyword 匹配，删除 Semantic/LlmGuided 路由、风险评估、双确认机制
- **精简记忆系统**：保留个人记忆和上下文窗口，简化 `MemoryScope` 枚举，删除未使用的枚举值
- **合并监控模块**：将 6 个监控/审计/事件模块合并为 1 个 `monitoring.rs`
- **删除空壳模块**：`execution_integration.rs`（空壳聚合）、`pilot.rs`（孤立逻辑）、`router/` 目录（未使用）
- **更新 mod.rs**：将导出从 55 个减少到 ~20 个

## Capabilities

### Modified Capabilities

- `agent-routing`: 从 `SubAgentRoutingService` 简化为 `SimpleRouter`
- `agent-memory`: 简化 `MemoryScope` 枚举，保留核心功能
- `agent-monitoring`: 6 个模块合并为 1 个

## Impact

### 后端

- `src-tauri/src/agent/routing.rs` - 重写为 SimpleRouter
- `src-tauri/src/agent/memory/` - 简化 LayeredMemory
- `src-tauri/src/agent/monitoring.rs` - 合并 monitoring + audit + events
- 删除: `execution_integration.rs`, `pilot.rs`, `router/`, `model_router.rs`

### 测试

- 所有现有 `cargo test` 必须继续通过
- 简化后的路由/记忆/监控测试继续工作

### API 契约

- **无破坏性变更**：对外暴露的 Tauri 命令保持不变
- 删除的模块不涉及外部 API
