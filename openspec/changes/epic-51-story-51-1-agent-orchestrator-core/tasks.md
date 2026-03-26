# Tasks: 主Agent协调器 - 核心协调模块

## 任务列表

### Task 111: 主Agent协调器 - 核心协调模块
- **描述**: 创建主Agent协调器，整合会话生命周期、运行时状态机、结构化规划器和步骤执行器，实现从用户输入到执行计划的完整流程编排。
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 1 - Agent Runtime端到端集成
- **验收标准**:
  - 创建AgentOrchestrator核心类，整合sessionLifecycle、runtimeStateMachine、structuredPlanner、stepExecutor
  - 实现用户消息接收与意图解析入口
  - 实现计划生成与执行状态流转的完整协调
  - 添加执行过程中的事件分发与状态同步
  - 实现执行完成后的结果汇总与消息生成

## 执行顺序

1. 完成前置依赖（Story 43.1, Story 43.2, Story 43.3, Story 44.1, Story 44.2, Story 44.3）
2. 实现核心功能
3. 前后端对接
4. 集成测试
5. UI优化

## 测试要点

- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E测试（根据优先级）
- [ ] 浏览器测试（如涉及UI）
