# Proposal: SubAgent完整集成

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

当前 SubAgent 系统已具备以下基础设施：
- `src-tauri/src/agent/subagent/` - Subagent 模块（types, loader, department_loader, personal_loader, manager）
- `src-tauri/src/agent/router/` - Intent Router 模块（classifier, router, executor）
- `src-tauri/src/agent/routing.rs` - SubAgent 路由服务
- 前端 `src/features/settings/components/SubAgentRegistry.tsx` - SubAgent 注册表 UI
- 前端 `src/features/settings/components/SubAgentRouting.tsx` - SubAgent 路由配置 UI
- Tauri 命令 `src-tauri/src/commands/subagent.rs` - SubAgent CRUD 操作

**缺失部分**：SubAgent 与主 Agent Runtime 的完整集成、意图路由中间件、委派执行流程。

## 目标

将 SubAgent 系统与主 Agent Runtime 完整集成，实现：
1. 意图路由中间件 - 在主 Agent 处理请求时自动识别需要委派的意图
2. 委派执行流程 - 将请求委派给合适的 SubAgent 并执行
3. 权限继承/收缩 - SubAgent 执行时的权限控制
4. SubAgent 配置 UI - 前端界面用于配置 SubAgent

## 范围

### 包含
- 实现意图路由中间件，集成到 AgentOrchestrator
- 实现委派执行流程，支持超时和错误处理
- 实现权限继承/收缩机制
- 创建 SubAgent 配置 UI
- 编写 SubAgent E2E 测试

### 不包含
- SubAgent 的实际业务逻辑实现（各业务 SubAgent 由各自部门模块负责）
- SubAgent 的持久化存储（已有基础）

## 影响范围

### 前端
- `src/features/settings/components/SubAgentConfig.tsx` - 新增 SubAgent 配置组件
- `src/features/agent/components/SubAgentDelegatePanel.tsx` - 委派面板
- `src/lib/tauri-subagent.ts` - SubAgent Tauri 命令封装

### 后端
- `src-tauri/src/agent/routing.rs` - 扩展 SubAgentRoutingService
- `src-tauri/src/agent/agent_orchestrator.rs` - 集成路由中间件
- `src-tauri/src/commands/subagent.rs` - 添加路由相关命令
- `src-tauri/src/agent/subagent/executor.rs` - 新增委派执行器

### 数据库
- 无变更（使用现有存储）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 路由决策不准确 | 中 | 中 | 提供手动路由模式作为备选 |
| SubAgent 超时 | 中 | 中 | 实现超时中断和优雅降级 |
| 循环委派 | 低 | 高 | 添加委派深度限制 |

## 依赖

- **前置依赖**: Task 204 (SubAgent基础架构), Task 205 (SubAgent注册), Task 207 (SubAgent管理)
- **后置依赖**: Task 165 (MVP最终集成测试)

## 验收标准

1. 主 Agent 能够识别需要委派的意图
2. 委派执行流程正确执行并返回结果
3. 权限继承/收缩机制正常工作
4. 前端 UI 能够配置 SubAgent 和查看路由历史
5. E2E 测试通过
