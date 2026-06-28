# Design: Agent Runtime 架构重构 - Phase A: Provider 抽象合并

## 优化前架构

```
AgentProvider trait (provider.rs)
  ↓
LlmAgentProvider (llm_agent_provider.rs)      ← 删除
  ↓
DualAgentProvider (dual_agent_provider.rs)   ← 删除
  ↓
LlmProvider trait (llm_provider/mod.rs)       ← 合并到 AgentProvider
  ↓
ZhipuProvider / DeepSeekProvider / ... (llm_provider/)
```

## 优化后架构

```
AgentProvider trait (provider.rs, 扩展)
  ↓
ZhipuProvider / DeepSeekProvider / ... (llm_provider/)
  ↓
AgentLoop (agent_loop.rs)                   ← 新增
  ├── Plan/Act 模式逻辑内联
  └── StandardAgentLoop 实现
```

## 详细设计

### A1.1 扩展 AgentProvider trait

**文件**: `src-tauri/src/agent/provider.rs`

保留 `ProviderRequest` / `ProviderResponse` / `AgentProvider` trait，新增 `AgentLoop` trait：

```rust
#[async_trait]
pub trait AgentProvider: Send + Sync {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse>;
    async fn stream_complete(&self, request: ProviderRequest) -> AgentResult<StreamResponse>;
}

#[async_trait]
pub trait AgentLoop: Send + Sync {
    async fn run(&self, request: LoopRequest) -> AgentResult<LoopResponse>;
    async fn stream_run(&self, request: LoopRequest) -> AgentResult<LoopStreamResponse>;
}
```

### A1.2 删除空壳包装层

**删除文件**:
- `src-tauri/src/agent/llm_agent_provider.rs`
- `src-tauri/src/agent/dual_agent_provider.rs`

**更新**: `src-tauri/src/agent/mod.rs` - 删除这两个模块的 `pub mod` 声明。

### A1.3 保留 Provider 实现

**保留目录**: `src-tauri/src/agent/llm_provider/`

ZhipuProvider / DeepSeekProvider / MinimaxProvider / DashScopeProvider / OpenAICompatibleProvider 保持不变，直接实现 `AgentProvider` trait。

### A2.1 创建 RuntimeState 统一状态入口

**文件**: `src-tauri/src/agent/state.rs` (新增)

```rust
pub struct RuntimeState {
    /// 主 Provider（直接持有，不再需要 Arc<RwLock<Arc<...>>>）
    pub provider: Arc<dyn AgentProvider>,
    /// 会话服务
    pub session_service: Arc<RuntimeSessionService>,
    /// 取消信号（轻量 HashSet）
    pub cancellations: Arc<RwLock<HashSet<String>>>,
    /// 配置
    pub config: Arc<RwLock<Option<RuntimeConfig>>>,
}
```

### A2.2 状态迁移策略

**保持向后兼容**:
- `AgentRuntimeState` 保留作为类型别名：`pub type AgentRuntimeState = RuntimeState;`
- 现有代码引用的 `AgentRuntimeState` 无需修改

## 实现要点

1. **不改变 trait 签名**：`AgentProvider::complete()` 签名保持不变，确保所有 Provider 实现兼容
2. **渐进式迁移**：先扩展 `AgentProvider` trait，再删除空壳文件，最后创建 `RuntimeState`
3. **Feature Flag**：如需保留 DualAgentProvider 逻辑，使用 feature flag 控制编译

## 验证方法

```bash
cargo check
cargo build
cargo test --lib
cargo clippy -- -D warnings
```
