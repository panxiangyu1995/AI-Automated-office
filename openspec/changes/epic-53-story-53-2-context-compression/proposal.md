# Proposal: 上下文压缩触发与执行

## 变更类型
- [x] 重构 (refactor)

## 背景

随着 Agent 与用户对话的进行，上下文窗口会逐渐积累对话历史、工具调用结果等信息。当上下文达到 LLM 的 Token 限制时，会导致：
1. 无法继续对话
2. 模型性能下降（中间信息被稀释）
3. 成本增加（处理过多无关内容）

需要实现自动上下文压缩机制，当上下文达到阈值（默认 80%）时自动触发压缩流程，保持对话的连贯性和模型性能。

## 目标

实现上下文压缩触发与执行，满足以下验收标准：

1. 创建 ContextCompressor 集成到 Agent 执行流程
2. 实现 Token 使用实时监测
3. 添加上下文窗口阈值检测（默认 80%）
4. 集成摘要生成、滑动窗口、关键事实提取
5. 实现压缩过程的透明化通知

## 范围

### 包含
- 创建 `src-tauri/src/agent/compression/mod.rs` 模块
- 创建 `ContextCompressor` Rust 结构体
- 实现 Token 计数器，实时监测上下文 Token 使用
- 实现阈值检测器（默认 80% 触发压缩）
- 实现压缩策略：
  - 摘要生成（Summarization）
  - 滑动窗口（Sliding Window）
  - 关键事实提取（Key Fact Extraction）
- 实现压缩触发时机：自动 vs 手动
- 实现压缩过程的前端透明化通知
- Tauri 命令暴露：`invoke_trigger_compression`, `invoke_get_token_usage`

### 不包含
- 前端 UI 展示组件（由 Story 51.2 流式事件总线负责）
- LLM API 调用（由 LLM Adapter 负责）
- 记忆存储实现（由 Epic 6 负责）

## 影响范围

### 前端
- 需要监听压缩事件（`compression_start`, `compression_progress`, `compression_complete`）
- 需要显示 Token 使用情况（由 Story 51.2 流式事件支持）
- 使用现有 Hook: `useContextCompression`（需扩展）

### 后端
- 新增 Rust 模块：`src-tauri/src/agent/compression/mod.rs`
- 新增 Rust 模块：`src-tauri/src/agent/compression/strategy.rs`
- 新增 Rust 模块：`src-tauri/src/agent/compression/token_counter.rs`
- 修改：`src-tauri/src/agent/session/manager.rs` 集成压缩触发

### 数据库
- 无直接数据库变更
- 压缩后的摘要存储依赖记忆系统（Epic 6）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 压缩导致重要信息丢失 | 中 | 高 | 实现关键事实提取，保留重要信息 |
| 摘要质量差影响对话 | 中 | 高 | 配置压缩质量参数，提供降级方案 |
| 压缩触发时机不当 | 低 | 中 | 提供手动触发和配置选项 |
| 前端通知丢失 | 低 | 低 | 实现事件重试机制 |

## 依赖

### 前置依赖
- Story 53.1 (提示词构建器) - 依赖其提供的提示词构建能力
- Story 6.5 (上下文压缩配置)
- Task 101 (后端 Rust Agent 基础架构)

### 后置依赖
- Story 53.3 (错题集规则自动应用) - 依赖压缩后的上下文
- Story 53.4 (记忆检索与注入集成) - 依赖压缩触发机制

## 实现步骤

1. **创建压缩模块结构**
   - 创建 `src-tauri/src/agent/compression/` 目录
   - 创建 `mod.rs` 模块入口
   - 创建 `token_counter.rs` 实现 Token 计数
   - 创建 `strategy.rs` 实现压缩策略

2. **实现 Token 计数器**
   - 实现中英文 Token 估算算法
   - 实现实时监测接口
   - 实现阈值检测逻辑

3. **实现压缩策略**
   - 实现摘要生成策略
   - 实现滑动窗口策略
   - 实现关键事实提取策略
   - 实现策略选择器

4. **实现 ContextCompressor**
   - 定义压缩配置结构
   - 实现压缩触发逻辑
   - 实现压缩执行流程
   - 实现结果格式化

5. **集成到 Agent 执行流程**
   - 在会话管理器中集成压缩检查
   - 实现自动触发机制
   - 添加手动触发接口

6. **实现透明化通知**
   - 定义压缩事件类型
   - 实现事件发布机制
   - 与 Story 51.2 流式事件总线集成

7. **暴露 Tauri 命令**
   - 实现 `invoke_trigger_compression` 命令
   - 实现 `invoke_get_token_usage` 命令
