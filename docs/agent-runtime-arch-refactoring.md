# Agent Runtime 架构重构方案

> **文档类型**: 架构优化文档
> **版本**: v1.0
> **日期**: 2026-04-25
> **状态**: 草稿

---

## 摘要

本文档定义了 AI-Automated-office Agent Runtime 架构的重构方案。核心目标是将现有的 **55+ 模块过度抽象架构** 简化为 **Claude Code 风格的三元素架构**（AgentLoop + Tools + Context），在不改变任何现有功能的前提下，提升代码可维护性、降低复杂度、提高执行效率。

**约束铁律**: 本次重构**不添加新功能**、**不删除现有功能**、**不改变业务逻辑**、**保持 API 向后兼容**。

---

## 一、现有架构分析

### 1.1 当前模块结构

```
src-tauri/src/agent/
├── mod.rs                      # 入口，声明 55 个子模块
│
├── [核心抽象层]
├── provider.rs                 # AgentProvider trait（顶层抽象）
├── llm_provider/              # LLM Provider 子系统（12 个子模块）
│   ├── mod.rs
│   ├── provider_trait.rs
│   ├── zhipu.rs
│   ├── deepseek.rs
│   ├── dashscope.rs
│   ├── minimax.rs
│   ├── openai_compatible.rs
│   ├── provider_manager.rs
│   ├── provider_pool.rs
│   ├── config.rs
│   ├── config_service.rs
│   ├── quota.rs / quota_service.rs
│   ├── token_cache.rs
│   └── token_refresh.rs
│
├── [编排层]
├── llm_agent_provider.rs      # LlmAgentProvider（包装层）
├── dual_agent_provider.rs     # DualAgentProvider（双代理层）
├── agent_orchestrator.rs      # AgentOrchestrator（编排器）
├── runtime_session.rs          # RuntimeSessionService（会话管理）
│
├── [路由与分发]
├── routing.rs                 # SubAgentRoutingService（完整路由服务）
├── routing_types.rs           # 路由类型系统（RoutingDecision/RoutingOutcome等）
├── router/                    # 路由器子系统
│   ├── mod.rs
│   └── semantic/              # 语义路由器
├── model_router.rs
├── router.rs
│
├── [执行与上下文]
├── execution.rs                # SubAgent执行
├── execution_integration.rs    # 执行上下文集成
├── runtime_session.rs         # 会话运行时
├── nested.rs
├── subagent.rs
├── checkpoint.rs
│
├── [生命周期与监控]
├── lifecycle_hooks/           # 生命周期钩子系统（3 个子模块，902 行）
│   ├── hook_types.rs
│   ├── hook_trait.rs
│   ├── hook_registry.rs
│   └── builtin_hooks.rs
├── monitoring/                # 监控子系统
├── monitoring_types.rs
├── audit/ / audit_types.rs / audit_siem.rs
├── events.rs
├── heartbeat.rs
│
├── [进度与追踪]
├── progress_tracking/         # 进度追踪系统（2 个子模块，954 行）
│   ├── progress_types.rs
│   └── progress_tracker.rs
│
├── [记忆系统]
├── memory/                    # 记忆子系统
├── layered_memory/            # 分层记忆系统（2 个子模块，807 行）
│   ├── layered_types.rs
│   └── layered_memory.rs
├── knowledge_retrieval.rs
├── context_compression.rs
├── context_compression_integration.rs
│
├── [构建与模板]
├── prompt_builder.rs          # Prompt构建器
├── prompt_types.rs
├── template.rs
│
├── [安全与权限]
├── permission.rs
├── resource_security.rs
├── security.rs / security_types.rs
├── prompt_guardrails.rs
│
├── [工具系统]
├── tools/                    # 工具子系统（7+ 个子模块）
│   ├── registry.rs
│   ├── executor.rs
│   ├── core/
│   │   ├── mod.rs
│   │   ├── fs.rs
│   │   ├── shell.rs
│   │   └── http.rs
│   └── mcp/
│       ├── mod.rs
│       ├── client.rs
│       └── handler.rs
│
├── [内置代理]
├── builtin_agent/            # 内置代理系统（3 个子模块，752 行）
│   ├── builtin_agent_types.rs
│   ├── builtin_agent_config.rs
│   └── mod.rs
│
├── [通信与消息]
├── intercom.rs              # Agent 间通信
├── message_sync.rs
├── websocket.rs
│
├── [其他]
├── config_cache.rs
├── correction.rs
├── delivery.rs
├── error_recovery.rs
├── failover.rs
├── mode.rs
├── result.rs
├── skill.rs
└── pilot.rs
```

