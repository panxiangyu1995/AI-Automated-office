# 迭代变更提案 - LLM引导路由实现

## 1. 背景与目标

### 问题描述
当前 `SubAgentRoutingService` 的 LLM 引导路由（`MatchStrategy::LlmGuided`）是占位实现：
```rust
MatchStrategy::LlmGuided => {
    Self::keyword_match(rule, context) * 0.6  // 假数据
}
```

缺少真正调用 LLM 进行意图分析和路由决策的能力。

### 目标
实现基于 LLM 的意图分析和路由决策，支持动态理解用户意图并选择最合适的 Agent。

## 2. 预期效果

- LLM 引导路由正常工作
- 支持意图置信度阈值
- 正确回退到规则匹配
- 路由决策更加智能

## 3. 影响范围

### 受益模块
- `router/router.rs` - IntentRouter
- `routing.rs` - SubAgentRoutingService

### 用户感知
- 更准确的意图识别
- 更智能的 Agent 路由选择

## 4. 变更类型

- [x] 新增功能
- [ ] 缺陷修复
- [ ] 性能优化
- [ ] 重构

## 5. PRD 覆盖

- FR-AGENT-001: AI Agent 核心能力
- FR-AGENT-002: 工具调用系统
