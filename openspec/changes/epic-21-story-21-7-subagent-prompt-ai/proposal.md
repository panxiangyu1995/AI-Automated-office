# Epic 21 Story 21.7: Sub-Agent AI辅助提示词生成

## Why

Sub-Agent是复杂任务的分解执行机制。当前Sub-Agent配置复杂，需要AI辅助生成提示词：

1. **配置复杂**：手动编写Sub-Agent提示词困难
2. **角色模糊**：难以定义清晰的职责边界
3. **路由不智能**：无法根据上下文自动选择

**量化收益**：
- 减少Sub-Agent配置时间 80%
- 提升角色一致性 70%
- 优化任务分配效率 60%

## What Changes

### 新增功能

1. **AI提示词生成**
   - 基于任务描述生成
   - 角色模板推荐
   - 参数优化建议

2. **触发配置**
   - 关键词触发
   - 条件触发
   - 手动触发

3. **路由选择**
   - 自动路由
   - 手动指定
   - 优先级配置

4. **嵌套调用**
   - 最多3层嵌套
   - 层级限制
   - 上下文传递

5. **回退机制**
   - 自动回退
   - 自定义策略
   - 错误恢复

## Capabilities

### New Capabilities

| Capability | 描述 |
|-----------|------|
| `subagent-generate-prompt` | AI生成提示词 |
| `subagent-config` | 配置Sub-Agent |
| `subagent-route` | 任务路由 |
| `subagent-execute` | 执行Sub-Agent |
| `subagent-fallback` | 回退处理 |

## Impact

### 前端影响

| 文件 | 说明 |
|------|------|
| `src/features/agent/components/SubAgentConfig/` | Sub-Agent配置 |

### 后端影响

| 模块 | 说明 |
|------|------|
| `src-tauri/src/agent/subagent/` | Sub-Agent模块 |

## PRD对齐

### 功能需求（FR）

| FR编号 | 描述 |
|--------|------|
| FR905 | 提示词生成 |
| FR906 | 编辑调整 |
| FR907 | 触发配置 |
| FR908 | 模型选择 |
| FR909 | 自动路由 |
| FR910 | 手动指定 |
| FR911 | 嵌套调用 |
| FR912 | 回退机制 |

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 嵌套过深 | 中 | 深度限制 |
| 上下文泄露 | 中 | 权限控制 |
