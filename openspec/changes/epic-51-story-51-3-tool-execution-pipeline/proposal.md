# Proposal: 工具执行管道 - 完整执行链

## 变更类型
- [ ] 新功能
- [x] 重构
- [ ] 优化
- [ ] 开发

## 背景

工具执行管道是 Agent Runtime 的核心能力之一，负责将 Agent 生成的执行计划转化为实际的操作。

**Story 51.3 工具执行管道**负责：
- 连接前端工具注册表与后端实际执行器
- 实现工具描述符与后端执行器的绑定
- 集成敏感操作检测和安全策略
- 实现权限检查、路径验证等管道环节

## 目标

实现从工具注册表到实际执行的完整管道，包括权限预检查、敏感操作检测、执行器调用、结果归一化。

## 范围

### 包含
- 创建后端 ToolExecutionPipeline，连接前端 toolRegistry/toolExecutor/toolPermissionPrecheck
- 实现工具描述符与后端实际执行器的绑定机制
- 集成 sensitiveActionDetection 到后端执行流程
- 实现工具策略管道：权限检查 → 沙箱验证 → 路径检查 → 执行
- 添加工具降级方案的自动执行逻辑

### 不包含
- 具体工具的实现（属于各自的功能模块）
- 工具注册表的管理界面（属于 Story 45.x）

## 影响范围

### 前端
- `src/features/session/tools/toolRegistry.ts` - 对接后端执行器
- `src/features/session/tools/toolExecutor.ts` - 迁移到后端
- `src/features/session/tools/toolPermissionPrecheck.ts` - 对接后端

### 后端
- `src-tauri/src/agent/tool/` - 工具执行管道目录
- `src-tauri/src/agent/tool/pipeline.rs` - 主管道
- `src-tauri/src/agent/tool/registry.rs` - 后端工具注册表
- `src-tauri/src/agent/tool/executor.rs` - 执行器
- `src-tauri/src/agent/tool/security.rs` - 安全检查

### 数据库
- 暂无数据模型变更

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 工具执行安全风险 | 高 | 高 | 多层安全检查，沙箱执行 |
| 工具执行超时 | 高 | 中 | 设置超时限制，降级处理 |
| 工具参数验证复杂 | 中 | 中 | 复用前端验证逻辑 |

## 依赖

- **前置依赖**:
  - Story 45.1, 45.2, 45.3: 工具系统基础
  - Story 51.1: Agent协调器核心
- **后置依赖**: Story 51.4, Story 54.x

## 实现步骤

1. 创建后端ToolExecutionPipeline，连接前端toolRegistry/toolExecutor/toolPermissionPrecheck
2. 实现工具描述符与后端实际执行器的绑定机制
3. 集成sensitiveActionDetection到后端执行流程
4. 实现工具策略管道：权限检查→沙箱验证→路径检查→执行
5. 添加工具降级方案的自动执行逻辑
