# Specification: Agent Runtime 架构重构 - Phase A: Provider 抽象合并

## 约束条件

- 现有 Provider 实现（Zhipu/DeepSeek/Minimax/DashScope/OpenAICompatible）必须继续工作
- 所有 Tauri `agent_*` 命令签名保持不变
- `AgentProvider` trait 的 `complete()` 方法签名保持不变
- 所有 `cargo test` 必须继续通过

## 验收标准

### A1: Provider 抽象合并

- [ ] `AgentProvider` trait 扩展完成，包含 `stream_complete()` 方法
- [ ] `LlmAgentProvider` 删除，`cargo check` 无错误
- [ ] `DualAgentProvider` 删除，`cargo check` 无错误
- [ ] ZhipuProvider 直接实现 `AgentProvider` trait
- [ ] DeepSeekProvider 直接实现 `AgentProvider` trait
- [ ] 所有 Provider 实现编译通过

### A2: 状态管理统一

- [ ] `RuntimeState` 结构体创建完成
- [ ] `AgentRuntimeState` 类型别名指向 `RuntimeState`
- [ ] 状态访问模式保持向后兼容
- [ ] `cargo test` 全部通过

## 边界条件

- Provider 初始化失败：返回 `AgentError::ProviderCreation`
- Provider 调用超时：传递超时错误，不吞异常
- 并发调用：保持 `Send + Sync` 约束
