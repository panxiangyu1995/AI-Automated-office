# Design: Agent Runtime 架构重构 - Phase B: 核心执行环路

## 优化前执行链路

```
AgentRuntimeState
  → LlmAgentProvider.complete()
    → DualAgentProvider.complete()
      → LlmProvider.complete()
        → ZhipuProvider / DeepSeekProvider / ...
```

（10+ 层间接调用）

## 优化后执行链路

```
AgentLoop.run()
  → StandardAgentLoop
    → Provider.complete() (直接调用)
      → ZhipuProvider / DeepSeekProvider / ...
```

（3 层调用）

## 详细设计

### B1: 创建 agent_loop.rs

**文件**: `src-tauri/src/agent/agent_loop.rs`

**结构**:

```rust
//! Agent Loop - 单文件核心执行引擎
//!
//! 灵感来源: Claude Code QueryEngine.ts
//! 设计原则: KISS - 核心逻辑在一个文件中内聚完整

// ============================================================================
// 类型定义
// ============================================================================

/// Agent 执行模式
#[derive(Debug, Clone, Copy, Default)]
pub enum AgentMode {
    #[default]
    Act,   // 执行模式（直接执行任务）
    Plan,  // 计划模式（只生成计划，不执行）
}

/// LLM 请求
#[derive(Debug, Clone)]
pub struct LoopRequest {
    pub session_id: String,
    pub trace_id: String,
    pub messages: Vec<AgentMessage>,
    pub tools: Vec<ToolDescriptor>,
    pub mode: AgentMode,
    pub max_turns: usize,
}

/// LLM 响应
#[derive(Debug, Clone)]
pub struct LoopResponse {
    pub content: String,
    pub tool_calls: Vec<ToolCall>,
    pub usage: Option<TokenUsage>,
}

/// 工具调用
#[derive(Debug, Clone)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}

// ============================================================================
// AgentLoop Trait
// ============================================================================

#[async_trait]
pub trait AgentLoop: Send + Sync {
    async fn run(&self, request: LoopRequest) -> Result<LoopResponse, AgentError>;
    async fn stream_run(&self, request: LoopRequest) -> Result<LoopStreamResponse, AgentError>;
}

// ============================================================================
// StandardAgentLoop 实现
// ============================================================================

pub struct StandardAgentLoop {
    provider: Arc<dyn AgentProvider>,
    session_service: Arc<RuntimeSessionService>,
    cancellations: Arc<RwLock<HashSet<String>>>,
}

impl StandardAgentLoop {
    pub async fn run(&self, req: LoopRequest) -> Result<LoopResponse, AgentError> {
        let mut messages = req.messages.clone();
        let mut turns = 0;
        let mut final_content = String::new();

        loop {
            // 1. 检查取消信号
            if self.is_cancelled(&req.session_id).await {
                return Err(AgentError::Interrupted);
            }

            // 2. LLM 调用
            let response = self.call_llm(&messages, &req.tools).await?;
            final_content = response.content.clone();

            // 3. 无工具调用，直接返回
            if response.tool_calls.is_empty() {
                return Ok(LoopResponse {
                    content: final_content,
                    tool_calls: vec![],
                    usage: response.usage,
                });
            }

            // 4. 工具执行循环
            for tool_call in &response.tool_calls {
                let result = self.execute_tool(tool_call).await?;
                messages.push(AgentMessage {
                    role: "tool".to_string(),
                    content: result,
                    metadata: None,
                });
            }

            turns += 1;
            if turns >= req.max_turns {
                break;
            }

            // 5. 上下文压缩检查
            if self.should_compact(&messages).await {
                messages = self.compact_messages(&messages).await?;
            }
        }

        Ok(LoopResponse {
            content: final_content,
            tool_calls: response.tool_calls,
            usage: response.usage,
        })
    }

    async fn call_llm(&self, messages: &[AgentMessage], tools: &[ToolDescriptor])
        -> Result<ProviderResponse, AgentError> {
        let request = ProviderRequest {
            session_id: self.session_id.clone(),
            trace_id: uuid::Uuid::new_v4().to_string(),
            messages: messages.to_vec(),
            metadata: Some(serde_json::json!({
                "tools": tools,
                "mode": "act",
            })),
        };
        self.provider.complete(request).await
    }

    async fn execute_tool(&self, tool_call: &ToolCall) -> Result<String, AgentError> {
        // 工具执行逻辑
        todo!("tool execution")
    }

    async fn should_compact(&self, messages: &[AgentMessage]) -> bool {
        let total_tokens = messages.iter()
            .map(|m| m.content.len() / 4) // 简化估算
            .sum::<usize>();
        total_tokens > 100_000 // ~100K tokens
    }

    async fn compact_messages(&self, messages: &[AgentMessage]) -> Result<Vec<AgentMessage>, AgentError> {
        // 上下文压缩逻辑
        todo!("context compression")
    }
}
```

### B2: AgentMode 的 Plan/Act 分离

```rust
pub enum AgentMode {
    Act,   // 直接执行
    Plan,  // 只生成计划
}

impl StandardAgentLoop {
    async fn call_llm(&self, messages: &[AgentMessage], tools: &[ToolDescriptor], mode: AgentMode)
        -> Result<ProviderResponse, AgentError> {
        match mode {
            AgentMode::Plan => {
                // Plan 模式：使用不同的 system prompt
                let plan_request = ProviderRequest {
                    // ... 添加 plan mode 标记
                };
                self.plan_provider.complete(plan_request).await
            }
            AgentMode::Act => {
                self.act_provider.complete(request).await
            }
        }
    }
}
```

## 验证方法

```bash
cargo check
cargo build
cargo test --lib
cargo clippy -- -D warnings
```
