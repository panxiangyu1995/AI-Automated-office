# Tasks: SubAgent完整集成

## 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 3 - SubAgent集成

## 任务列表

### Task 1: 创建意图路由中间件
- **描述**: 在 AgentOrchestrator 中添加意图路由检查
- **文件**:
  - `src-tauri/src/agent/agent_orchestrator.rs`
  - `src-tauri/src/agent/routing.rs`
- **验收**: 主 Agent 能够识别委派意图

### Task 2: 实现委派执行器
- **描述**: 创建 DelegationExecutor 并实现委派执行逻辑
- **文件**:
  - `src-tauri/src/agent/subagent/executor.rs` (新建)
  - `src-tauri/src/agent/subagent/mod.rs`
- **验收**: 委派执行完成并返回结果

### Task 3: 实现权限继承/收缩
- **描述**: 实现权限收缩规则和应用逻辑
- **文件**:
  - `src-tauri/src/agent/permission/middleware.rs`
- **验收**: SubAgent 仅能访问允许的工具和数据

### Task 4: 添加路由相关 Tauri 命令
- **描述**: 添加 route_message, delegate_to_subagent, get_routing_history 命令
- **文件**:
  - `src-tauri/src/commands/subagent.rs`
- **验收**: 前端能够调用路由相关功能

### Task 5: 创建 SubAgent 配置 UI
- **描述**: 创建 SubAgentConfig 和 SubAgentDelegatePanel 组件
- **文件**:
  - `src/features/settings/components/SubAgentConfig.tsx` (新建)
  - `src/features/agent/components/SubAgentDelegatePanel.tsx` (新建)
  - `src/lib/tauri-subagent.ts` (新建)
- **验收**: 前端能够配置 SubAgent

### Task 6: 编写 SubAgent E2E 测试
- **描述**: 编写路由和委派的 E2E 测试
- **文件**:
  - `tests/e2e/subagent-routing.spec.ts` (新建)
- **验收**: E2E 测试通过

## 测试要点

- [ ] 单元测试：路由决策逻辑
- [ ] 单元测试：权限收缩规则
- [ ] 集成测试：SubAgent 委派流程
- [ ] E2E 测试：完整路由和委派流程
- [ ] 浏览器测试：SubAgent 配置 UI
