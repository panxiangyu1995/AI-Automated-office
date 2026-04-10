# Agent模块TODO清理与调试代码移除

## Change ID
`agent-todo-cleanup`

## Task
Task 213

## Status
- [ ] 未开始
- [ ] 进行中
- [x] 已完成

## 概述

清理Agent模块中的TODO遗留和调试代码：
1. intercom内容安全检查 ✅
2. message_sync同步逻辑 ✅
3. heartbeat HTTP客户端 ✅
4. 前端console.log移除 ✅
5. 后端println!/dbg!移除 ✅

## 文件变更

### Backend
- `src-tauri/src/agent/intercom/mod.rs` - 内容安全检查
- `src-tauri/src/agent/intercom/service.rs` - 内容安全检查
- `src-tauri/src/agent/message_sync.rs` - 同步逻辑
- `src-tauri/src/agent/heartbeat/delivery.rs` - HTTP客户端

### Frontend
- 所有前端文件的 console.log 已移除

## 验收标准
- [x] intercom内容安全检查实现
- [x] message_sync同步逻辑实现
- [x] heartbeat HTTP客户端实现
- [x] 所有console.log移除
- [x] 所有println!/dbg!移除
- [ ] npm run lint 通过（待验证）
- [ ] cargo build 通过（待验证）
