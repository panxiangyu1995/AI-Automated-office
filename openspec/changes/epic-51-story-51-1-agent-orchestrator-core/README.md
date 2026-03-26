# Epic 51, Story 51.1: 主Agent协调器 - 核心协调模块

## 概述

创建主Agent协调器，整合会话生命周期、运行时状态机、结构化规划器和步骤执行器，实现从用户输入到执行计划的完整流程编排。

## 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 1 - Agent Runtime端到端集成

## 铁律映射

### PRD 需求
- **FRs**: FR400, FR401, FR402, FR403, FR404
- **NFRs**: NFR1, NFR16, NFR17

### 架构需求
- **ARCH**: ADR-001, ADR-037, ADR-043

### UX 需求
- **UX**: UX-01, UX-04

## 验收标准

1. 创建AgentOrchestrator核心类，整合sessionLifecycle、runtimeStateMachine、structuredPlanner、stepExecutor
2. 实现用户消息接收与意图解析入口
3. 实现计划生成与执行状态流转的完整协调
4. 添加执行过程中的事件分发与状态同步
5. 实现执行完成后的结果汇总与消息生成

## 依赖

- Story 43.1
- Story 43.2
- Story 43.3
- Story 44.1
- Story 44.2
- Story 44.3

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic文档: `_bmad-output/planning-artifacts/epics.md`
