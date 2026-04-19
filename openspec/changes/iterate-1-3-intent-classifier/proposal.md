# 迭代变更提案 - 完善意图分类器

## 1. 背景与目标

### 问题描述
当前意图分类器功能有限：
- IntentType 枚举不够丰富
- 缺少 KeywordIntentClassifier 实现
- 不支持多级意图分类

### 目标
扩展 IntentType 枚举，实现 KeywordIntentClassifier，支持多级意图分类。

## 2. 预期效果

- 支持更多意图类型
- KeywordIntentClassifier 正常工作
- 支持多级意图分类
- 路由决策更加精准

## 3. 影响范围

### 受益模块
- `router/classifier.rs` - 意图分类器

### 用户感知
- 更准确的意图识别
- 更好的路由效果

## 4. 变更类型

- [x] 新增功能
- [ ] 缺陷修复
- [ ] 性能优化
- [ ] 重构

## 5. PRD 覆盖

- FR-AGENT-001: AI Agent 核心能力
