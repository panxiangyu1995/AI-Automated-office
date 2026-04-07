# Proposal: 检查点系统Runtime集成

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

检查点系统基础已实现：
- `src-tauri/src/storage/checkpoint_store.rs` - CheckpointStore存储模块
- 支持检查点创建、获取、列表、删除

**缺失部分**：与AgentRuntime的集成、自动检查点创建、回滚功能。

## 目标

将CheckpointStore与AgentRuntime集成，实现：
1. 用户发送消息时自动创建检查点（FR17-1）
2. 检查点列表和回滚API
3. 编辑重试分支功能
4. Git提交集成

## 范围

### 包含
- 自动检查点创建
- 检查点管理API
- 回滚功能（仅对话/对话+文件）
- Git提交集成

### 不包含
- 检查点UI展示（由前端负责）

## 影响范围

### 后端
- `src-tauri/src/agent/checkpoint.rs` - 检查点集成模块
- `src-tauri/src/agent/execution.rs` - 执行模块
- `src-tauri/src/storage/checkpoint_store.rs` - 已有

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Git未安装 | 低 | 中 | 优雅降级 |
| 检查点过多 | 中 | 低 | 自动清理 |
| 回滚冲突 | 低 | 高 | 确认对话框 |

## 依赖

- **前置依赖**: Task 157 (Agent E2E集成测试)
- **后置依赖**: Task 170完成

## 验收标准

1. 用户发送消息时自动创建检查点
2. 检查点以标记线形式可视化
3. 支持从任意检查点回滚
4. 支持编辑重试分支
5. 回滚操作有审计日志
