# Tasks: workbench-tab-system

## 实现类型

- **类型**: new
- **优先级**: high
- **阶段**: Phase X - L3 多标签页系统
- **状态**: ✅ 已完成 (2026-04-10)

## 任务列表

### Task 1: 创建 workbenchStore

**描述**: 创建 Tab 状态管理 store

**文件**:
- `src/stores/workbenchStore.ts`

**验收**:
- [x] 定义 WorkbenchTab 和 WorkbenchState 接口
- [x] 实现 tab CRUD 操作（addTab, removeTab, setActiveTab）
- [x] 实现 reorderTabs 拖拽重排
- [x] 实现 closeOtherTabs, closeAllTabs
- [x] 实现 getTabById, getActiveTab 辅助方法
- [x] Zustand persist 配置（可选）

**子任务**:
- [x] 1.1 定义 TypeScript 接口
- [x] 1.2 实现状态和操作
- [x] 1.3 添加 persist 配置
- [x] 1.4 导出 store 和类型

### Task 2: 创建 Tab 组件

**描述**: 创建单个 Tab 组件

**文件**:
- `src/components/common/Tab.tsx`

**验收**:
- [x] 显示 Tab 图标、标题
- [x] 显示未保存指示器（dirty 圆点）
- [x] 显示关闭按钮
- [x] 激活状态样式
- [x] Hover 效果

**子任务**:
- [x] 2.1 定义 TabProps 接口
- [x] 2.2 实现 Tab 结构
- [x] 2.3 实现样式和状态
- [x] 2.4 实现关闭按钮逻辑
- [x] 2.5 实现未保存指示器

### Task 3: 创建 TabBar 组件

**描述**: 创建 Tab 容器组件，管理多个 Tab

**文件**:
- `src/components/common/TabBar.tsx`

**验收**:
- [x] 横向排列 Tab
- [x] Tab 溢出时显示滚动按钮
- [x] 点击 Tab 切换激活状态
- [x] 支持右键菜单（关闭、关闭其他）

**子任务**:
- [x] 3.1 定义 TabBarProps 接口
- [x] 3.2 实现 Tab 列表渲染
- [x] 3.3 实现溢出滚动逻辑
- [x] 3.4 实现滚动按钮
- [x] 3.5 集成 workbenchStore

### Task 4: 创建 WorkbenchTabs 管理器

**描述**: 创建 Tab 管理器，协调 TabBar 和内容区

**文件**:
- `src/components/common/WorkbenchTabs.tsx`

**验收**:
- [x] 使用 useWorkbenchStore 获取状态
- [x] 根据 activeTabId 渲染对应内容
- [x] 处理空状态（无 Tab）
- [x] 提供 openTab, closeTab, setActiveTab 快捷方法

**子任务**:
- [x] 4.1 定义 WorkbenchTabsProps 接口
- [x] 4.2 实现空状态处理
- [x] 4.3 实现 Tab 内容渲染逻辑
- [x] 4.4 导出快捷方法

### Task 5: 集成到 Workbench 组件

**描述**: 修改 Workbench.tsx，集成 Tab 栏

**文件**:
- `src/components/common/Workbench.tsx`

**验收**:
- [x] TabBar 显示在工作区顶部
- [x] 内容区渲染当前激活 Tab 的内容
- [x] 布局结构符合 L3 规范

**子任务**:
- [x] 5.1 导入 TabBar 和 WorkbenchTabs
- [x] 5.2 修改布局结构
- [x] 5.3 测试 Tab 切换

### Task 6: 导出组件

**描述**: 更新 common/index.ts 导出新组件

**文件**:
- `src/components/common/index.ts`

**验收**:
- [x] 导出 Tab, TabBar, WorkbenchTabs

## 测试要点

- [x] 单元测试: workbenchStore 的 CRUD 操作
- [x] 单元测试: Tab 组件渲染
- [x] 集成测试: Tab 切换逻辑
- [x] E2E 测试: Tab 多标签页完整流程
- [x] 浏览器测试: Tab UI 渲染和交互

## 验收标准

1. [x] 可以在工作区同时打开多个 Tab
2. [x] 点击 Tab 可以切换内容
3. [x] 点击关闭按钮可以关闭 Tab
4. [x] 有未保存内容时显示圆点指示器
5. [x] 关闭有未保存内容的 Tab 时弹出确认
6. [x] Tab 超出容器宽度时显示滚动按钮
7. [x] 关闭当前 Tab 后自动激活相邻 Tab

## 实现文件清单

```
新建文件：
├── src/stores/workbenchStore.ts       # Tab 状态管理
├── src/components/common/Tab.tsx     # 单个 Tab 组件
├── src/components/common/TabBar.tsx  # Tab 容器组件
└── src/components/common/WorkbenchTabs.tsx  # Tab 管理器

修改文件：
├── src/components/common/Workbench.tsx  # 集成 TabBar
└── src/components/common/index.ts       # 导出新组件
```
