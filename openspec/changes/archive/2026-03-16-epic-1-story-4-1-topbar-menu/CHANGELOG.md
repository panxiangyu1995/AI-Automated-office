# Changelog: 可切换TopBar菜单栏

## [Unreleased]

### Added
- 新增可切换的 TopBar 菜单栏组件
- 新增 7 个主菜单：File、Edit、View、Agent、Plugins、Tools、Help
- 新增 Ctrl+Shift+M / Cmd+Shift+M 快捷键切换菜单栏显示/隐藏
- 新增 TopBar 显示状态持久化到 localStorage
- 新增首次启动提示，告知用户快捷键功能
- **新增 TopBar 右侧 4 个布局控制按钮（与 VSCode 对齐）**
  - 自定义布局按钮（LayoutTemplate 图标）
  - 切换左侧栏按钮（PanelLeft 图标，快捷键 Ctrl+B）
  - 切换面板按钮（PanelBottom 图标，当前禁用，预留）
  - 切换辅助侧栏按钮（PanelRight 图标，快捷键 Ctrl+Shift+I）
- 新增按钮 Tooltip 提示功能
- 新增按钮激活状态样式（面板显示时高亮）

### Changed
- 更新 `src/stores/uiStore.ts`：添加 `topBarVisible` 状态和 `toggleTopBar()` 方法
- 更新 `src/components/layout/AppLayout.tsx`：集成 TopBar 组件
- 更新 `src/App.tsx`：添加首次启动提示
- **TopBar 布局改为左右分隔（flex justify-between）**
- **TopBar 组件新增 `onOpenLayoutDialog` 回调属性**

### Technical Details
- 使用 Shadcn/ui Menubar、Tooltip、Button 组件
- 使用 Lucide React 图标（包括 LayoutTemplate、PanelLeft、PanelBottom、PanelRight）
- 菜单样式符合 UX 设计规范（#1E3A5F 品牌色）
- TopBar 高度 32px，位于应用最顶部
- 按钮尺寸 24x24px，激活状态使用 #3A5A83 高亮色

## Coverage

### Functional Requirements
- FR8-1: 应用顶部提供可切换的菜单栏
- FR8-2: 用户可以通过快捷键切换菜单栏的显示/隐藏状态
- FR8-3: 系统会记住用户的菜单栏显示偏好
- FR8-4: File 菜单提供文件操作功能
- FR8-5: Edit 菜单提供编辑功能
- FR8-6: View 菜单提供视图控制功能
- FR8-7: Agent 菜单提供 AI 核心功能
- FR8-8: Plugins 菜单提供插件管理功能
- FR8-9: Tools 菜单提供开发者工具
- FR8-10: Help 菜单提供帮助与关于
- **FR8-11: TopBar 右侧提供 4 个布局控制按钮，与 VSCode 对齐**
- **FR8-12: 自定义布局按钮打开布局自定义对话框**
- **FR8-13: 切换左侧栏按钮显示/隐藏左侧 Sidebar（快捷键 Ctrl+B）**
- **FR8-14: 切换面板按钮显示/隐藏底部面板（当前禁用，预留）**
- **FR8-15: 切换辅助侧栏按钮显示/隐藏右侧 AI Chat Panel（快捷键 Ctrl+Shift+I）**
