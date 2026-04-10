# Agent模块unwrap消除

## Change ID
`agent-unwrap-elimination`

## Task
Task 212

## Status
- [ ] 未开始
- [x] 进行中
- [ ] 已完成

## 概述

消除Agent模块中的unwrap()滥用问题，将200+处unwrap改为?或match错误处理。

## 文件变更

### Backend
- `src-tauri/src/agent/subagent/manager.rs`
- `src-tauri/src/agent/failover.rs`
- `src-tauri/src/agent/routing.rs`
- `src-tauri/src/agent/monitoring.rs`
- `src-tauri/src/agent/tools/browser.rs`
- `src-tauri/src/agent/tools/registry.rs`
- `src-tauri/src/agent/subagent/personal_loader.rs`

## 依赖
- thiserror crate

## 验收标准
- [ ] AgentError类型定义完成
- [ ] 主要模块unwrap消除
- [ ] cargo clippy 无警告
- [ ] cargo test 通过
