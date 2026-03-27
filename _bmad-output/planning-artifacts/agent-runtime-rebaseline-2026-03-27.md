# Agent Runtime Rebaseline

日期：2026-03-27

## 目标

基于当前真实代码状态，重新规划项目的通用 Agent 能力开发顺序，避免继续围绕 Skill、业务 Pilot、Sub-Agent 或演示型 UI 扩散复杂度。

本次重排的核心结论只有一句话：

**当前项目不是“没有 Agent 设计”，而是“前端运行时壳层和模型做了不少，但后端真实执行主链没有立起来”。**

因此，新的计划不是重做 Story 43-49，而是把已完成的基础模型接到真实后端执行面，并在此之后才继续扩展高级能力。

## 代码现状判断

### 已完成并可复用的基础

以下能力已在归档任务中完成，当前批次不应重复实现：

- Session lifecycle
- Message and part model
- Streaming event model
- Interrupt / retry / checkpoint 基础模型
- Runtime state machine
- Structured planner
- Step executor
- Tool descriptor / registry / executor / normalization / precheck
- User / tenant / department / page / resource context
- Session summary / knowledge retrieval baseline
- Trace / tool audit / failure recording / runtime metrics 模型
- Form / detail / workbench / editor writeback adapter

这些基础主要分布于：

- `task-archived-1.json` 的 Task 60-87
- `src/features/session/**`
- `src/features/streaming/**`
- `src/features/agent/**`

### 已有但仍停留在壳层、内存态或 mock 的部分

- `src/features/session/runtime/sessionStore.ts`
  仍是前端 Zustand 内存态 Session 管理。
- `src/features/agent/components/AgentChatPanel.tsx`
  默认仍会走 `simulateResponse`。
- `src/features/session/runtime/knowledgeRetrieval.ts`
  仍存在 `mockRetrieve`。
- `src/features/session/tools/toolRegistry.ts`
  `registerCoreTools()` 仍是 placeholder。
- 多个 Agent / Pilot / Observability 面板仍以 mock 数据驱动。

### 当前最大的真实缺口

后端 Rust 执行主链几乎不存在：

- `src-tauri/src/agent/` 目录不存在
- `src-tauri/src/lib.rs` 未注册任何 Agent 专属 command
- 当前后端只有通用能力：
  - `http` 命令
  - `session cache`
  - 若干 storage store
  - vector 模块

也就是说，**项目现在缺的不是“再写一个 planner”，而是“把 planner 真正跑起来的执行 spine”。**

## 对旧任务规划的判断

旧版 `task.json` 存在 4 个问题：

- 不是合法 JSON，无法作为可靠执行入口。
- `sourceOfTruth` 指向 `openspec/changes/agent-core-integration`，但该目录并不存在。
- 计划把 Epic 51-56 直接串成新一轮大开发，但没有明确承认 43-49 已经完成的基础。
- 过早把 Sub-Agent、Prompt、治理增强和业务模块集成排进主路径，导致主 Agent 端到端主链仍未闭环。

## 重排原则

### 1. 不重复实现已完成的基础模型

Task 60-87 对应的 43-49 基础能力视为已完成并可复用。

### 2. 当前批次的关键词是“集成”和“落地”

优先补齐：

- Rust Agent 模块
- Provider 请求链
- Tool pipeline
- 前后端事件桥接
- 真实会话、消息、步骤、追踪持久化

### 3. 前端面板不再作为主路径驱动项

凡是只有 UI、没有真实后端数据链的能力，不再优先排在主链上。

### 4. Sub-Agent 必须后置

主 Agent 的真实执行、恢复、安全、审计没有跑通之前，不应继续扩大多 Agent 复杂度。

### 5. 纠错与自我改善保持受控

纠错规则与改进建议只做“建议输入”和“命中记录”，不允许自动修改 Prompt、Skill、Policy、Template 或 Tool 配置。

## 新的实施阶段

### Phase 1 - Execution Spine

目标：把主 Agent 从“前端运行时壳层”升级为“真实可执行系统”。

- Task 111: Rust Agent 核心模块与主协调器落地
- Task 112: 运行时事件流与前后端流式桥接
- Task 113: 真实工具执行管道与核心工具注册
- Task 114: 主聊天入口接入真实运行时与端到端验收框架

### Phase 2 - Context, Memory, Prompt

目标：让主 Agent 具备真实上下文构建、摘要压缩和知识检索能力。

- Task 115: Prompt Builder 与 Provider 请求主链
- Task 116: 上下文压缩与会话摘要持久化
- Task 117: 知识检索与记忆接入替换 mock 实现

### Phase 3 - Reliability and Governance

目标：让主 Agent 具备可恢复、可审计、可监控、可治理能力。

- Task 118: 重试、重规划与检查点恢复闭环
- Task 119: 追踪、审计与失败记录持久化
- Task 120: 运行时指标与调试遥测打通
- Task 121: 安全加固与确认/权限后端强制执行

### Phase 4 - Advanced Common Agent

目标：在主 Agent 稳定后，再逐步扩展高级通用能力。

- Task 122: 纠错规则读取与受控应用基线
- Task 123: Sub-Agent 路由基线
- Task 124: Sub-Agent 执行上下文与隔离
- Task 125: Sub-Agent 嵌套调用控制
- Task 126: Sub-Agent 结果回传与摘要整合
- Task 127: Sub-Agent 监控与链路诊断

## 本次重排后的边界

### 当前批次纳入

- 主 Agent 真实执行主链
- 流式事件桥接
- 真实工具执行
- Prompt / Memory / Knowledge
- 重试恢复 / 审计 / 指标 / 安全
- 受控纠错规则
- Sub-Agent 的后置扩展路径

### 当前批次移出主路径

- Office / Skill / Plugin 市场规划
- 部门业务 Pilot 集成
- 只做展示的 mock 面板优化
- 文档、类型统一、虚拟列表等 polish 项

## 验收门槛

只有同时满足以下条件，才能认为通用 Agent 主链真正完成：

- 聊天入口不再依赖 `simulateResponse`
- 后端存在可执行的 `src-tauri/src/agent/` 主模块
- 前端运行时与后端 orchestrator 有真实桥接
- Tool pipeline 能执行真实 core tool，并带权限与确认流
- trace / audit / failure / metrics 均可持久化查询
- knowledge retrieval 不再依赖 `mockRetrieve`
- checkpoint / retry / replan 可以在真实执行链中工作

## 与任务文件的关系

本文件是新的路线基准。

- 执行入口：`task.json`
- 规划依据：本文件
- 总的 OpenSpec 重排入口：`openspec/changes/agent-runtime-rebaseline`

## 结论

当前项目的正确方向不是继续讨论 Skill 生态，也不是继续堆业务 Pilot，而是：

**先把通用 Agent 的执行主链、上下文主链、治理主链做实。**

这也是后续一切 Skill、插件、业务模块、Sub-Agent 能真正落地的前提。
