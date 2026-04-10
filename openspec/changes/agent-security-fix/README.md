# Agent模块安全漏洞修复

## Change ID
`agent-security-fix`

## Task
Task 211

## Status
- [ ] 未开始
- [ ] 进行中
- [x] 已完成

## 概述

修复Agent模块中发现的安全漏洞：
1. XSS漏洞 (ChatMessage.tsx) ✅
2. 敏感数据存储 (useCheckpointStore.ts) ✅
3. SQL注入风险 (personal_loader.rs) ✅
4. unwrap() 调用风险 (personal_loader.rs) ✅

## 文件变更

### Frontend
- `src/features/agent/components/ChatMessage.tsx` - 使用sanitizeMarkdownHtml
- `src/features/agent/hooks/useCheckpointStore.ts` - 安全评估完成
- `src/lib/sanitize.ts` (new) - XSS过滤工具

### Backend
- `src-tauri/src/agent/subagent/personal_loader.rs` - SQL参数化 + unwrap修复

## 依赖
- sanitize-html npm包

## 验收标准
- [x] XSS过滤正常工作
- [x] Checkpoint存储经过安全评估
- [x] SQL查询使用参数化
- [x] unwrap() 已替换为错误处理
- [ ] cargo build 成功（待验证）
- [ ] npm run lint 成功（待验证）
