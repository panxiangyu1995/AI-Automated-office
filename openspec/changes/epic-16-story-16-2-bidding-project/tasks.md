# Tasks: Bidding 投标项目管理

## Implementation Tasks

### Phase 1: 后端

- [x] 创建投标项目类型 (TenderProject, TenderStatus)
- [x] 实现项目管理命令 (create, list, get, update, delete, stats)
- [x] 注册到 lib.rs

### Phase 2: 前端

- [x] 添加投标项目类型定义
- [x] 添加投标项目 API 封装
- [x] 前端基础已就绪 (详细UI在后续迭代)

## Verification

- [x] npm run lint 成功
- [x] npm run build 成功
- [x] 投标项目管理功能正常

## Dependencies

- Story 16.1: 招投标基础架构

## Notes

- 投标项目管理后端已完整实现
- 前端 API 已准备好，待集成 UI
- 项目状态机: preparing -> bidding -> waiting_result -> won/lost/cancelled
