# Proposal: 会话故障转移修复

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/agent/components/FailoverSessionRepair.tsx`

**缺失部分**：后端故障转移、会话状态检测、自动修复。

## 目标

完善会话故障转移 (FR17-6至FR17-10)：
1. 实现会话状态检测
2. 实现自动修复机制
3. 实现回滚到检查点
4. 实现会话恢复通知
5. 与前端 FailoverSessionRepair 集成

## 影响范围

### 前端
- `src/features/agent/components/FailoverSessionRepair.tsx` - 集成后端 API

### 后端
- 新增会话故障转移模块

## 依赖

- **前置依赖**: Task 170 (检查点系统Runtime集成)

## 验收标准

1. 会话状态检测能够工作
2. 自动修复能够触发
3. 回滚到检查点能够成功
