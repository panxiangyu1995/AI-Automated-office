# Proposal: Agent模块UX增强 - Loading/Empty/Error状态包裹

## 背景

AgentIntercom、ApprovalPilotIntegration、EmployeeDirectory等组件大量使用mock数据且缺少加载状态。第1轮已建立UX基础组件，第3轮将其应用到agent模块。

## 目标

1. 给AgentIntercom添加Loading骨架屏状态
2. 给EmployeeDirectory添加EmptyState(搜索无结果时)
3. 给ChatMessage添加ErrorBoundary包裹
4. 创建AgentSessionPanel的空状态引导

## 变更内容

- `src/features/agent/components/AgentIntercom.tsx` - 添加loading/empty/error状态
- `src/features/agent/components/EmployeeDirectory.tsx` - 添加EmptyState搜索无结果
- `src/features/agent/components/ChatPanel.tsx` - 添加ErrorBoundary包裹
- `src/features/session/components/SessionList.tsx` - 添加EmptyState(无会话时)

## 验收

- 构建通过
- AgentIntercom加载时显示ChatSkeleton
- EmployeeDirectory搜索无结果显示EmptyState
