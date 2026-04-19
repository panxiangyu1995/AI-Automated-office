# 迭代变更提案 - 语义路由实现

## 1. 背景与目标

### 问题描述
当前 `SubAgentRoutingService` 的语义路由（`MatchStrategy::Semantic`）是占位实现：
```rust
MatchStrategy::Semantic => {
    Self::keyword_match(rule, context) * 0.8  // 假数据
}
```

缺少真正的向量相似度计算能力，导致路由决策不够精准。

### 目标
实现基于 Embedding 向量的语义路由匹配，使用余弦相似度计算用户消息与路由规则的语义相似度。

## 2. 预期效果

- 语义路由匹配准确率 > 80%
- 支持向量相似度计算
- 支持 Top-K 规则匹配
- 路由决策更加智能

## 3. 影响范围

### 受益模块
- `routing.rs` - 路由服务
- `SubAgentRoutingService` - 语义匹配能力增强

### 用户感知
- 更准确的意图识别
- 更智能的 Agent 路由选择
- 减少错误路由导致的用户体验问题

## 4. 变更类型

- [x] 新增功能
- [ ] 缺陷修复
- [ ] 性能优化
- [ ] 重构

## 5. PRD 覆盖

- FR-AGENT-001: AI Agent 核心能力
- FR-AGENT-002: 工具调用系统
