# Tasks: Story 14.6 仓储位置管理

## 实现类型
- **类型**: new
- **优先级**: medium
- **阶段**: Phase 5 - 核心部门模块

## 任务列表

### Task 1: 定义库位类型
- **描述**: 定义库位相关类型
- **文件**: `src/features/warehouse/types/location.ts`
- **验收**: 类型定义完整

### Task 2: 实现库位 CRUD 命令
- **描述**: 实现库位创建、查询、更新命令
- **文件**: `src-tauri/src/commands/warehouse.rs`
- **验收**: 库位 CRUD 正常

### Task 3: 创建库位管理页面
- **描述**: 实现库位列表页面
- **文件**: `src/features/warehouse/pages/LocationListPage.tsx`
- **验收**: 页面正常显示库位

### Task 4: 实现商品库位分配
- **描述**: 实现商品分配到库位
- **验收**: 可分配商品

## 测试要点

- [ ] 单元测试: 库位编码生成
- [ ] 集成测试: 库位 CRUD
- [ ] 浏览器测试: UI 交互

## 依赖追踪

| 前置依赖 | 说明 |
|----------|------|
| Story 14.1 | 依赖商品数据 |
