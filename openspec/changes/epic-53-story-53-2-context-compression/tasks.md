# Tasks: 上下文压缩触发与执行

## 任务列表

### Task 121: 上下文压缩触发与执行

| 属性 | 值 |
|------|-----|
| **ID** | 121 |
| **Epic** | Epic 53 |
| **Story** | Story 53.2 |
| **标题** | 上下文压缩触发与执行 |
| **implementationType** | refactor |
| **优先级** | high |
| **阶段** | Phase 3 - 记忆层与提示词集成 |

### 详细任务清单

#### 1. 创建压缩模块结构
- [ ] 创建 `src-tauri/src/agent/compression/` 目录
- [ ] 创建 `mod.rs` 模块入口
- [ ] 创建 `token_counter.rs` Token 计数器
- [ ] 创建 `strategy.rs` 压缩策略
- [ ] 创建 `context.rs` 压缩上下文
- [ ] 更新 `src-tauri/src/agent/mod.rs` 引入 compression 模块

#### 2. 实现 Token 计数器 (token_counter.rs)
- [ ] 定义 `TokenCounter` 结构体
- [ ] 实现 `TokenCounter::new(model_max_tokens)` 构造函数
- [ ] 实现 `estimate()` 方法（中英文 Token 估算）
- [ ] 实现 `usage_rate()` 方法
- [ ] 实现 `should_compress()` 方法（阈值检查）
- [ ] 实现 `recommended_target()` 方法
- [ ] 定义 `TokenUsageReport` 结构体
- [ ] 定义 `Action` 枚举

#### 3. 实现压缩策略 (strategy.rs)
- [ ] 定义 `CompressionStrategy` 枚举
- [ ] 实现 `SummarizeStrategy` 结构体和压缩逻辑
- [ ] 实现 `SlidingWindowStrategy` 结构体和压缩逻辑
- [ ] 实现 `KeyFactExtractionStrategy` 结构体和压缩逻辑
- [ ] 实现 `HybridStrategy` 结构体和压缩逻辑
- [ ] 定义 `CompressionStrategyTrait` trait
- [ ] 为各策略实现 `estimate_output_tokens()` 方法

#### 4. 实现压缩上下文 (context.rs)
- [ ] 定义 `CompressionContext` 结构体
- [ ] 定义 `CompressionResult` 结构体
- [ ] 实现关键事实提取辅助函数
- [ ] 实现消息摘要辅助函数

#### 5. 实现 ContextCompressor (mod.rs)
- [ ] 定义 `ContextCompressor` 结构体
- [ ] 实现 `ContextCompressor::new()` 构造函数
- [ ] 实现 `register_strategy()` 方法
- [ ] 实现 `needs_compression()` 方法
- [ ] 实现 `compress()` 方法
- [ ] 实现 `generate_summary()` 异步方法
- [ ] 实现错误处理 `CompressionError` 枚举

#### 6. 集成到 Agent 执行流程
- [ ] 修改会话管理器，添加压缩检查点
- [ ] 在每次 Agent 执行后调用 `needs_compression()`
- [ ] 实现自动压缩触发逻辑
- [ ] 添加手动压缩触发接口

#### 7. 实现透明化通知
- [ ] 定义压缩事件类型 `CompressionEvent`
- [ ] 实现事件发布接口
- [ ] 与 Story 51.2 流式事件总线集成
- [ ] 实现事件序列：start → progress → complete/failed

#### 8. 暴露 Tauri 命令
- [ ] 实现 `invoke_trigger_compression` 命令
- [ ] 实现 `invoke_get_token_usage` 命令
- [ ] 实现 `invoke_estimate_compression` 命令
- [ ] 定义相关请求/响应结构体

#### 9. 前端 Hook 扩展
- [ ] 扩展 `src/features/agent/hooks/useContextCompression.ts`
- [ ] 添加 Token 使用状态管理
- [ ] 添加压缩进度状态管理
- [ ] 实现自动触发逻辑

### 验收标准

#### 功能验收
- [ ] Token 计数器准确估算中英文 Token 数
- [ ] 阈值检测在 80% 时正确触发警告
- [ ] 阈值检测在 90% 时正确触发强制压缩
- [ ] 摘要生成策略正确压缩对话历史
- [ ] 滑动窗口策略正确保留最近消息
- [ ] 关键事实提取策略正确提取重要信息
- [ ] 压缩结果正确应用到后续 Agent 执行
- [ ] 压缩事件正确发送到前端
- [ ] 手动和自动压缩触发均正常工作

#### 非功能验收
- [ ] 压缩过程不阻塞 Agent 执行（异步）
- [ ] 通过 lint 检查
- [ ] 单元测试覆盖核心逻辑
- [ ] Rust 编译通过，无警告

### 测试要点

#### 单元测试
- Token 估算准确性测试（中英文混合）
- 阈值检测测试
- 各压缩策略输出测试
- 压缩比计算测试

#### 集成测试
- 与会话管理器集成测试
- 与流式事件总线集成测试
- 与 LLM Adapter 集成测试
- Tauri 命令端到端测试

#### 边界条件测试
- 空对话历史压缩
- 已压缩上下文再次压缩
- Token 计数溢出处理
- 压缩超时处理
- 压缩过程中新消息到达处理

### 执行顺序

1. 完成前置依赖（Task 101, Story 53.1, Story 6.5）
2. 创建压缩模块结构
3. 实现 Token 计数器
4. 实现压缩策略
5. 实现 ContextCompressor
6. 集成到 Agent 执行流程
7. 实现透明化通知
8. 暴露 Tauri 命令
9. 前端 Hook 扩展
10. 单元测试
11. 集成测试
12. 文档更新