### 1.2 核心问题识别

#### 问题 P1: 模块数量爆炸（Critical）

| 维度 | 当前 | Claude Code 参考 | 差距 |
|------|------|-----------------|------|
| Agent 核心模块数 | 55+ | ~15 | 3.7x |
| 抽象层数 | 6+ | 1-2 | 3x |
| 模块目录深度 | 5-6 层 | 2-3 层 | 2x |
| 核心执行链路深度 | 10+ 层调用 | 3 层调用 | 3x |

#### 问题 P2: Provider 抽象过度（Critical）

```
当前链路（6 层）:
AgentProvider trait
  → LlmAgentProvider
    → DualAgentProvider
      → LlmProvider trait
        → ZhipuProvider / DeepSeekProvider / ...
```

Claude Code 直接调用 SDK，不存在 Provider 中间层。

#### 问题 P3: 路由系统过度工程化（High）

`SubAgentRoutingService` 实现了：
- 4 种匹配策略（Keyword/Semantic/Combined/LlmGuided）
- 完整的风险评估系统（`RiskEvaluation`）
- 双确认防误触机制（`ConfirmationState`）
- 审批队列系统（`ApprovalQueue`）

Claude Code 用 10 行 if-else 做了同样的事。

#### 问题 P4: 内存系统复杂度过高（Medium）

分层记忆 + 向量嵌入 + RAG + 4 种 MemoryScope 枚举值，对于一个 ERP 系统的 AI 助手而言过于超前。

#### 问题 P5: 状态分散（High）

`AgentRuntimeState` 持有 7 个 `Arc<RwLock<...>>`，分散在 10+ 个独立的状态管理单元中。

#### 问题 P6: execution_integration.rs 是空壳聚合（Low）

该文件只是将其他模块的方法重新导出，本身不包含独立逻辑。

---

### 1.3 问题根源分析

**根源**: 设计时过度考虑"未来可能用到的扩展"，违反了 YAGNI 原则。Claude Code 的架构哲学是"先跑起来，再迭代"——先实现最小可行的 Agent 核心，然后根据实际需求逐步添加功能。

---

## 二、重构目标

### 2.1 功能不变性约束

| 必须保留的功能 | 说明 |
|---------------|------|
| Agent 执行环路 | 消息输入 → LLM 调用 → 工具执行 → 响应输出 |
| 多 Provider 支持 | Zhipu / DeepSeek / Minimax / DashScope / OpenAI 兼容 |
| Plan/Act 双代理模式 | DualAgentProvider 的 Plan/Act 分离逻辑 |
| 工具调用系统 | 核心工具注册、执行、过滤 |
| 内置 Agent 类型 | GeneralPurpose / Explore / Plan / Verification |
| 进度追踪 | ProgressTracker 的指标收集能力 |
| 生命周期钩子 | HookRegistry 的钩子触发机制 |
| 会话管理 | RuntimeSessionService 的会话存储 |
| 上下文压缩 | ContextCompression 的上下文压缩能力 |
| 权限过滤 | ToolRegistry 的工具权限控制 |
| 前端集成 | Tauri 命令、事件推送、React 组件 |
| API 契约 | 所有 `agent_*` Tauri 命令的签名不变 |

### 2.2 架构目标

将 55+ 模块重构为 **3 层 + 4 核 + 1 桥**的 Claude Code 风格架构：

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│  (React + Tauri Commands + Event Emitters)          │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│                   AgentCore Loop                     │
│  (单文件: agent_loop.rs ~800行)                      │
│  - 消息接收/发送                                     │
│  - LLM 调用                                         │
│  - 工具执行循环                                     │
│  - 上下文压缩触发                                    │
│  - 进度事件推送                                      │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│                4 个核心子系统                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ToolSystem  │ │MemorySystem │ │HookSystem   │  │
│  │(~400行)    │ │(~300行)     │ │(~300行)     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────────────────────┐                   │
│  │ProviderSystem(~200行)      │                   │
│  └─────────────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

---

## 三、重构方案

### 3.1 阶段划分

