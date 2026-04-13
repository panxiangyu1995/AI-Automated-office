# Tasks: Workspace 工作台基础架构

## Implementation Tasks

### Phase 1: 后端

- [x] 创建 `src-tauri/src/workspace/` 目录
- [x] 实现布局预设 CRUD
- [x] 实现日清列表 CRUD
- [x] 实现任务聚合查询
- [x] 注册模块到 lib.rs

### Phase 2: 前端

- [x] 创建 `src/features/workspace/` 目录
- [x] 实现类型定义 types/workspace.ts
- [x] 实现 API 封装 api/workspace.ts

## Verification

- [x] npm run lint 成功
- [x] npm run build 成功
- [x] 工作台 API 正常

## Notes

- 后端 workspace 模块已完整实现
- 前端 API 已准备好，详细 UI 在后续迭代
- 日清任务支持按模块、优先级、状态筛选
- 任务聚合支持跨模块统计
