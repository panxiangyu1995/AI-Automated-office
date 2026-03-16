# Proposal: 可切换TopBar菜单栏

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

AI-Automated-office 作为一款 AI 赋能的 ERP 系统，需要同时服务技术用户和传统办公用户。

**用户需求分析：**
- 技术用户：习惯使用命令面板和快捷键，追求简洁界面
- 传统办公用户：期待传统的桌面应用菜单，需要可发现的功能入口

**解决方案：**
参考 VSCode 的可切换菜单栏设计，提供一个可以通过快捷键切换显示/隐藏的 TopBar 菜单系统，既满足传统用户的功能发现需求，又保持技术用户偏好的简洁界面。

## 目标

实现完整的可切换 TopBar 菜单栏系统：
- **7个主菜单**：File、Edit、View、Agent、Plugins、Tools、Help
- **右侧布局控制按钮**：4 个与 VSCode 对齐的按钮（自定义布局、切换左侧栏、切换面板、切换辅助侧栏）
- **快捷键切换**：Ctrl+Shift+M / Cmd+Shift+M 切换显示/隐藏
- **状态持久化**：记住用户的显示偏好
- **完整功能覆盖**：涵盖应用的核心功能入口

## 范围

### 包含
- TopBar 组件实现（Shadcn/ui Menubar）
- 7个主菜单及其子菜单项
- **右侧 4 个布局控制按钮**（与 VSCode 对齐）
  - 自定义布局按钮（打开布局对话框）
  - 切换左侧栏按钮（显示/隐藏 Sidebar，快捷键 Ctrl+B）
  - 切换面板按钮（显示/隐藏底部面板，当前禁用预留）
  - 切换辅助侧栏按钮（显示/隐藏 AI Chat Panel，快捷键 Ctrl+Shift+I）
- 快捷键系统（Ctrl+Shift+M、Ctrl+B、Ctrl+Shift+I）
- 状态持久化（localStorage）
- 视觉设计（符合 UX 规范的颜色系统）
- 菜单图标（Lucide React）
- **按钮 Tooltip 提示**（使用 Shadcn/ui Tooltip 组件）

### 不包含
- 各菜单项的具体功能实现（调用现有功能）
- 系统原生菜单栏（Tauri native menu）

## 影响范围

### 前端
- 新增组件：`src/components/layout/TopBar.tsx`
- 更新布局：`src/components/layout/AppLayout.tsx`
- 状态管理：`src/stores/uiStore.ts`
- 样式：Tailwind CSS 配置更新

### 后端
- 无（纯前端功能）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Shadcn/ui Menubar 组件不兼容 | 低 | 中 | 提前验证组件可用性 |
| 快捷键与现有系统冲突 | 低 | 低 | 检查现有快捷键列表 |
| 状态持久化失败 | 低 | 低 | 添加错误处理和降级方案 |

## 依赖

- **前置依赖**: Story 1.4（VSCode 四栏布局）
- **后置依赖**: 各菜单项对应的功能模块

## 验收标准

- [ ] TopBar 默认显示在应用最顶部
- [ ] 包含 File、Edit、View、Agent、Plugins、Tools、Help 七个菜单
- [ ] TopBar 右侧包含 4 个布局控制按钮（与 VSCode 对齐）
- [ ] 自定义布局按钮可点击（功能后续实现）
- [ ] 切换左侧栏按钮可切换 Sidebar，状态同步高亮
- [ ] 切换面板按钮处于禁用状态（预留未来扩展）
- [ ] 切换辅助侧栏按钮可切换 AI Chat Panel，状态同步高亮
- [ ] 所有按钮有 Tooltip 提示
- [ ] 通过 Ctrl+Shift+M 可切换 TopBar 显示/隐藏
- [ ] 通过 Ctrl+B 可切换左侧栏
- [ ] 通过 Ctrl+Shift+I 可切换辅助侧栏
- [ ] 隐藏状态被持久化到 localStorage
- [ ] 所有菜单项的快捷键正确显示
- [ ] 视觉设计符合 UX 规范的颜色系统
- [ ] 使用 Shadcn/ui Menubar、Tooltip、Button 组件实现
- [ ] 菜单项和按钮使用 Lucide React 图标