```
┌─────────────────────────────────────────────────────┐
│                   重构阶段总览                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Phase A: 基础设施层 (不改变执行流程)               │
│  ├── A1: 合并 Provider 抽象层                       │
│  └── A2: 统一状态管理入口                           │
│                                                     │
│  Phase B: 执行核心层 (重构执行环路)                  │
│  ├── B1: 创建 agent_loop.rs 核心文件                 │
│  ├── B2: 迁移 LlmAgentProvider → AgentLoop        │
│  └── B3: 迁移 DualAgentProvider → AgentLoop        │
│                                                     │
│  Phase C: 子系统精简 (保留功能，简化接口)            │
│  ├── C1: 简化路由系统                               │
│  ├── C2: 精简记忆系统                               │
│  └── C3: 合并监控/审计模块                          │
│                                                     │
│  Phase D: 清理与验证                                │
│  ├── D1: 删除空壳模块                               │
│  ├── D2: 验证功能回归                               │
│  └── D3: 更新 mod.rs 导出                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Phase A: 基础设施层

#### A1: 合并 Provider 抽象层

**目标**: 将 6 层 Provider 抽象简化为 2 层。

**当前结构**:
```
AgentProvider trait (provider.rs)
  ↓
LlmAgentProvider (llm_agent_provider.rs)
  ↓
DualAgentProvider (dual_agent_provider.rs)
  ↓
LlmProvider trait (llm_provider/mod.rs)
  ↓
ZhipuProvider / DeepSeekProvider / ...
```

**目标结构**:
```
AgentProvider trait (单文件 ~100行)
  ↓
ZhipuProvider / DeepSeekProvider / ... (直接实现 trait)
```

**具体操作**:
1. 将 `llm_provider/provider_trait.rs` 中的 `LlmProvider` trait 合并到 `provider.rs`
2. 删除 `llm_agent_provider.rs`（空壳）
3. 删除 `dual_agent_provider.rs`（空壳）
4. 保留 `llm_provider/` 子目录作为 Provider 实现存放处（但不作为抽象层）
5. `LlmAgentProvider` 的 Plan/Act 逻辑内联到 `AgentLoop`

**验证**: `cargo test` 通过，所有 Provider 相关的测试保持通过。

#### A2: 统一状态管理入口

**目标**: 将分散的 7+ 个 `Arc<RwLock<...>>` 合并为 1 个 `RuntimeState`。

**当前**:
```rust
struct AgentRuntimeState {
    provider: Arc<RwLock<Arc<dyn AgentProvider>>>,
    cancellations: Arc<RwLock<HashSet<String>>>,
    config: Arc<RwLock<Option<RuntimeConfig>>>,
    messages: Arc<RwLock<HashMap<String, intercom::AgentMessage>>>,
    execution_contexts: Arc<RwLock<HashMap<String, AgentExecutionContext>>>,
    // 外部还有:
    // RuntimeSessionService
    // PromptBuilder
    // ProviderSelector
    // SubAgentRoutingService
    // HookRegistry
    // ProgressTracker
}
```

**目标**:
```rust
struct RuntimeState {
    // 核心状态（必需）
    provider: Arc<dyn AgentProvider>,
    session_service: Arc<RuntimeSessionService>,
    
    // 可选子系统的 feature flag 控制
    #[cfg(feature = "routing")]
    routing_service: Option<Arc<SubAgentRoutingService>>,
    
    // 取消信号（轻量）
    cancellations: Arc<RwLock<HashSet<String>>>,
}
```

将 `HookRegistry`、`ProgressTracker`、`PromptBuilder` 内联到 `AgentLoop` 中作为局部变量或方法参数传递，不作为状态持有。

---

### Phase B: 执行核心层

#### B1: 创建 agent_loop.rs

**文件**: `src-tauri/src/agent/agent_loop.rs` (~800 行)

**设计原则**: 一个文件包含完整的 Agent 执行逻辑，像 Claude Code 的 `QueryEngine.ts` 一样。

**结构**:
```rust
//! Agent Loop - 单文件核心执行引擎
//!
//! 灵感来源: Claude Code QueryEngine.ts (~46K lines)
//! 设计原则: KISS - 核心逻辑在一个文件中内聚完整

use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::RwLock;

// ============================================================================
// 类型定义
// ============================================================================

/// Agent 执行模式
#[derive(Debug, Clone, Copy)]
pub enum AgentMode {
    Act,   // 执行模式
    Plan,  // 计划模式
}

/// LLM 请求
pub struct LoopRequest {
    pub session_id: String,
    pub messages: Vec<AgentMessage>,
    pub tools: Vec<ToolDescriptor>,
    pub mode: AgentMode,
    pub hooks: Vec<Arc<dyn AgentHook>>,
}

