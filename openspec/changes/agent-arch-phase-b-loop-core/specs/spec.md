# Specification: Agent Runtime 架构重构 - Phase B: 核心执行环路

## 约束条件

- `agent_loop.rs` 必须在单文件内包含完整的 Agent 执行逻辑
- Provider 调用链路从 3+ 层简化为直接调用
- AgentMode::Plan 和 AgentMode::Act 双模式逻辑必须保留
- 所有现有功能（工具调用、上下文压缩、进度追踪）必须保留
- 外部 Tauri 命令保持不变

## 验收标准

### B1: agent_loop.rs 创建

- [ ] `agent_loop.rs` 文件创建
- [ ] `AgentLoop` trait 定义完成
- [ ] `StandardAgentLoop` 实现完成
- [ ] `AgentMode` 枚举（Act/Plan）定义完成
- [ ] 核心 `run()` 方法实现完整

### B2: 执行逻辑迁移

- [ ] LlmAgentProvider 的 complete 逻辑迁移完成
- [ ] DualAgentProvider 的 Plan/Act 逻辑迁移完成
- [ ] 工具执行循环逻辑实现完成
- [ ] 上下文压缩触发逻辑实现完成

### B3: 功能完整性

- [ ] 工具调用循环正常工作
- [ ] Plan/Act 模式切换正常
- [ ] 取消信号处理正常
- [ ] `cargo test` 全部通过

## 边界条件

- 工具调用超时：返回错误，不阻塞循环
- 上下文压缩失败：使用原始消息继续
- Plan 模式无 Provider：返回配置错误
