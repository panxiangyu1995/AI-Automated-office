# Proposal: workspace-layout-presets

## Why

PRD (FR1005-1, FR1005-2) 定义了按工作区恢复状态和布局预设功能，但当前实现仅持久化了布局尺寸（宽度、高度），缺乏：
- 标签页状态保存与恢复
- 筛选条件、AI 面板状态保存
- 布局预设（专注模式、审批模式、起草模式、审计模式）的保存与切换

## What Changes

- 新增 LayoutPreset 数据模型，支持保存和切换布局预设
- 实现预设的创建、编辑、删除、切换操作
- 实现按工作区恢复最近打开的标签、分栏、筛选条件、AI 面板状态
- 提供内置预设：专注模式、审批模式、起草模式、审计模式

## Capabilities

### New Capabilities

- `layout-preset-entity`: 布局预设实体定义
- `layout-preset-crud`: 布局预设 CRUD 操作
- `layout-preset-switching`: 布局预设切换机制
- `workspace-state-recovery`: 按工作区恢复状态（标签、分栏、筛选、AI面板）
- `built-in-presets`: 内置预设定义

## Impact

- 新增 `src/stores/layoutPresetStore.ts` - 布局预设状态管理
- 修改 `src/stores/uiStore.ts` - 扩展状态持久化
- 影响 AppLayout、Workbench、Sidebar 等组件
- 需要 Workspace Phase 1 的 workspaceStore 作为基础