/// LLM 响应
pub struct LoopResponse {
    pub content: String,
    pub tool_calls: Vec<ToolCall>,
}

// ============================================================================
// AgentLoop Trait - 核心抽象
// ============================================================================

#[async_trait]
pub trait AgentLoop: Send + Sync {
    async fn run(&self, request: LoopRequest) -> Result<LoopResponse, AgentError>;
    async fn stream_run(&self, request: LoopRequest) -> Result<LoopStreamResponse, AgentError>;
}

// ============================================================================
// 标准实现
// ============================================================================

pub struct StandardAgentLoop {
    provider: Arc<dyn AgentProvider>,
    session_service: Arc<RuntimeSessionService>,
    cancellations: Arc<RwLock<HashSet<String>>>,
    config: LoopConfig,
}

impl StandardAgentLoop {
    pub async fn run(&self, req: LoopRequest) -> Result<LoopResponse, AgentError> {
        // 1. 前置钩子
        for hook in &req.hooks {
            hook.pre_run(&req).await?;
        }
        
        // 2. LLM 调用
        let response = self.call_llm(&req).await?;
        
        // 3. 工具执行循环
        let mut final_content = response.content.clone();
        let mut tool_calls = response.tool_calls.clone();
        
        for tool_call in &tool_calls {
            // 3.1 工具执行前钩子
            for hook in &req.hooks {
                hook.pre_tool(tool_call).await?;
            }
            
            // 3.2 执行工具
            let result = self.execute_tool(tool_call).await?;
            final_content.push_str(&result);
            
            // 3.3 工具执行后钩子
            for hook in &req.hooks {
                hook.post_tool(tool_call, &result).await?;
            }
        }
        
        // 4. 后置钩子
        for hook in &req.hooks {
            hook.post_run(&final_content).await?;
        }
        
        Ok(LoopResponse {
            content: final_content,
            tool_calls,
        })
    }
    
    async fn call_llm(&self, req: &LoopRequest) -> Result<LlmResponse, AgentError> {
        // 直接调用 Provider，不经过多层包装
        self.provider.complete(ProviderRequest {
            session_id: req.session_id.clone(),
            trace_id: uuid::Uuid::new_v4().to_string(),
            messages: req.messages.clone(),
            metadata: None,
        }).await
    }
    
    async fn execute_tool(&self, tool_call: &ToolCall) -> Result<String, AgentError> {
        // 工具执行逻辑内联
        todo!("tool execution")
    }
}
```

#### B2: 迁移 LlmAgentProvider → AgentLoop

**操作**:
1. 将 `LlmAgentProvider::complete()` 方法的核心逻辑迁移到 `StandardAgentLoop::run()`
2. 删除 `LlmAgentProvider` 结构体
3. 更新 `mod.rs` 导出

#### B3: 迁移 DualAgentProvider → AgentLoop

**操作**:
1. 将 Plan/Act 双模式逻辑内联到 `AgentLoop`：
   ```rust
   match mode {
       AgentMode::Plan => { /* 调用 Plan Provider */ }
       AgentMode::Act => { /* 调用 Act Provider */ }
   }
   ```
2. 删除 `DualAgentProvider` 结构体

---

### Phase C: 子系统精简

#### C1: 简化路由系统

**目标**: 将 `SubAgentRoutingService`（~700 行，4 种策略）简化为简单模式匹配。

**保留**:
- Keyword 匹配（最常用）
- Manual/Auto/Hybrid 模式切换

**删除/简化**:
- Semantic 路由（向量匹配）
- LlmGuided 路由
- RiskEvaluation 完整实现
- ConfirmationState（双确认）

**目标结构**:
```rust
pub struct SimpleRouter {
    rules: Vec<RoutingRule>,
    mode: RoutingMode,
}

