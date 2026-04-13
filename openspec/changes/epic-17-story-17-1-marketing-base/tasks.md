# Tasks: Marketing 市场宣传模块基础架构

## Implementation Tasks

### Phase 1: 后端

- [x] 创建 `src-tauri/src/marketing/` 目录
- [x] 实现活动类型和CRUD命令 (Campaign)
- [x] 实现内容类型和CRUD命令 (MarketingContent)
- [x] 实现渠道类型和CRUD命令 (Channel)
- [x] 注册模块到 lib.rs

### Phase 2: 前端

- [x] 创建 `src/features/marketing/` 目录
- [x] 实现类型定义 types/marketing.ts
- [x] 实现 API 封装 api/marketing.ts
- [x] 实现营销主页 MarketingPage.tsx
- [x] 添加路由 /marketing
- [x] 集成Sidebar入口

## Verification

- [x] npm run lint 成功
- [x] npm run build 成功
- [x] 营销模块功能正常

## Notes

- 营销活动、内容、渠道后端已完整实现
- 前端基础 UI 已创建，详细功能在后续迭代
