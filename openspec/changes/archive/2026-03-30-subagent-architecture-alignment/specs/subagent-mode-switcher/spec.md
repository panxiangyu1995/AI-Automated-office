# subagent-mode-switcher

## Overview

轻量级 ModeSwitcher 组件，集成在聊天输入框旁边，支持快速切换 Agent 和键盘导航。

## Functionality

### Core Features

1. **下拉选择器**
   - 点击触发按钮展开 agent 列表
   - 仅当存在多个可用 agent 时显示
   - 显示当前选中的 agent 名称

2. **键盘导航**
   - `ArrowUp` / `ArrowDown`：上下切换选项
   - `Enter` / `Space`：确认选择
   - `Home` / `End`：跳转首/末选项
   - `Escape`：关闭选择器

3. **切换行为**
   - 选择后自动关闭下拉框
   - 切换后自动聚焦回输入框
   - 触发 `selectAgent` 回调

4. **事件监听**
   - 监听 `openModePicker` 事件（命令触发）
   - 可通过快捷键触发展开

### User Interactions

1. 用户点击 ModeSwitcher 按钮
2. 下拉框展开，显示所有可用 agent
3. 用户通过点击或键盘选择 agent
4. 选择后下拉框关闭，输入框获得焦点

### Data Handling

- 从 session context 获取可用 agents 列表
- 通过 `selectAgent(name)` 更新当前选中的 agent
- 支持 per-session 和全局 agent selection

### Edge Cases

- 只有一个 agent 时不显示切换器
- agent 列表为空时显示 "No agents"
- 切换到不存在的 agent 时回退到默认 agent

## Technical Spec

### Component Structure

```
ModeSwitcher (wrapper)
├── ModeSwitcherTrigger (Button)
└── ModeSwitcherDropdown (Popover)
    └── ModeSwitcherItem (list item)
```

### Props

```typescript
interface ModeSwitcherProps {
  agents: AgentInfo[]
  value: string
  onSelect: (name: string) => void
}
```

### Dependencies

- Shadcn/ui Popover 组件
- Shadcn/ui Button 组件
- lucide-react ChevronDown 图标

## Acceptance Criteria

1. ModeSwitcher 组件在聊天输入框旁边正确渲染
2. 点击按钮展开下拉框
3. 键盘 ↑↓ 可以导航选项
4. Enter 或点击选项可以选中 agent
5. 选中后下拉框关闭并触发 onSelect 回调
6. 只有一个 agent 时不显示组件
7. 支持 openModePicker 事件触发
