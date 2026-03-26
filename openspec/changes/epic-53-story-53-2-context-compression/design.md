# Design: 上下文压缩触发与执行

## 技术方案

### 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 3 - 记忆层与提示词集成

### 模块结构

```
src-tauri/src/agent/compression/
├── mod.rs              # 模块入口
├── token_counter.rs    # Token 计数器
├── strategy.rs          # 压缩策略
├── context.rs          # 压缩上下文
└── tests.rs            # 单元测试
```

### 核心 API 设计

#### Rust API

```rust
// token_counter.rs - Token 计数器

pub struct TokenCounter {
    model_max_tokens: usize,
    warning_threshold: f32,    // 默认 0.8
    critical_threshold: f32,   // 默认 0.9
}

impl TokenCounter {
    /// 创建 Token 计数器
    pub fn new(model_max_tokens: usize) -> Self;

    /// 估算文本 Token 数
    pub fn estimate(&self, text: &str) -> usize;

    /// 获取当前使用率
    pub fn usage_rate(&self, current_tokens: usize) -> f32;

    /// 检查是否需要压缩
    pub fn should_compress(&self, current_tokens: usize) -> bool;

    /// 获取建议的压缩目标
    pub fn recommended_target(&self, current_tokens: usize) -> usize;
}

/// Token 使用报告
#[derive(Debug, Clone)]
pub struct TokenUsageReport {
    pub current_tokens: usize,
    pub max_tokens: usize,
    pub usage_rate: f32,
    pub is_warning: bool,
    pub is_critical: bool,
    pub recommended_action: Action,
}

#[derive(Debug, Clone)]
pub enum Action {
    Continue,
    CompressSoon,
    CompressNow,
    ForceCompress,
}
```

```rust
// strategy.rs - 压缩策略

/// 压缩策略枚举
#[derive(Debug, Clone)]
pub enum CompressionStrategy {
    /// 摘要生成
    Summarize {
        preserve_ratio: f32,      // 保留比例，默认 0.3
        max_length: usize,         // 最大长度
    },
    /// 滑动窗口
    SlidingWindow {
        window_size: usize,        // 窗口大小
        step_size: usize,          // 步长
        preserve_recent: bool,     // 保留最近消息
    },
    /// 关键事实提取
    KeyFactExtraction {
        max_facts: usize,          // 最大事实数
        relevance_threshold: f32,   // 相关性阈值
    },
    /// 混合策略
    Hybrid {
        strategies: Vec<CompressionStrategy>,
        sequence: Vec<f32>,        // 各策略权重
    },
}

/// 压缩策略 trait
pub trait CompressionStrategyTrait {
    fn compress(&self, context: &CompressionContext) -> CompressionResult;

    fn estimate_output_tokens(&self, input_tokens: usize) -> usize;
}
```

```rust
// context.rs - 压缩上下文

/// 压缩上下文
#[derive(Debug, Clone)]
pub struct CompressionContext {
    pub conversation_history: Vec<Message>,
    pub tool_results: Vec<ToolResult>,
    pub system_context: String,
    pub recent_memories: Vec<MemoryItem>,
    pub key_facts: Vec<KeyFact>,
}

/// 压缩结果
#[derive(Debug, Clone)]
pub struct CompressionResult {
    pub compressed_context: CompressionContext,
    pub original_tokens: usize,
    pub compressed_tokens: usize,
    pub compression_ratio: f32,
    pub applied_strategies: Vec<String>,
    pub preserved_elements: Vec<String>,    // 保留的关键元素
    pub discarded_elements: Vec<String>,     // 丢弃的元素
}
```

```rust
// mod.rs - ContextCompressor 核心实现

pub struct ContextCompressor {
    token_counter: TokenCounter,
    strategies: HashMap<String, Box<dyn CompressionStrategyTrait>>,
    default_strategy: CompressionStrategy,
}

impl ContextCompressor {
    /// 创建 ContextCompressor
    pub fn new(model_max_tokens: usize) -> Self;

    /// 注册压缩策略
    pub fn register_strategy(
        &mut self,
        name: String,
        strategy: Box<dyn CompressionStrategyTrait>,
    );

    /// 检查是否需要压缩
    pub fn needs_compression(&self, context: &CompressionContext) -> bool;

    /// 执行压缩
    pub fn compress(
        &self,
        context: &CompressionContext,
        strategy: Option<CompressionStrategy>,
    ) -> CompressionResult;

    /// 生成压缩摘要
    pub async fn generate_summary(
        &self,
        context: &CompressionContext,
    ) -> Result<String, CompressionError>;
}
```

#### Tauri 命令接口

```rust
// commands.rs - Tauri 命令定义

/// 手动触发压缩
#[tauri::command]
pub async fn invoke_trigger_compression(
    session_id: String,
    strategy: Option<String>,      // 可选策略名称
    force: bool,                   // 强制压缩
) -> Result<CompressionResult, CompressionError>;

/// 获取 Token 使用情况
#[tauri::command]
pub async fn invoke_get_token_usage(
    session_id: String,
) -> Result<TokenUsageReport, CompressionError>;

/// 估算压缩后的 Token 数
#[tauri::command]
pub async fn invoke_estimate_compression(
    session_id: String,
    strategy: Option<String>,
) -> Result<CompressionEstimate, CompressionError>;
```

