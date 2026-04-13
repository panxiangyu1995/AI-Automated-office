# Tasks: Bidding 招投标模块基础架构

## Overview

本任务实现招投标模块的基础架构，包括资质库管理和业绩库管理。

## Implementation Tasks

### Phase 1: 后端基础

- [x] 创建 `src-tauri/src/tender/` 目录
- [x] 创建 `mod.rs` 模块入口
- [x] 定义 `Qualification` 结构体
- [x] 定义 `Case` 结构体
- [x] 定义请求/响应类型
- [x] 创建数据库层 `db.rs`
- [x] 创建 Tauri 命令 `commands.rs`
- [x] 注册模块到 `lib.rs`

### Phase 2: 前端基础

- [x] 创建 `src/features/tender/` 目录结构
- [x] 定义 TypeScript 类型 `types/tender.ts`
- [x] 创建 API 封装 `api/tender.ts`
- [x] 创建 `TenderPage` 页面
- [x] 添加路由 `/tender`
- [x] 添加侧边栏入口

## Verification

- [x] npm run lint 成功
- [x] npm run build 成功
- [x] tender 模块可访问

## Notes

- 后端使用内存存储，后续可迁移到 SQLite
- 前端基础 UI 已创建，详细功能在后续 Story 实现
- Rust 模块已注册，命令已挂载到 Tauri
