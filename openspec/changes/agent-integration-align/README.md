# Agent模块前后端集成对齐

## Change ID
`agent-integration-align`

## Task
Task 215

## Status
- [ ] 未开始
- [x] 进行中
- [ ] 已完成

## 概述

审查和修复Agent模块的前后端命令对齐问题。

## 文件变更

### Frontend (新建)
- `src/types/agent/intercom.ts`
- `src/types/agent/subagent.ts`

### Frontend (修改)
- `src/features/agent/api/intercom.ts`
- `src/features/agent/services/subagent.ts`
- `src/features/agent/hooks/useAgentIntercom.ts`

### Backend (修改)
- `src-tauri/src/commands/intercom.rs`
- `src-tauri/src/commands/subagent.rs`

## 验收标准
- [ ] 命令契约审查完成
- [ ] TypeScript类型定义生成
- [ ] 参数验证添加
- [ ] cargo build 通过
- [ ] npm run build 通过
- [ ] 类型检查通过