### 压缩流程设计

```
┌─────────────────────────────────────────────────────────────┐
│                    上下文压缩流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Token 监测                                              │
│     └── 每次 Agent 执行后调用 token_counter.estimate()      │
│                                                             │
│  2. 阈值检查                                                │
│     └── if usage_rate >= 0.8 (warning_threshold)           │
│                                                             │
│  3. 触发压缩                                                │
│     ├── 自动触发: 发送 compression_start 事件               │
│     └── 等待确认或超时自动执行                              │
│                                                             │
│  4. 策略选择                                                │
│     ├── 推荐策略: 基于上下文类型                            │
│     └── 可选: 用户指定策略                                  │
│                                                             │
│  5. 执行压缩                                                │
│     ├── 摘要生成: 保留核心语义                             │
│     ├── 滑动窗口: 保留最近 N 条消息                        │
│     └── 关键事实: 提取并保留重要事实                        │
│                                                             │
│  6. 结果应用                                                │
│     ├── 更新会话上下文                                      │
│     └── 发送 compression_complete 事件                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 压缩策略详解

#### 1. 摘要生成 (Summarization)

```rust
impl CompressionStrategyTrait for SummarizeStrategy {
    fn compress(&self, context: &CompressionContext) -> CompressionResult {
        // 1. 对话历史摘要
        let history_summary = summarize_messages(&context.conversation_history);

        // 2. 工具结果摘要（保留关键返回值）
        let tool_summary = summarize_tool_results(&context.tool_results);

        // 3. 合并
        CompressionResult {
            compressed_context: new_context_with(history_summary, tool_summary),
            compression_ratio: 0.3,
            ..
        }
    }
}
```

#### 2. 滑动窗口 (Sliding Window)

```rust
impl CompressionStrategyTrait for SlidingWindowStrategy {
    fn compress(&self, context: &CompressionContext) -> CompressionResult {
        let messages = &context.conversation_history;

        // 保留最近的 window_size 条消息
        let recent: Vec<Message> = messages
            .iter()
            .rev()
            .take(self.window_size)
            .cloned()
            .collect();

        // 保留关键系统上下文
        let system = context.system_context.clone();

        CompressionResult {
            compressed_context: CompressionContext {
                conversation_history: recent,
                system_context: system,
                ..
            },
            compression_ratio: self.window_size as f32 / messages.len() as f32,
            ..
        }
    }
}
```

#### 3. 关键事实提取 (Key Fact Extraction)

```rust
impl CompressionStrategyTrait for KeyFactExtractionStrategy {
    fn compress(&self, context: &CompressionContext) -> CompressionResult {
        // 1. 提取关键实体
        let entities = extract_entities(&context.conversation_history);

        // 2. 提取关键决策
        let decisions = extract_decisions(&context.conversation_history);

        // 3. 提取用户偏好
        let preferences = extract_preferences(&context.conversation_history);

        // 4. 组合关键事实
        let key_facts = combine_facts(entities, decisions, preferences);

        CompressionResult {
            compressed_context: new_context_with_key_facts(key_facts),
            compression_ratio: 0.2,
            ..
        }
    }
}
```

### 事件通知设计

与 Story 51.2 流式事件总线集成的压缩事件：

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum CompressionEvent {
    #[serde(rename = "compression_start")]
    Start {
        session_id: String,
        current_tokens: usize,
        target_tokens: usize,
        estimated_duration_ms: u64,
    },
    #[serde(rename = "compression_progress")]
    Progress {
        session_id: String,
        phase: String,          // "analyzing", "summarizing", "finalizing"
        progress_percent: f32,
    },
    #[serde(rename = "compression_complete")]
    Complete {
        session_id: String,
        original_tokens: usize,
        compressed_tokens: usize,
        compression_ratio: f32,
        applied_strategies: Vec<String>,
    },
    #[serde(rename = "compression_failed")]
    Failed {
        session_id: String,
        error: String,
        can_retry: bool,
    },
}
```

### 前端集成

使用现有 `useContextCompression` Hook 扩展：

```typescript
// src/features/agent/hooks/useContextCompression.ts

interface UseContextCompressionOptions {
  autoTrigger?: boolean;
  warningThreshold?: number;  // 默认 0.8
  criticalThreshold?: number; // 默认 0.9
}

interface UseContextCompressionReturn {
  tokenUsage: TokenUsageReport | null;
  isCompressing: boolean;
  compressionProgress: number;
  triggerCompression: (strategy?: string) => Promise<CompressionResult>;
  cancelCompression: () => void;
}

// 使用示例
const {
  tokenUsage,
  isCompressing,
  compressionProgress,
  triggerCompression
} = useContextCompression({
  autoTrigger: true,
  warningThreshold: 0.8
});
```

### 性能考虑

1. **异步压缩**: 压缩过程在后台线程执行，不阻塞 Agent
2. **增量更新**: 仅在必要时执行全量压缩
3. **缓存摘要**: 相同上下文的摘要结果缓存
4. **流式通知**: 压缩进度实时推送前端
