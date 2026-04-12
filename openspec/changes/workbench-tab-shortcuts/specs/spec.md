# Specification: workbench-tab-shortcuts

## 需求来源

### UX 规范

依据 `ux-design-specification.md` 第 937-1023 行 **"工作台层级导航体系 (L1–L4)"** 中 L3 多标签页规范：

> **标签页行为：**
> - 切换标签：点击 Tab 或使用 `Ctrl+Tab` / `Ctrl+Shift+Tab` 快捷键
> - 关闭标签：点击 `×` 关闭当前 Tab，支持 `Ctrl+W` 关闭

## 功能规格

### 用户故事

As a **用户**,
I want **使用键盘快捷键操作 Tab**,
So that **可以不离开键盘完成所有 Tab 操作，提高工作效率**。

### 验收场景

#### Scenario 1: 键盘切换 Tab

- **GIVEN** 用户有多个打开的 Tab
- **WHEN** 用户按下 `Ctrl+Tab`
- **THEN** 系统激活下一个 Tab

#### Scenario 2: 键盘关闭 Tab

- **GIVEN** 用户打开了 Tab
- **WHEN** 用户按下 `Ctrl+W`
- **THEN** 系统关闭当前 Tab 并激活相邻 Tab

#### Scenario 3: 数字键切换 Tab

- **GIVEN** 用户有多个打开的 Tab
- **WHEN** 用户按下 `Ctrl+3`
- **THEN** 系统激活第 3 个 Tab

#### Scenario 4: 输入框中不触发

- **GIVEN** 用户焦点在输入框中
- **WHEN** 用户按下 `Ctrl+Tab`
- **THEN** 系统不切换 Tab，输入框正常工作

## 快捷键规格

| 快捷键 | 操作 | 描述 |
|--------|------|------|
| `Ctrl+Tab` | nextTab | 切换到下一个 Tab |
| `Ctrl+Shift+Tab` | prevTab | 切换到上一个 Tab |
| `Ctrl+W` | closeTab | 关闭当前 Tab |
| `Ctrl+T` | newTab | 新建空白 Tab |
| `Ctrl+1` | gotoTab1 | 切换到第 1 个 Tab |
| `Ctrl+2` | gotoTab2 | 切换到第 2 个 Tab |
| `Ctrl+3` | gotoTab3 | 切换到第 3 个 Tab |
| `Ctrl+4` | gotoTab4 | 切换到第 4 个 Tab |
| `Ctrl+5` | gotoTab5 | 切换到第 5 个 Tab |
| `Ctrl+6` | gotoTab6 | 切换到第 6 个 Tab |
| `Ctrl+7` | gotoTab7 | 切换到第 7 个 Tab |
| `Ctrl+8` | gotoTab8 | 切换到第 8 个 Tab |
| `Ctrl+9` | gotoTab9 | 切换到第 9 个 Tab |
| `Ctrl+Shift+O` | closeOtherTabs | 关闭其他 Tab |

## 边界条件

1. **只有一个 Tab**: `Ctrl+Tab` 不做任何操作
2. **在最后一个 Tab**: `Ctrl+Tab` 循环到第一个 Tab
3. **在第一个 Tab**: `Ctrl+Shift+Tab` 循环到最后一个 Tab
4. **超出范围的数字键**: 不做任何操作

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 没有可关闭的 Tab | Ctrl+W 不做任何操作 |
| Tab 渲染失败 | 仍可使用快捷键切换/关闭 |
