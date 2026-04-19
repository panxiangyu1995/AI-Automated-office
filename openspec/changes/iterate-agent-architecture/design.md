# Design: Agent核心模块架构优化

## 优化前架构

### 当前 tools/pipeline.rs 依赖图

```
tools/pipeline.rs
  ├─→ tools/browser/ (巨大子模块)
  ├─→ tools/core.rs
  ├─→ tools/document.rs (837行)
  ├─→ tools/enterprise.rs (892行)
  ├─→ tools/enterprise_types.rs
  ├─→ tools/enterprise_helpers.rs
  ├─→ tools/filesystem.rs (793行)
  ├─→ tools/media.rs
  ├─→ tools/automation.rs
  ├─→ tools/memory.rs
  ├─→ tools/profile.rs
  ├─→ tools/sessions.rs
  ├─→ tools/shell.rs (628行)
  ├─→ tools/web.rs (566行)
  ├─→ tools/descriptor.rs
  ├─→ tools/permission.rs
  ├─→ tools/sensitivity.rs
  └─→ tools/visibility.rs
```

### 当前 LLM Agent Provider 结构

```rust
pub struct LlmAgentProvider {
    plan_llm: Option<Arc<dyn LlmProvider>>,
    act_llm: Arc<dyn dyn LlmProvider>,
    current_mode: AgentMode,  // Plan/Act 切换
    default_session_id: String,
}
```

### 当前 ToolRegistry 结构

```rust
pub struct ToolRegistry {
    tools: Mutex<HashMap<String, ToolDescriptor>>,  // 同步锁
}
```

### 当前 Frontend index.ts 导出

- 导出 50+ 项（组件 + hooks + types 混杂）
- 无功能域划分
- 新人难以找到入口

---

## 优化后架构

### 阶段一：工具自注册模式

#### 优化前（pipeline.rs 直接依赖）

```rust
// pipeline.rs
use super::browser;
use super::core::register_core_tools;
use super::document;
use super::enterprise;
// ... 所有工具都直接 import
```

#### 优化后（工具自注册 + registry 解耦）

```rust
// pipeline.rs - 仅依赖 registry 和 trait
use super::registry::ToolRegistry;
use super::descriptor::ToolDescriptor;
use super::pipeline::ToolExecutor;

pub fn register_all_tools(registry: &mut ToolRegistry) {
    // 工具通过 registry 自注册
    // pipeline 不再 import 具体工具模块
}

// tools/browser/mod.rs - 自注册入口
pub fn register_tools(registry: &mut ToolRegistry, executors: &mut HashMap<String, Arc<dyn ToolExecutor>>) {
    register_navigation_tools(registry, executors);
    register_interaction_tools(registry, executors);
    // ...
}

// tools/enterprise/mod.rs - 自注册入口
pub fn register_tools(registry: &mut ToolRegistry, executors: &mut HashMap<String, Arc<dyn ToolExecutor>>) {
    // 内部仍可拆分，但通过 registry 统一注册
}
```

### 阶段二：并发原语统一

#### 优化前（Mutex 同步锁）

```rust
// registry.rs
pub struct ToolRegistry {
    tools: Mutex<HashMap<String, ToolDescriptor>>,  // 同步锁
}
```

#### 优化后（Arc<RwLock> 异步锁）

```rust
// registry.rs
use std::sync::{Arc, RwLock};

pub struct ToolRegistry {
    tools: Arc<RwLock<HashMap<String, ToolDescriptor>>>,  // 异步读写锁
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self {
            tools: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn register(&self, descriptor: ToolDescriptor) -> Result<(), RegistryError> {
        let mut tools = self.tools.write()
            .map_err(|e| RegistryError::LockError(e.to_string()))?;
        tools.insert(descriptor.id.clone(), descriptor);
        Ok(())
    }

    pub fn list(&self) -> Result<Vec<ToolDescriptor>, RegistryError> {
        let tools = self.tools.read()
            .map_err(|e| RegistryError::LockError(e.to_string()))?;
        Ok(tools.values().cloned().collect())
    }
}
```

### 阶段三：Provider Strategy 模式

#### 优化前（字段切换）

```rust
// llm_agent_provider.rs
pub struct LlmAgentProvider {
    plan_llm: Option<Arc<dyn LlmProvider>>,
    act_llm: Arc<dyn LlmProvider>,
    current_mode: AgentMode,
}

impl AgentProvider for LlmAgentProvider {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        let provider = match self.current_mode {
            AgentMode::Plan => self.plan_llm.as_ref().unwrap_or(&self.act_llm),
            AgentMode::Act => &self.act_llm,
        };
        // ... 调用 provider
    }
}
```

#### 优化后（Strategy 模式）