impl SimpleRouter {
    pub fn route(&self, message: &str) -> Option<SubAgentId> {
        // 简单关键词匹配
        for rule in &self.rules {
            if rule.keywords.iter().any(|k| message.contains(k)) {
                return Some(rule.sub_agent_id.clone());
            }
        }
        None
    }
}
```

#### C2: 精简记忆系统

**目标**: 保留 `LayeredMemory` 的功能，简化接口。

**保留**:
- 个人记忆层（UserMemory）
- 企业知识库层（KnowledgeBase）
- 上下文窗口管理（ContextWindow）

**删除/简化**:
- `MemoryScope::Inherited`（未使用）
- `MemoryScope::SessionOnly`（与 UserMemory 重复）
- 复杂的向量嵌入搜索（保留简单的全文搜索）

#### C3: 合并监控/审计模块

**目标**: 将 6 个相关模块合并为 1 个 `monitoring.rs`。

当前模块：
- `monitoring.rs`
- `monitoring_types.rs`
- `audit.rs`
- `audit_types.rs`
- `audit_siem.rs`
- `events.rs`

目标：合并为 `monitoring.rs`（~300 行），包含：
- `EventEmitter` trait
- `MetricsCollector` 结构体
- `AuditLogger` 结构体

---

### Phase D: 清理与验证

#### D1: 删除空壳模块

| 待删除文件 | 原因 |
|-----------|------|
| `execution_integration.rs` | 空壳聚合文件 |
| `llm_agent_provider.rs` | 空壳包装层 |
| `dual_agent_provider.rs` | 空壳双代理层 |
| `routing.rs` (原 SubAgentRoutingService) | 过度工程化 |
| `routing_types.rs` | 被简化路由替代 |
| `router.rs` / `router/` 目录 | 未使用的语义路由器 |
| `model_router.rs` | 未使用的模型路由器 |
| `pilot.rs` | 孤立的编排逻辑 |

#### D2: 更新 mod.rs

将 55 个 `pub mod` 声明减少到 ~20 个：

```rust
//! Agent runtime core module.
//!
//! 重构后结构:
//! - agent_loop: 核心执行环路（~800行）
//! - provider: LLM Provider 实现（直接实现 AgentProvider trait）
//! - tools: 工具系统
//! - memory: 记忆系统
//! - hooks: 生命周期钩子
//! - session: 会话管理
//! - monitoring: 监控与审计
//! - builtin: 内置代理类型
//! - state: 统一状态管理

