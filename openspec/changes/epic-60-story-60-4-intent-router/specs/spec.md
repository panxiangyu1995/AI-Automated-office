# Specification: 意图路由引擎

## 需求来源

### PRD 需求

| 需求编号 | 描述 |
|----------|------|
| FR930 | 用户可以通过自然语言触发 Sub-Agent |
| FR931 | 系统支持关键词和意图两种路由方式 |
| FR932 | 路由结果可追溯和调试 |

### 架构约束

| ADR | 描述 |
|-----|------|
| ADR-059 | 部门化 Subagent 架构 |
| ADR-013 | Sub-Agent 执行上下文和隔离 |

## 功能规格

### 用户故事

As a **用户**,
I want **对话中自然触发 Subagent**,
So that **我无需手动选择就能获得专业帮助**。

### 验收场景

#### Scenario 1: 关键词路由

- **GIVEN** 用户说"帮我识别发票"
- **WHEN** 识别到关键词"发票"
- **THEN** 路由到 finance Subagent

#### Scenario 2: 委派执行

- **GIVEN** 路由决策完成
- **WHEN** 执行委派
- **THEN** 构建 DelegationContract 并执行

## 路由规则

| 意图 | 目标 | 模式 |
|------|------|------|
| finance.ocr | finance | light |
| finance.query | finance | primary |
| sales.order | sales | primary |
| cross.department | orchestrator | parallel |
