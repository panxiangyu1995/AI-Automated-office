# Tasks: Story 14.4 库存预警

## 实现类型
- **类型**: new
- **优先级**: medium
- **阶段**: Phase 5 - 核心部门模块

## 任务列表

### Task 1: 定义预警类型
- **描述**: 定义预警相关类型
- **文件**: `src/features/warehouse/types/warning.ts`
- **验收**: 类型定义完整

### Task 2: 实现预警检测命令
- **描述**: 实现库存预警检测命令
- **文件**: `src-tauri/src/commands/warehouse.rs`
- **验收**: 正确检测预警

### Task 3: 实现预警列表查询
- **描述**: 实现预警列表查询和统计
- **文件**: `src-tauri/src/commands/warehouse.rs`
- **验收**: 返回预警列表

### Task 4: 创建预警页面
- **描述**: 实现预警列表页面
- **文件**: `src/features/warehouse/pages/WarningListPage.tsx`
- **验收**: 页面正常显示预警

### Task 5: 集成预警通知
- **描述**: 实现预警推送
- **验收**: 库存不足时收到通知

### Task 6: 集成 AI 预警能力
- **描述**: 注册 AI 预警能力
- **文件**: `src/lib/pluginCapabilities.ts`
- **验收**: AI 可回答补货问题

## 测试要点

- [ ] 单元测试: 预警规则逻辑
- [ ] 集成测试: 预警检测
- [ ] E2E 测试: 预警流程
- [ ] 浏览器测试: UI 展示

## 依赖追踪

| 前置依赖 | 说明 |
|----------|------|
| Story 14.1 | 依赖库存数据 |
