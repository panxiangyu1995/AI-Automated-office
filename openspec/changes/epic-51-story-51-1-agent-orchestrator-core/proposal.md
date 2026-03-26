# Proposal: 主Agent协调器 - 核心协调模块

## 变更类型
- [x] 重构

## 背景

创建主Agent协调器，整合会话生命周期、运行时状态机、结构化规划器和步骤执行器，实现从用户输入到执行计划的完整流程编排。

## 目标

实现主Agent协调器 - 核心协调模块，满足以下验收标准：
- 创建AgentOrchestrator核心类，整合sessionLifecycle、runtimeStateMachine、structuredPlanner、stepExecutor
- 实现用户消息接收与意图解析入口
- 实现计划生成与执行状态流转的完整协调
- 添加执行过程中的事件分发与状态同步
- 实现执行完成后的结果汇总与消息生成

## 范围

### 包含
- 创建AgentOrchestrator核心类，整合sessionLifecycle、runtimeStateMachine、structuredPlanner、stepExecutor
- 实现用户消息接收与意图解析入口
- 实现计划生成与执行状态流转的完整协调
- 添加执行过程中的事件分发与状态同步
- 实现执行完成后的结果汇总与消息生成

### 不包含
- 非本Story范围内的功能

## 影响范围

### 前端
- 基于现有前端接口和UI组件扩展

### 后端
- 需要创建对应的Rust后端实现

### 数据库
- 如有数据模型变更，在此说明

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | 高 | 高 | Task 101提供基础架构 |
| 前端接口已存在但未连接 | 中 | 中 | 逐步对接测试 |

## 依赖

- **前置依赖**: Story 43.1, Story 43.2, Story 43.3, Story 44.1, Story 44.2, Story 44.3
- **后置依赖**: 本Story完成后可解锁后续Story

## 实现步骤

1. 创建AgentOrchestrator核心类，整合sessionLifecycle、runtimeStateMachine、structuredPlanner、stepExecutor
2. 实现用户消息接收与意图解析入口
3. 实现计划生成与执行状态流转的完整协调
4. 添加执行过程中的事件分发与状态同步
5. 实现执行完成后的结果汇总与消息生成
