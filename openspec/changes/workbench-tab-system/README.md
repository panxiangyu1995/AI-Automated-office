# README: workbench-tab-system

## 概述

实现 L3 工作区多标签页（Tab）能力，支持同时打开多个文件、报表、详情，统一在工作区显示。

## 规范依据

依据 UX 设计规范 **"工作台层级导航体系 (L1–L4)"** 第 937-1023 行定义：

- **L1**: ActivityBar（最左侧图标选项栏）
- **L2**: Sidebar（L1 右侧侧边栏）
- **L3**: Workbench（**最中间工作区，支持多标签页**）
- **L4**: Bottom Panel（底部面板）

## 核心变更

1. 新增 `workbenchStore.ts` — Tab 状态管理
2. 新增 `TabBar.tsx` — 多标签页容器组件
3. 新增 `Tab.tsx` — 单个 Tab 组件
4. 新增 `WorkbenchTabs.tsx` — 工作区 Tab 管理器

## 影响范围

- 修改 `src/components/common/Workbench.tsx`
- 修改 `src/stores/uiStore.ts`
- 新增 `src/stores/workbenchStore.ts`
- 新增 `src/components/common/TabBar.tsx`
- 新增 `src/components/common/Tab.tsx`
- 新增 `src/components/common/WorkbenchTabs.tsx`

## 依赖

- 无前置依赖
- 后续由 `workbench-tab-integration` 集成到路由系统