```rust
// strategy.rs
use async_trait::async_trait;

#[async_trait]
pub trait AgentStrategy: Send + Sync {
    async fn execute(&self, ctx: &ExecutionContext, req: ProviderRequest) -> AgentResult<ProviderResponse>;
    fn name(&self) -> &'static str;
}

// plan_strategy.rs
pub struct PlanStrategy {
    llm: Arc<dyn LlmProvider>,
    readonly_tools: Vec<ToolDescriptor>,
}

#[async_trait]
impl AgentStrategy for PlanStrategy {
    async fn execute(&self, ctx: &ExecutionContext, req: ProviderRequest) -> AgentResult<ProviderResponse> {
        // 仅使用只读工具
        // ...
    }
    fn name(&self) -> &'static str { "plan" }
}

// act_strategy.rs
pub struct ActStrategy {
    llm: Arc<dyn LlmProvider>,
    all_tools: Vec<ToolDescriptor>,
}

#[async_trait]
impl AgentStrategy for ActStrategy {
    async fn execute(&self, ctx: &ExecutionContext, req: ProviderRequest) -> AgentResult<ProviderResponse> {
        // 使用所有工具
        // ...
    }
    fn name(&self) -> &'static str { "act" }
}

// llm_agent_provider.rs - 简化
pub struct LlmAgentProvider {
    strategy: Arc<dyn AgentStrategy>,  // 当前策略
    strategies: HashMap<AgentMode, Arc<dyn AgentStrategy>>,  // 可切换策略
}

impl LlmAgentProvider {
    pub fn with_strategies(
        act: Arc<dyn AgentStrategy>,
        plan: Option<Arc<dyn AgentStrategy>>,
    ) -> Self {
        let mut strategies = HashMap::new();
        strategies.insert(AgentMode::Act, act);
        if let Some(p) = plan {
            strategies.insert(AgentMode::Plan, p);
        }
        Self {
            strategy: strategies.get(&AgentMode::Act).unwrap().clone(),
            strategies,
        }
    }

    pub fn set_mode(&mut self, mode: AgentMode) {
        if let Some(s) = self.strategies.get(&mode) {
            self.strategy = s.clone();
        }
    }
}

#[async_trait]
impl AgentProvider for LlmAgentProvider {
    async fn complete(&self, request: ProviderRequest) -> AgentResult<ProviderResponse> {
        self.strategy.execute(/* ... */).await
    }
}
```

### 阶段四：前端按域拆分

#### 目录结构

```
src/features/agent/
├── index.ts              # 主入口（精简后）
├── components/
│   ├── index.ts          # 主组件导出
│   ├── chat/
│   │   ├── index.ts      # 对话组件导出
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── SessionList.tsx
│   │   └── ...
│   ├── collaboration/
│   │   ├── index.ts      # Agent 协作导出
│   │   ├── AgentIntercom.tsx
│   │   ├── AgentGroupParticipant.tsx
│   │   └── ...
│   ├── monitoring/
│   │   ├── index.ts      # 可观测性导出
│   │   ├── TaskTraceAnalysis.tsx
│   │   ├── LogMetricsCenter.tsx
│   │   └── ...
│   ├── pilot/
│   │   ├── index.ts      # Pilot 集成导出
│   │   ├── ApprovalPilotIntegration.tsx
│   │   ├── SalesPilotIntegration.tsx
│   │   └── FinancePilotIntegration.tsx
│   └── # 其他保留原有结构
├── hooks/
│   ├── index.ts          # 主 hooks 导出
│   ├── domains/
│   │   ├── index.ts      # 按域聚合导出
│   │   ├── useChat.ts    # 对话域
│   │   ├── useCheckpoint.ts  # 检查点域
│   │   └── useCompression.ts # 压缩域
│   └── # 其他保留原有结构
└── types/
    └── index.ts          # 类型统一导出
```

#### index.ts 精简示例

```typescript
// 优化后：精简的主入口
export { AgentChatPanel, MessageInput, MessageList, SessionList } from './components'
export { useChatStore, useActiveChatSession } from './hooks'

// 兼容层：保留旧导出路径
export { AgentChatPanel } from './components/AgentChatPanel'
```

### 阶段五：大文件拆分

#### enterprise.rs (892行) 拆分

```
tools/enterprise/
├── mod.rs                 # 目录入口，保留注册函数 (约 50 行)
├── resource.rs            # ResourceQueryExecutor, ResourceUploadExecutor
├── knowledge.rs           # KnowledgeQueryExecutor, KnowledgeSubmitDraftExecutor
├── message.rs             # MessageQueryExecutor, MessageSendExecutor
├── delegation.rs          # AgentDelegateExecutor
├── workspace.rs           # WorkspaceStageChangeExecutor
├── db.rs                  # DbQueryExecutor
└── types.rs               # 保留原有 types
```

#### document.rs (837行) 拆分

```
tools/document/
├── mod.rs                 # 目录入口
├── reader.rs              # DocumentReaderExecutor
├── writer.rs              # DocumentWriterExecutor
├── converter.rs           # DocumentConverterExecutor
└── metadata.rs           # DocumentMetadataExecutor
```

---

## 实现要点

### 阶段一：工具自注册

1. **创建目录结构**：在每个工具子模块创建 `mod.rs`
2. **定义注册函数**：`pub fn register_tools(registry, executors)`
3. **更新 pipeline.rs**：移除直接 import，改为收集注册函数
4. **编译验证**：确保 `cargo check` 通过

### 阶段二：并发原语

1. **迁移 ToolRegistry**：将 `Mutex` 改为 `RwLock`
2. **更新所有调用点**：添加 `.read()` / `.write()`
3. **错误处理**：保留 PoisonError 处理

### 阶段三：Strategy

1. **创建 strategy 模块**：定义 trait 和实现
2. **迁移现有逻辑**：将 Plan/Act 逻辑移入对应 Strategy
3. **保留向后兼容**：LlmAgentProvider 接口不变

### 阶段四：前端拆分

1. **创建子目录**：chat/, collaboration/, monitoring/, pilot/
2. **迁移组件**：按功能域移动组件文件
3. **创建子 index.ts**：每个子目录导出自己的模块
4. **更新主 index.ts**：精简导出，保留兼容层

### 阶段五：大文件拆分

1. **建立目录**：创建 `tools/enterprise/` 等目录
2. **迁移代码**：按功能将大文件拆分为多个子模块
3. **更新 mod.rs**：聚合子模块导出
4. **保持注册函数**：导出 `register_tools` 供 pipeline 调用