pub mod agent_loop;           // 新增: 核心执行环路 (~800行)
pub mod provider;             // 保留: LLM Provider trait + 实现
pub mod tools;               // 保留: 工具系统
pub mod memory;              // 精简: 记忆系统
pub mod hooks;               // 精简: 生命周期钩子
pub mod session;             // 重命名: runtime_session → session
pub mod monitoring;          // 合并: 监控+审计+事件
pub mod builtin;             // 保留: 内置代理类型
pub mod state;               // 新增: 统一状态入口
pub mod routing;             // 精简: 简单路由器
pub mod compression;         // 重命名: context_compression → compression
pub mod builtin_agent;       // 保留: BuiltinAgentType (功能已验证)
pub mod permission;          // 保留: 权限过滤
pub mod security;            // 保留: 安全相关
pub mod intercom;            // 保留: Agent间通信
pub mod error;               // 重命名: 统一错误类型
```

---

## 四、重构后的目录结构

```
src-tauri/src/agent/
├── mod.rs                     # 入口（~20 个 pub mod）
│
├── agent_loop.rs              # 新增: 核心执行环路 (~800行)
├── provider.rs                 # 保留: AgentProvider trait + 简单包装
├── provider/
│   ├── zhipu.rs
│   ├── deepseek.rs
│   ├── minimax.rs
│   ├── dashscope.rs
│   └── openai_compatible.rs
│
├── tools/                     # 保留: 工具系统（已有良好结构）
│   ├── mod.rs
│   ├── registry.rs
│   ├── executor.rs
│   ├── core/
│   └── mcp/
│
├── memory/                    # 精简: 记忆系统
│   ├── mod.rs
│   ├── layered_memory.rs     # 简化版
│   └── compression.rs        # 简化版
│
├── hooks/                     # 精简: 生命周期钩子
│   ├── mod.rs
│   ├── hook_types.rs
│   ├── hook_trait.rs
│   ├── hook_registry.rs
│   └── builtin.rs
│
├── session.rs                 # 重命名: 合并 runtime_session
├── monitoring.rs              # 合并: 监控+审计+事件
├── builtin_agent/             # 保留: 内置代理类型
├── routing.rs                 # 精简: 简单路由器
├── permission.rs              # 保留: 权限过滤
├── security.rs                # 保留: 安全相关
├── intercom.rs                # 保留: Agent间通信
├── prompt_builder.rs          # 保留: Prompt构建器
└── error.rs                   # 统一错误类型
```

**对比**:

| 指标 | 重构前 | 重构后 | 变化 |
|------|--------|--------|------|
| 子模块数 | 55+ | ~20 | -64% |
| 核心执行链路深度 | 10+ | 3 | -70% |
| 核心代码内聚度 | 分散 | 单文件 | +100% |

---

## 五、实施计划

### 5.1 任务分解

| Task | 阶段 | 名称 | 依赖 | 风险 |
|------|------|------|------|------|
| R1 | A1 | 合并 Provider 抽象层 | - | Medium |
| R2 | A2 | 统一状态管理入口 | R1 | Medium |
| R3 | B1 | 创建 agent_loop.rs | R2 | High |
| R4 | B2 | 迁移 LlmAgentProvider → AgentLoop | R3 | High |
| R5 | B3 | 迁移 DualAgentProvider → AgentLoop | R4 | High |
| R6 | C1 | 简化路由系统 | R5 | Low |
| R7 | C2 | 精简记忆系统 | R5 | Medium |
| R8 | C3 | 合并监控/审计模块 | R5 | Low |
| R9 | D1 | 删除空壳模块 | R6,R7,R8 | Medium |
| R10 | D2 | 功能回归验证 | R9 | Critical |
| R11 | D3 | 更新 mod.rs 导出 | R9 | Low |

### 5.2 时间估算

| 阶段 | 任务 | 预估工时 |
|------|------|----------|
| Phase A | R1, R2 | 4 小时 |
| Phase B | R3, R4, R5 | 8 小时 |
| Phase C | R6, R7, R8 | 4 小时 |
| Phase D | R9, R10, R11 | 6 小时 |
| **总计** | | **22 小时** |

---

## 六、风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Provider trait 签名变更破坏前端 | Medium | High | 重构期间保持 trait 签名不变，只改变实现位置 |
| 性能下降 | Low | Medium | 重构后进行性能基准测试 |
| 意外删除有用代码 | Medium | High | 每阶段完成后运行 `cargo test` |
| 重构周期过长影响业务 | Medium | High | 分阶段提交，每阶段功能可用 |

---

## 七、验证计划

### 7.1 编译验证

```bash
cargo check
cargo build
cargo clippy -- -D warnings
```

### 7.2 测试验证

```bash
cargo test --lib
cargo test --test '*'
```

### 7.3 功能回归验证

| 功能模块 | 验证方法 |
|---------|----------|
| Agent 执行环路 | 发送测试消息，验证 LLM 调用和工具执行 |
| 多 Provider 支持 | 分别测试 Zhipu/DeepSeek Provider |
| 工具调用 | 执行 fs_read / bash 等核心工具 |
| 内置 Agent 类型 | 切换 Explore/Plan 模式 |
| 进度追踪 | 验证 ProgressUpdate 事件推送 |
| 会话持久化 | 创建会话，验证存储/恢复 |
| 权限过滤 | 验证 ToolRegistry 的工具过滤 |

### 7.4 前端集成验证

```bash
npm run lint
npm run build
```

---

## 八、OpenSpec 变更计划

本次架构重构将生成 **3 个 OpenSpec 变更**：

| OpenSpec | 对应阶段 | 任务 |
|----------|----------|------|
| `agent-arch-phase-a-provider-merge` | Phase A | R1, R2 |
| `agent-arch-phase-b-loop-core` | Phase B | R3, R4, R5 |
| `agent-arch-phase-cd-simplify-cleanup` | Phase C + D | R6, R7, R8, R9, R10, R11 |

每个 OpenSpec 变更包含：
- `proposal.md` - 变更提案
- `design.md` - 详细设计
- `tasks.md` - 实施任务
- `specs/spec.md` - 验收标准

---

## 九、附录

### A. 与 Claude Code 架构对比

| 维度 | Claude Code | 重构后 | 差距 |
|------|-------------|--------|------|
| 核心执行文件 | QueryEngine.ts (46K) | agent_loop.rs (~800行) | Claude Code 更内聚 |
| 工具系统 | 40+ 独立文件 | tools/ 目录 | 对齐 |
| 记忆系统 | .claude/memory 文本文件 | LayeredMemory | 对齐 |
| 抽象层数 | 1 (SDK) | 2 (trait → impl) | 对齐 |
| 路由系统 | if-else | SimpleRouter | 对齐 |

### B. 参考架构原则

- **KISS**: 保持简单，避免不必要的复杂性
- **YAGNI**: 不实现当前不需要的功能
- **SOLID**: 单一职责、开闭原则
- **DRY**: 消除重复代码
- **DIP**: 依赖抽象而非具体实现

### C. 参考资料

- Claude Code 源码: `src/QueryEngine.ts` (~46K 行)
- Claude Code 架构文档: `docs/architecture.md`
