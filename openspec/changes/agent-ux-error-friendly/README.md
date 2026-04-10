# Agent模块UX错误信息友好化

## Change ID
`agent-ux-error-friendly`

## Task
Task 214

## Status
- [ ] 未开始
- [x] 进行中
- [ ] 已完成

## 概述

优化Agent模块的错误提示，将技术错误转为用户友好的消息。

## 文件变更

### Frontend (新建)
- `src/lib/errors/errTranslator.ts`
- `src/lib/errors/index.ts`

### Frontend (修改)
- `src/features/agent/components/AgentChatPanel.tsx`
- `src/features/agent/components/EmployeeDirectory.tsx`
- `src/features/agent/components/ChatMessage.tsx`
- `src/features/agent/components/SubAgentDelegatePanel.tsx`
- `src/features/agent/components/AgentCreateEditDialog.tsx`

## 依赖
- shadcn/ui toast组件

## 验收标准
- [ ] 错误翻译层创建完成
- [ ] 错误展示友好化
- [ ] 表单实时验证
- [ ] npm run lint 通过
- [ ] npm run build 通过
