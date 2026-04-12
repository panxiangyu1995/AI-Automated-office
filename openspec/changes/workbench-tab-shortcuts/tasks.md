# Tasks: workbench-tab-shortcuts

## 实现类型

- **类型**: new
- **优先级**: medium
- **阶段**: Phase X - L3 多标签页系统
- **状态**: ✅ 已完成 (2026-04-10)

## 前置依赖

- `workbench-tab-system`（已完成）

## 任务列表

### Task 1: 创建 useTabShortcuts Hook

**描述**: 创建 Tab 快捷键处理 Hook

**文件**:
- `src/hooks/useTabShortcuts.ts`

**验收**:
- [x] 实现焦点检测函数
- [x] 实现 Ctrl+Tab 切换下一个 Tab
- [x] 实现 Ctrl+Shift+Tab 切换上一个 Tab
- [x] 实现 Ctrl+W 关闭当前 Tab
- [x] 实现 Ctrl+1~9 切换到第 N 个 Tab
- [x] 实现 Ctrl+T 新建 Tab
- [x] 实现 Ctrl+Shift+O 关闭其他 Tab

**子任务**:
- [x] 1.1 创建焦点检测函数 isInputElement
- [x] 1.2 实现 useTabShortcuts Hook
- [x] 1.3 添加事件清理逻辑
- [x] 1.4 导出 Hook

### Task 2: 集成到 TabBar

**描述**: 在 TabBar 组件中集成快捷键 Hook

**文件**:
- `src/components/common/TabBar.tsx`

**验收**:
- [x] 在 TabBar 中调用 useTabShortcuts
- [x] 验证快捷键生效

**子任务**:
- [x] 2.1 导入 useTabShortcuts
- [x] 2.2 在组件中调用 Hook
- [x] 2.3 测试快捷键

### Task 3: 处理快捷键冲突

**描述**: 处理与其他功能的快捷键冲突

**文件**:
- `src/hooks/useTabShortcuts.ts`

**验收**:
- [x] 检测并处理与浏览器默认行为冲突
- [x] 添加冲突提示

**子任务**:
- [x] 3.1 阻止浏览器默认 Tab 切换
- [x] 3.2 添加冲突日志

## 测试要点

- [x] 单元测试: useTabShortcuts Hook
- [x] 单元测试: 焦点检测函数
- [x] E2E 测试: Tab 快捷键完整流程
- [x] 浏览器测试: 快捷键交互

## 验收标准

1. [x] Ctrl+Tab 可以切换到下一个 Tab
2. [x] Ctrl+Shift+Tab 可以切换到上一个 Tab
3. [x] Ctrl+W 可以关闭当前 Tab
4. [x] Ctrl+1~9 可以切换到对应位置的 Tab
5. [x] 在输入框中按快捷键不会触发 Tab 操作
6. [x] 关闭最后一个 Tab 后显示空工作区

## 实现文件清单

```
新建文件：
└── src/hooks/useTabShortcuts.ts   # Tab 快捷键 Hook

修改文件：
└── src/components/common/TabBar.tsx  # 集成 useTabShortcuts
```

## 快捷键定义

| 快捷键 | 操作 | 说明 |
|--------|------|------|
| `Ctrl+Tab` | nextTab | 切换到下一个 Tab |
| `Ctrl+Shift+Tab` | prevTab | 切换到上一个 Tab |
| `Ctrl+W` | closeTab | 关闭当前 Tab |
| `Ctrl+T` | newTab | 新建空白 Tab |
| `Ctrl+Shift+O` | closeOtherTabs | 关闭其他 Tab |
| `Ctrl+1~9` | gotoTab | 切换到第 N 个 Tab |
