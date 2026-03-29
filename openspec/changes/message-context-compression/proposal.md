## Why

随着对话历史增长，每条消息都发送给LLM会导致上下文膨胀、响应变慢、成本增加。现有`context_compression.rs`存在但未集成到消息流程。需要实现智能的上下文压缩，既保留关键信息又控制token数量。

## What Changes

- 集成现有的context_compression到消息发送流程
- 实现基于对话轮次的压缩策略
- 添加摘要式压缩（将多轮对话合并为摘要）
- 支持强制压缩（用户手动触发）和自动压缩（阈值触发）
- 在压缩前后保留关键实体（人名、日期、金额等）

## Capabilities

### New Capabilities
- `context-auto-compression`: 自动上下文压缩，当上下文超过阈值时触发
- `context-manual-compression`: 手动压缩，用户可随时触发
- `context-summary`: 对话摘要生成，将多轮对话压缩为简洁摘要
- `context-entity-preservation`: 关键实体保留，确保重要信息不被压缩丢失

### Modified Capabilities
- (无 - 压缩仅改变发送给LLM的内容格式，不改变消息本身的能力)

## Impact

**前端：**
- `src/features/agent/hooks/useAgentRuntime.ts` - 压缩触发逻辑
- 新增`src/features/agent/hooks/useContextCompression.ts` - 压缩状态管理
- UI添加"压缩上下文"按钮

**后端 (Rust)：**
- `src-tauri/src/agent/context_compression.rs` - 完善并集成
- `src-tauri/src/agent/runtime_session.rs` - 压缩时机触发

**压缩策略：**
- 自动触发阈值：上下文 > 50条消息 或 token数 > 32000
- 保留最近10轮完整对话
- 中间轮次做摘要压缩
- 关键实体使用特殊标记保留

**依赖：**
- 需要LLM API支持摘要生成（可用更小的模型做摘要）
- 需评估token计算库
